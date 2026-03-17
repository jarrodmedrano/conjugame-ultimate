import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '../../../../lib/cloudinary'
import { validateImageFile } from '../../../../lib/validate-image'
import { requireAuth } from '../../../../lib/auth-middleware'
import pool from '../../../utils/open-pool'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'conjugame/avatars',
            resource_type: 'image',
            transformation: [
              { width: 256, height: 256, crop: 'fill', gravity: 'face' },
            ],
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          },
        )
        .end(buffer)
    })

    const cloudinaryResult = uploadResult as { secure_url: string }

    // Update users.avatar_url in database
    const client = await pool.connect()
    try {
      await client.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [
        cloudinaryResult.secure_url,
        authResult.user.id,
      ])
    } finally {
      client.release()
    }

    return NextResponse.json({ url: cloudinaryResult.secure_url })
  } catch (error) {
    console.error(
      'Upload error:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
