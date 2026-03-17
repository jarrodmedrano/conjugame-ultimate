// apps/next/app/api/generate/image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'
import { requireAuth } from '../../../../lib/auth-middleware'
import { GenerateImageSchema } from '../../../../lib/validations/generate-image'
import { decryptApiKey } from '../../../../lib/api-key-encryption'
import { cloudinary, CLOUDINARY_CONFIG } from '../../../../lib/cloudinary'
import { createEntityImage, countGalleryImages } from '@repo/database'
import pool from '../../../utils/open-pool'
import OpenAI from 'openai'
import { z } from 'zod'

const STYLE_SUFFIXES: Record<string, string> = {
  'sci-fi': ', in a sci-fi cinematic style',
  fantasy: ', in a fantasy illustration style',
  realistic: ', photorealistic, highly detailed',
  noir: ', in a noir cinematic style, high contrast black and white',
  drama: ', dramatic lighting, cinematic composition',
  comedy: ', colorful, lighthearted, cartoon illustration style',
  horror: ', dark and unsettling, horror atmosphere',
}

function getEntityTable(entityType: string): string {
  const tables: Record<string, string> = {
    character: 'characters',
    location: 'locations',
    story: 'stories',
    timeline: 'timelines',
  }
  const table = tables[entityType]
  if (!table) throw new Error('Invalid entity type')
  return table
}

const DALLE_URL_ALLOWLIST = [
  'oaidalleapiprodscus.blob.core.windows.net',
  'oaidallenaius.blob.core.windows.net',
  'oaidalleeaus.blob.core.windows.net',
  'oaidalleweeus.blob.core.windows.net',
]

function validateDalleUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid image URL')
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Image URL must use HTTPS')
  }
  const hostname = parsed.hostname.toLowerCase()
  const isAllowed = DALLE_URL_ALLOWLIST.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
  )
  if (!isAllowed) {
    throw new Error('Image URL host not allowed')
  }
}

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.expensive)
  if (rateLimitResult) return rateLimitResult

  // 2. Authentication
  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  // 3. Validate input before any DB work
  let validated: z.infer<typeof GenerateImageSchema>
  try {
    const body = await request.json()
    validated = GenerateImageSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    // 4. Look up OpenAI key specifically — DALL-E requires OpenAI
    const keyResult = await client.query<{
      encrypted_key: Buffer
      iv: Buffer
      auth_tag: Buffer
    }>(
      `SELECT encrypted_key, iv, auth_tag
       FROM user_api_keys
       WHERE user_id = $1 AND provider = 'openai'
       LIMIT 1`,
      [user.id],
    )

    if (keyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'api_key_required', provider: 'openai' },
        { status: 403 },
      )
    }

    const row = keyResult.rows[0]
    const rawApiKey = decryptApiKey({
      encryptedKey: row.encrypted_key,
      iv: row.iv,
      authTag: row.auth_tag,
      maskedKey: '',
    })

    // 5. Verify user owns the entity
    const ownershipResult = await client.query<{ userId: string }>(
      `SELECT "userId" FROM ${getEntityTable(
        validated.entityType,
      )} WHERE id = $1 LIMIT 1`,
      [validated.entityId],
    )
    if (
      !ownershipResult.rows[0] ||
      ownershipResult.rows[0].userId !== user.id
    ) {
      return NextResponse.json(
        { error: 'Entity not found or access denied' },
        { status: 403 },
      )
    }

    // 6. Check gallery limit if not primary
    if (!validated.isPrimary) {
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
    }

    // 7. Build DALL-E prompt
    // customPrompt is built client-side; entityName and entityDescription are validated
    // but used client-side only for prompt pre-fill
    const styleSuffix = validated.style
      ? STYLE_SUFFIXES[validated.style] ?? ''
      : ''
    const dallePrompt = `${validated.customPrompt}${styleSuffix}`

    // 8. Call DALL-E 3 — isolated catch to avoid leaking rawApiKey
    let imageUrl: string
    try {
      const openai = new OpenAI({ apiKey: rawApiKey })
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: dallePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      })
      imageUrl = response.data?.[0]?.url ?? ''
      if (!imageUrl) throw new Error('No image URL returned')
    } catch {
      console.error('DALL-E generation failed for user:', user.id)
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 },
      )
    }

    // 9. Fetch image buffer from DALL-E temporary URL
    // Validate URL before fetching to prevent SSRF
    try {
      validateDalleUrl(imageUrl)
    } catch {
      console.error('DALL-E returned unexpected URL for user:', user.id)
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 },
      )
    }

    const MAX_BUFFER_SIZE = 10 * 1024 * 1024 // 10MB — DALL-E 3 1024x1024 images are typically 1-5MB

    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30_000),
    })
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch generated image' },
        { status: 500 },
      )
    }

    // Check Content-Length before buffering to avoid downloading oversized payloads
    const contentLength = imageResponse.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_BUFFER_SIZE) {
      return NextResponse.json(
        { error: 'Generated image is too large' },
        { status: 500 },
      )
    }

    // Check Content-Type is an image before buffering
    const contentType = imageResponse.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Failed to fetch generated image' },
        { status: 500 },
      )
    }

    const arrayBuffer = await imageResponse.arrayBuffer()

    if (arrayBuffer.byteLength > MAX_BUFFER_SIZE) {
      return NextResponse.json(
        { error: 'Generated image is too large' },
        { status: 500 },
      )
    }

    const buffer = Buffer.from(arrayBuffer)

    // 10. Upload buffer to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: CLOUDINARY_CONFIG.FOLDER,
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png'],
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          },
        )
        .end(buffer)
    })

    // 11. Save to database
    await client.query('BEGIN')
    try {
      if (validated.isPrimary) {
        await client.query(
          'UPDATE entity_images SET is_primary = FALSE WHERE entity_type = $1 AND entity_id = $2 AND is_primary = TRUE',
          [validated.entityType, validated.entityId],
        )
      }

      const imageRecord = await createEntityImage(client, {
        entityType: validated.entityType,
        entityId: validated.entityId,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        isPrimary: validated.isPrimary,
        displayOrder: 0,
        fileName: `ai-generated-${Date.now()}.png`,
        fileSize: buffer.length,
        width: uploadResult.width,
        height: uploadResult.height,
      })

      await client.query('COMMIT')
      return NextResponse.json({ success: true, image: imageRecord })
    } catch (txError) {
      await client.query('ROLLBACK')
      throw txError
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'Image generation failed:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
