import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '../../../../lib/cloudinary'
import { requireAuth } from '../../../../lib/auth-middleware'
import pool from '../../../utils/open-pool'
import { deleteEntityImage } from 'database'
import { DeleteImageSchema } from '../../../../lib/validations/image'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'
import { z } from 'zod'

export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
    if (rateLimitResult) return rateLimitResult

    // Check authentication
    const authResult = await requireAuth(request)
    if (authResult.error) return authResult.error
    const { user } = authResult

    const url = new URL(request.url)

    // Validate image ID with Zod schema
    const validated = DeleteImageSchema.parse({
      id: url.searchParams.get('id'),
    })

    // Delete from database and get Cloudinary public ID
    const client = await pool.connect()
    try {
      // Verify ownership before deleting — entity_images has no userid directly,
      // so look up the owning entity's userId via a CASE join.
      const ownerResult = await client.query({
        text: `SELECT ei.cloudinary_public_id,
                 CASE ei.entity_type
                   WHEN 'character' THEN (SELECT "userId" FROM characters WHERE id = ei.entity_id)
                   WHEN 'story'     THEN (SELECT "userId" FROM stories    WHERE id = ei.entity_id)
                   WHEN 'location'  THEN (SELECT "userId" FROM locations  WHERE id = ei.entity_id)
                   WHEN 'timeline'  THEN (SELECT "userId" FROM timelines  WHERE id = ei.entity_id)
                 END AS owner_id
               FROM entity_images ei
               WHERE ei.id = $1`,
        values: [validated.id],
      })

      if (ownerResult.rows.length === 0) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 })
      }

      const { owner_id: ownerId, cloudinary_public_id: cloudinaryPublicId } =
        ownerResult.rows[0]

      if (ownerId !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this resource.' },
          { status: 403 },
        )
      }

      await deleteEntityImage(client, { id: validated.id })

      // Delete from Cloudinary
      try {
        await cloudinary.uploader.destroy(cloudinaryPublicId)
      } catch {
        console.error('Cloudinary deletion failed for image', validated.id)
        // Continue - database record is already deleted
      }

      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 },
      )
    }

    console.error(
      'Delete error:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
