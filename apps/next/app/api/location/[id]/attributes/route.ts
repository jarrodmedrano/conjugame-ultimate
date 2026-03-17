import { NextRequest, NextResponse } from 'next/server'
import {
  requireAuth,
  verifyOwnership,
} from '../../../../../lib/auth-middleware'
import { rateLimit, RateLimitConfigs } from '../../../../../lib/rate-limit'
import {
  UpsertLocationAttributeSchema,
  DeleteLocationAttributeSchema,
} from '../../../../../lib/validations/location'
import {
  getLocation,
  getLocationAttributes,
  upsertLocationAttribute,
  deleteLocationAttribute,
} from '@repo/database'
import pool from '../../../../utils/open-pool'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

function parseLocationId(id: string): number | null {
  const parsed = parseInt(id, 10)
  return isNaN(parsed) ? null : parsed
}

// GET /api/location/[id]/attributes
export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const { id } = await params
  const locationId = parseLocationId(id)
  if (locationId === null) {
    return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const location = await getLocation(client, { id: locationId })
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }
    const authzError = verifyOwnership(user.id, location.userid)
    if (authzError) return authzError

    const attributes = await getLocationAttributes(client, { locationId })
    return NextResponse.json(attributes)
  } catch (error) {
    console.error(
      'Error fetching location attributes:',
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

// POST /api/location/[id]/attributes — upsert one attribute
export async function POST(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const { id } = await params
  const locationId = parseLocationId(id)
  if (locationId === null) {
    return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const validated = UpsertLocationAttributeSchema.parse(body)

    const client = await pool.connect()
    try {
      const location = await getLocation(client, { id: locationId })
      if (!location) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 },
        )
      }
      const authzError = verifyOwnership(user.id, location.userid)
      if (authzError) return authzError

      const attribute = await upsertLocationAttribute(client, {
        locationId,
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
      'Error upserting location attribute:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to save attribute' },
      { status: 500 },
    )
  }
}

// DELETE /api/location/[id]/attributes?id=<attributeId>
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const { id } = await params
  const locationId = parseLocationId(id)
  if (locationId === null) {
    return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
  }

  try {
    const url = new URL(request.url)
    const validated = DeleteLocationAttributeSchema.parse({
      id: url.searchParams.get('id'),
    })

    const client = await pool.connect()
    try {
      const location = await getLocation(client, { id: locationId })
      if (!location) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 },
        )
      }
      const authzError = verifyOwnership(user.id, location.userid)
      if (authzError) return authzError

      await deleteLocationAttribute(client, {
        id: validated.id,
        locationId,
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
      'Error deleting location attribute:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to delete attribute' },
      { status: 500 },
    )
  }
}
