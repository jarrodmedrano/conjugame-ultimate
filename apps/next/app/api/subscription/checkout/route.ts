import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/auth-middleware'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'
import { stripe } from '../../../../lib/stripe'
import pool from '../../../utils/open-pool'
import { getSubscriptionByUserId, upsertSubscription } from '@repo/database'

/**
 * Create a Stripe Checkout session for the monthly subscription.
 * Returns { url } to redirect the user to Stripe-hosted checkout.
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_MONTHLY_PRICE_ID) {
    return NextResponse.json(
      { error: 'Subscription not configured' },
      { status: 500 },
    )
  }

  try {
    const client = await pool.connect()
    try {
      // Retrieve or create Stripe customer ID
      let stripeCustomerId: string | undefined
      const existing = await getSubscriptionByUserId(client, {
        userId: user.id,
      })

      if (existing?.stripeCustomerId) {
        stripeCustomerId = existing.stripeCustomerId
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          ...(user.name ? { name: user.name } : {}),
          metadata: { userId: user.id },
        })
        stripeCustomerId = customer.id

        // Persist the customer ID early so webhooks can look it up
        await upsertSubscription(client, {
          id: `pending_${user.id}`,
          userId: user.id,
          stripeCustomerId,
          status: 'inactive',
          priceId: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        })
      }

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        'http://localhost:3000'

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_MONTHLY_PRICE_ID,
            quantity: 1,
          },
        ],
        // Store userId in session metadata for webhook lookup
        metadata: { userId: user.id },
        success_url: `${appUrl}/${user.id}/subscription?success=true`,
        cancel_url: `${appUrl}/about/pricing?canceled=true`,
      })

      return NextResponse.json({ url: session.url })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error creating checkout session:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    )
  }
}
