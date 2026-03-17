import { getStory } from '@repo/database'
import pool from '../../../utils/open-pool'
import { requireAuth, verifyOwnership } from '../../../../lib/auth-middleware'
import { NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'

/**
 * Get a story by ID (authenticated users can only access their own stories)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  // Require authentication
  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error

  const { user } = authResult
  const { slug } = await params

  try {
    const storyId = parseInt(slug, 10)
    if (isNaN(storyId)) {
      return NextResponse.json({ error: 'Invalid story ID' }, { status: 400 })
    }

    const client = await pool.connect()

    try {
      const story = await getStory(client, { id: storyId })

      if (!story) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 })
      }

      // Verify ownership - users can only access their own stories
      const authzError = verifyOwnership(user.id, story.userid)
      if (authzError) return authzError

      return NextResponse.json(story, { status: 200 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error fetching story:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to fetch story' },
      { status: 500 },
    )
  }
}
