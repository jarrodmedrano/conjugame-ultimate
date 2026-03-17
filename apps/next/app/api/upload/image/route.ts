import { NextRequest, NextResponse } from 'next/server'
import { cloudinary, CLOUDINARY_CONFIG } from '../../../../lib/cloudinary'
import { validateImageFile } from '../../../../lib/validate-image'
import { requireAuth } from '../../../../lib/auth-middleware'
import pool from '../../../utils/open-pool'
import { createEntityImage, countGalleryImages } from '@repo/database'
import { UploadImageSchema } from '../../../../lib/validations/image'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for uploads
    const rateLimitResult = await rateLimit(request, RateLimitConfigs.upload)
    if (rateLimitResult) return rateLimitResult

    // Check authentication
    const authResult = await requireAuth(request)
    if (authResult.error) return authResult.error

    const formData = await request.formData()
    // @ts-expect-error - FormData.get() method exists but TypeScript lib configuration doesn't recognize it
    const file = formData.get('file') as File | null

    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate form data with Zod schema
    const validated = UploadImageSchema.parse({
      // @ts-expect-error - FormData.get() method exists but TypeScript lib configuration doesn't recognize it
      entityType: formData.get('entityType'),
      // @ts-expect-error - FormData.get() method exists but TypeScript lib configuration doesn't recognize it
      entityId: formData.get('entityId'),
      // @ts-expect-error - FormData.get() method exists but TypeScript lib configuration doesn't recognize it
      isPrimary: formData.get('isPrimary'),
      // @ts-expect-error - FormData.get() method exists but TypeScript lib configuration doesn't recognize it
      displayOrder: formData.get('displayOrder'),
    })

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check gallery limit if not primary
    if (!validated.isPrimary) {
      const client = await pool.connect()
      try {
        const countResult = await countGalleryImages(client, {
          entityType: validated.entityType,
          entityId: validated.entityId,
        })

        if (
          countResult &&
          Number(countResult.count) >= CLOUDINARY_CONFIG.MAX_GALLERY_SIZE
        ) {
          return NextResponse.json(
            {
              error: `Maximum ${CLOUDINARY_CONFIG.MAX_GALLERY_SIZE} gallery images allowed`,
            },
            { status: 400 },
          )
        }
      } finally {
        client.release()
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: CLOUDINARY_CONFIG.FOLDER,
            resource_type: 'image',
            allowed_formats: [...CLOUDINARY_CONFIG.ALLOWED_FORMATS],
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          },
        )
        .end(buffer)
    })

    const cloudinaryResult = uploadResult as any

    // Validate dimensions from Cloudinary response
    if (
      cloudinaryResult.width > CLOUDINARY_CONFIG.MAX_DIMENSIONS ||
      cloudinaryResult.height > CLOUDINARY_CONFIG.MAX_DIMENSIONS
    ) {
      // Delete uploaded image
      await cloudinary.uploader.destroy(cloudinaryResult.public_id)

      return NextResponse.json(
        {
          error: `Image dimensions must be ${CLOUDINARY_CONFIG.MAX_DIMENSIONS}x${CLOUDINARY_CONFIG.MAX_DIMENSIONS}px or smaller`,
        },
        { status: 400 },
      )
    }

    // Save to database
    const client = await pool.connect()
    try {
      // If setting as primary, unset existing primary
      if (validated.isPrimary) {
        await client.query(
          'UPDATE entity_images SET is_primary = FALSE WHERE entity_type = $1 AND entity_id = $2 AND is_primary = TRUE',
          [validated.entityType, validated.entityId],
        )
      }

      const imageRecord = await createEntityImage(client, {
        entityType: validated.entityType,
        entityId: validated.entityId,
        cloudinaryPublicId: cloudinaryResult.public_id,
        cloudinaryUrl: cloudinaryResult.secure_url,
        isPrimary: validated.isPrimary,
        displayOrder: validated.displayOrder,
        fileName: file.name,
        fileSize: file.size,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
      })

      return NextResponse.json({
        success: true,
        image: imageRecord,
      })
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
      'Upload error:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
