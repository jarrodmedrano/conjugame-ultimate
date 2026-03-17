import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '../../../../lib/stripe'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'
import pool from '../../../utils/open-pool'
import {
  upsertSubscription,
  updateSubscriptionStatus,
  getSubscriptionByStripeCustomerId,
} from '@repo/database'

/**
 * In Stripe API version 2025+, current_period_end moved from the Subscription
 * object to the SubscriptionItem level. This helper reads from the item first
 * and falls back to the top-level field for older API versions.
 */
function getSubscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const item = sub.items.data[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number })
    | undefined
  const ts =
    item?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end
  return ts ? new Date(ts * 1000) : null
}

/**
 * Stripe webhook handler.
 * Verifies the webhook signature and syncs subscription state to the database.
 *
 * Events handled:
 *   checkout.session.completed        → activate subscription
 *   customer.subscription.updated     → sync status/period
 *   customer.subscription.deleted     → mark canceled
 *   invoice.payment_failed            → mark past_due
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.expensive)
  if (rateLimitResult) return rateLimitResult

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 },
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (error) {
    console.error(
      'Webhook signature verification failed:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const subscriptionId = session.subscription as string
        const customerId = session.customer as string
        // userId stored in session metadata during checkout creation
        const userId = session.metadata?.userId

        if (!userId || !subscriptionId) break

        // Fetch full subscription details from Stripe
        const sub = await stripe.subscriptions.retrieve(subscriptionId)

        await upsertSubscription(client, {
          id: sub.id,
          userId,
          stripeCustomerId: customerId,
          status: sub.status,
          priceId: sub.items.data[0]?.price?.id ?? null,
          currentPeriodEnd: getSubscriptionPeriodEnd(sub),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        const existing = await getSubscriptionByStripeCustomerId(client, {
          stripeCustomerId: customerId,
        })
        if (!existing) break

        await updateSubscriptionStatus(client, {
          userId: existing.userId,
          status: sub.status,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          currentPeriodEnd: getSubscriptionPeriodEnd(sub),
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        const existing = await getSubscriptionByStripeCustomerId(client, {
          stripeCustomerId: customerId,
        })
        if (!existing) break

        await updateSubscriptionStatus(client, {
          userId: existing.userId,
          status: 'canceled',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null,
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
        }
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : (invoice.customer as Stripe.Customer | null)?.id

        if (!customerId) break

        const existing = await getSubscriptionByStripeCustomerId(client, {
          stripeCustomerId: customerId,
        })
        if (!existing) break

        await updateSubscriptionStatus(client, {
          userId: existing.userId,
          status: 'past_due',
          cancelAtPeriodEnd: existing.cancelAtPeriodEnd ?? false,
          currentPeriodEnd: existing.currentPeriodEnd,
        })
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(
      'Error processing webhook:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
