import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/auth-middleware'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'
import pool from '../../../utils/open-pool'
import { getSubscriptionByUserId } from '@repo/database'
import { PREVIEW_LIMITS } from '../../../../lib/subscription'

/**
 * GET /api/subscription/status
 * Returns the authenticated user's subscription status and quota info.
 */
export async function GET(request: NextRequest) {
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

      const isActive =
        subscription?.status === 'active' || subscription?.status === 'trialing'

      return NextResponse.json({
        subscribed: isActive,
        status: subscription?.status ?? 'inactive',
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
        currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
        previewLimits: PREVIEW_LIMITS,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error fetching subscription status:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 },
    )
  }
}
