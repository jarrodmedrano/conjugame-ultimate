import { listStoriesForUser } from '@repo/database'
import pool from '../../../../utils/open-pool'
import {
  requireAuth,
  verifyOwnership,
} from '../../../../../lib/auth-middleware'
import { NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '../../../../../lib/rate-limit'

/**
 * List stories for a user (authenticated users can only access their own stories)
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
    // Verify ownership - users can only access their own stories
    const authzError = verifyOwnership(user.id, userId)
    if (authzError) return authzError

    // Get pagination params from query string
    const url = new URL(request.url)
    const limit = url.searchParams.get('limit') || '10'
    const offset = url.searchParams.get('offset') || '0'

    // Validate pagination params
    const limitNum = parseInt(limit, 10)
    const offsetNum = parseInt(offset, 10)

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (must be 1-100)' },
        { status: 400 },
      )
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter (must be >= 0)' },
        { status: 400 },
      )
    }

    const client = await pool.connect()

    try {
      const stories = await listStoriesForUser(client, {
        userid: userId,
        limit: limitNum.toString(),
        offset: offsetNum.toString(),
      })

      return NextResponse.json(stories, { status: 200 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error fetching user stories:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 },
    )
  }
}
