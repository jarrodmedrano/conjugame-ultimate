import { NextRequest, NextResponse } from 'next/server'
import {
  requireAuth,
  verifyOwnership,
} from '../../../../../lib/auth-middleware'
import { rateLimit, RateLimitConfigs } from '../../../../../lib/rate-limit'
import {
  UpsertStoryAttributeSchema,
  DeleteStoryAttributeSchema,
} from '../../../../../lib/validations/story'
import {
  getStory,
  getStoryAttributes,
  upsertStoryAttribute,
  deleteStoryAttribute,
} from '@repo/database'
import pool from '../../../../utils/open-pool'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ slug: string }>
}

function parseStoryId(slug: string): number | null {
  const parsed = parseInt(slug, 10)
  return isNaN(parsed) ? null : parsed
}

// GET /api/story/[slug]/attributes
export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const { slug } = await params
  const storyId = parseStoryId(slug)
  if (storyId === null) {
    return NextResponse.json({ error: 'Invalid story ID' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const story = await getStory(client, { id: storyId })
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }
    const authzError = verifyOwnership(user.id, story.userid)
    if (authzError) return authzError

    const attributes = await getStoryAttributes(client, { storyId })
    return NextResponse.json(attributes)
  } catch (error) {
    console.error(
      'Error fetching story attributes:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to fetch attributes' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}

// POST /api/story/[slug]/attributes — upsert one attribute
export async function POST(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const { slug } = await params
  const storyId = parseStoryId(slug)
  if (storyId === null) {
    return NextResponse.json({ error: 'Invalid story ID' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const validated = UpsertStoryAttributeSchema.parse(body)

    const client = await pool.connect()
    try {
      const story = await getStory(client, { id: storyId })
      if (!story) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 })
      }
      const authzError = verifyOwnership(user.id, story.userid)
      if (authzError) return authzError

      const attribute = await upsertStoryAttribute(client, {
        storyId,
        key: validated.key,
        value: validated.value ?? null,
        displayOrder: validated.displayOrder ?? null,
      })

      return NextResponse.json(attribute, { status: 201 })
    } finally {
      client.release()
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'Error upserting story attribute:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to save attribute' },
      { status: 500 },
    )
  }
}

// DELETE /api/story/[slug]/attributes?id=<attributeId>
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const { slug } = await params
  const storyId = parseStoryId(slug)
  if (storyId === null) {
    return NextResponse.json({ error: 'Invalid story ID' }, { status: 400 })
  }

  try {
    const url = new URL(request.url)
    const validated = DeleteStoryAttributeSchema.parse({
      id: url.searchParams.get('id'),
    })

    const client = await pool.connect()
    try {
      const story = await getStory(client, { id: storyId })
      if (!story) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 })
      }
      const authzError = verifyOwnership(user.id, story.userid)
      if (authzError) return authzError

      await deleteStoryAttribute(client, {
        id: validated.id,
        storyId,
      })

      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'Error deleting story attribute:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to delete attribute' },
      { status: 500 },
    )
  }
}
