import { NextRequest, NextResponse } from 'next/server'
import {
  requireAuth,
  verifyOwnership,
} from '../../../../../lib/auth-middleware'
import { rateLimit, RateLimitConfigs } from '../../../../../lib/rate-limit'
import {
  UpsertCharacterAttributeSchema,
  DeleteCharacterAttributeSchema,
} from '../../../../../lib/validations/character'
import {
  getCharacter,
  getCharacterAttributes,
  upsertCharacterAttribute,
  deleteCharacterAttribute,
} from '@repo/database'
import pool from '../../../../utils/open-pool'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

function parseCharacterId(id: string): number | null {
  const parsed = parseInt(id, 10)
  return isNaN(parsed) ? null : parsed
}

// GET /api/character/[id]/attributes
export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const { id } = await params
  const characterId = parseCharacterId(id)
  if (characterId === null) {
    return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const character = await getCharacter(client, { id: characterId })
    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 },
      )
    }
    const authzError = verifyOwnership(user.id, character.userid)
    if (authzError) return authzError

    const attributes = await getCharacterAttributes(client, { characterId })
    return NextResponse.json(attributes)
  } catch (error) {
    console.error(
      'Error fetching character attributes:',
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

// POST /api/character/[id]/attributes — upsert one attribute
export async function POST(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const { id } = await params
  const characterId = parseCharacterId(id)
  if (characterId === null) {
    return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const validated = UpsertCharacterAttributeSchema.parse(body)

    const client = await pool.connect()
    try {
      const character = await getCharacter(client, { id: characterId })
      if (!character) {
        return NextResponse.json(
          { error: 'Character not found' },
          { status: 404 },
        )
      }
      const authzError = verifyOwnership(user.id, character.userid)
      if (authzError) return authzError

      const attribute = await upsertCharacterAttribute(client, {
        characterId,
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
      'Error upserting character attribute:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to save attribute' },
      { status: 500 },
    )
  }
}

// DELETE /api/character/[id]/attributes?id=<attributeId>
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const { id } = await params
  const characterId = parseCharacterId(id)
  if (characterId === null) {
    return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 })
  }

  try {
    const url = new URL(request.url)
    const validated = DeleteCharacterAttributeSchema.parse({
      id: url.searchParams.get('id'),
    })

    const client = await pool.connect()
    try {
      const character = await getCharacter(client, { id: characterId })
      if (!character) {
        return NextResponse.json(
          { error: 'Character not found' },
          { status: 404 },
        )
      }
      const authzError = verifyOwnership(user.id, character.userid)
      if (authzError) return authzError

      await deleteCharacterAttribute(client, {
        id: validated.id,
        characterId,
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
      'Error deleting character attribute:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to delete attribute' },
      { status: 500 },
    )
  }
}
