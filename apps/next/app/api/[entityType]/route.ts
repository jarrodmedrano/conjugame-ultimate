import { listPublicStories } from '@repo/database'
import pool from '../../utils/open-pool'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '../../../lib/rate-limit'

const ALLOWED_ENTITY_TYPES = ['stories'] as const
type AllowedEntityType = (typeof ALLOWED_ENTITY_TYPES)[number]

interface EntityGridItem {
  id: number
  title: string
  content: string | null
  slug: string | null
  userId: string
  primaryImageUrl: string | null
  href: string
}

/**
 * GET /api/[entityType]?limit=20&offset=0
 * Public endpoint — no auth required.
 * Returns a paginated grid of public entities (stories for now).
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ entityType: string }> },
) {
  // 1. RATE LIMITING (MANDATORY — expensive config for public grid queries)
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.expensive)
  if (rateLimitResult) return rateLimitResult

  const params = await props.params
  const { entityType } = params

  // 2. Validate entityType
  if (!(ALLOWED_ENTITY_TYPES as readonly string[]).includes(entityType)) {
    return NextResponse.json(
      {
        error: `Invalid entity type. Allowed types: ${ALLOWED_ENTITY_TYPES.join(
          ', ',
        )}`,
      },
      { status: 400 },
    )
  }

  const validEntityType = entityType as AllowedEntityType

  // 3. Validate pagination query params
  const url = new URL(request.url)
  const rawLimit = url.searchParams.get('limit') ?? '20'
  const rawOffset = url.searchParams.get('offset') ?? '0'
  const query = (url.searchParams.get('q') ?? '').trim()

  const limitNum = parseInt(rawLimit, 10)
  const offsetNum = parseInt(rawOffset, 10)

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return NextResponse.json(
      { error: 'Invalid limit parameter (must be 1-50)' },
      { status: 400 },
    )
  }

  if (isNaN(offsetNum) || offsetNum < 0) {
    return NextResponse.json(
      { error: 'Invalid offset parameter (must be >= 0)' },
      { status: 400 },
    )
  }

  try {
    const client = await pool.connect()

    try {
      let items: EntityGridItem[]

      if (validEntityType === 'stories') {
        const stories = await listPublicStories(client, {
          limit: limitNum,
          offset: offsetNum,
          query,
        })

        items = stories.map((story) => ({
          id: story.id,
          title: story.title,
          content: story.content,
          slug: story.slug,
          userId: story.userid,
          primaryImageUrl: story.primaryImageUrl,
          href: story.username
            ? `/${story.username}/stories/${story.slug ?? story.id}`
            : `/stories/${story.slug ?? story.id}`,
        }))
      } else {
        items = []
      }

      const hasMore = items.length === limitNum

      return NextResponse.json({ items, hasMore }, { status: 200 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error fetching public entities:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to fetch entities' },
      { status: 500 },
    )
  }
}
