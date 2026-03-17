import { getUser } from '@repo/database'
import pool from '../../../utils/open-pool'
import { requireAuth, verifyOwnership } from '../../../../lib/auth-middleware'
import { NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'

/**
 * Get user by ID (authenticated users can only access their own profile)
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ userId: string }> },
) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  // Require authentication
  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error

  const { user } = authResult
  const params = await props.params
  const { userId } = params

  try {
    // Verify ownership - users can only access their own profile
    const authzError = verifyOwnership(user.id, userId)
    if (authzError) return authzError

    const client = await pool.connect()

    try {
      const userRequest = await getUser(client, { id: userId })

      if (!userRequest) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json(userRequest, { status: 200 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error fetching user:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
