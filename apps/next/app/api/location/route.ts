import {
  createLocation,
  checkLocationSlugExists,
  linkLocationToStory,
} from '@repo/database'
import pool from '../../utils/open-pool'
import { requireAuth } from '../../../lib/auth-middleware'
import { NextResponse } from 'next/server'
import { generateUniqueSlug } from '../../../utils/slug'
import { CreateLocationSchema } from '../../../lib/validations/location'
import { rateLimit, RateLimitConfigs } from '../../../lib/rate-limit'
import { checkQuotaWithClient } from '../../../lib/subscription'
import { z } from 'zod'

export async function POST(request: Request) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error

  const { user } = authResult

  try {
    const body = await request.json()
    const validated = CreateLocationSchema.parse(body)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `quota:${user.id}:locations`,
      ])

      const quotaCheck = await checkQuotaWithClient(
        client,
        user.id,
        'locations',
      )
      if (!quotaCheck.allowed) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          {
            error: quotaCheck.reason,
            limit: quotaCheck.limit,
            count: quotaCheck.count,
            upgradeRequired: true,
          },
          { status: 403 },
        )
      }

      const slug = await generateUniqueSlug(
        validated.name,
        async (candidateSlug) => {
          const result = await checkLocationSlugExists(client, {
            userid: user.id,
            slug: candidateSlug,
          })
          return result?.exists ?? false
        },
      )

      const result = await createLocation(client, {
        userid: user.id,
        name: validated.name,
        description: validated.description || null,
        privacy: validated.privacy,
        slug,
      })

      if (validated.storyId && result?.id) {
        await linkLocationToStory(client, {
          storyId: parseInt(validated.storyId, 10),
          locationId: result.id,
        })
      }

      await client.query('COMMIT')
      return NextResponse.json(result, { status: 201 })
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
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
      'Error creating location:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 },
    )
  }
}
