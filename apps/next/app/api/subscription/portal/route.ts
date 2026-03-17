import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/auth-middleware'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'
import { stripe } from '../../../../lib/stripe'
import pool from '../../../utils/open-pool'
import { getSubscriptionByUserId } from '@repo/database'

/**
 * Create a Stripe Customer Portal session so the user can manage or cancel
 * their subscription. Returns { url } to redirect to Stripe-hosted portal.
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  try {
    const client = await pool.connect()
    try {
      const subscription = await getSubscriptionByUserId(client, {
        userId: user.id,
      })

      if (!subscription?.stripeCustomerId) {
        return NextResponse.json(
          { error: 'No subscription found' },
          { status: 404 },
        )
      }

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        'http://localhost:3000'

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${appUrl}/${
          user.id || encodeURIComponent(user.email)
        }/subscription`,
      })

      return NextResponse.json({ url: portalSession.url })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error creating portal session:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 },
    )
  }
}
