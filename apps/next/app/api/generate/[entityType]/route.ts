// apps/next/app/api/generate/[entityType]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'
import { requireAuth } from '../../../../lib/auth-middleware'
import { GenerateEntitySchema } from '../../../../lib/validations/generate'
import {
  getAIProvider,
  type SupportedProvider,
} from '../../../../lib/ai/provider'
import { buildStoryContext } from '../../../../lib/ai/context-builder'
import { decryptApiKey } from '../../../../lib/api-key-encryption'
import pool from '../../../utils/open-pool'
import { z } from 'zod'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string }> },
) {
  // 1. Rate limiting
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.expensive)
  if (rateLimitResult) return rateLimitResult

  // 2. Authentication
  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const client = await pool.connect()
  try {
    // 3. Look up user's API key (prefer anthropic, fall back to openai)
    const keyResult = await client.query<{
      provider: string
      encrypted_key: Buffer
      iv: Buffer
      auth_tag: Buffer
    }>(
      `SELECT provider, encrypted_key, iv, auth_tag
       FROM user_api_keys
       WHERE user_id = $1
       ORDER BY CASE provider WHEN 'anthropic' THEN 1 ELSE 2 END
       LIMIT 1`,
      [user.id],
    )

    if (keyResult.rows.length === 0) {
      return NextResponse.json({ error: 'api_key_required' }, { status: 403 })
    }

    const row = keyResult.rows[0]
    const rawApiKey = decryptApiKey({
      encryptedKey: row.encrypted_key,
      iv: row.iv,
      authTag: row.auth_tag,
      maskedKey: '', // not needed for decryption
    })

    // 4. Validate input
    const body = await request.json()
    const { entityType } = await params
    const validated = GenerateEntitySchema.parse({ ...body, entityType })

    // 5. Validate provider is a known type before casting
    const providerName = row.provider
    if (providerName !== 'anthropic' && providerName !== 'openai') {
      console.error('Unknown provider in user_api_keys:', providerName)
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 },
      )
    }

    // 6. Build story context — pass userId to enforce ownership (prevents IDOR)
    const context = await buildStoryContext(client, validated.storyId, user.id)

    // 7. Generate with user's API key — isolated catch to avoid leaking rawApiKey
    let result
    try {
      const provider = getAIProvider({
        provider: providerName as SupportedProvider,
        apiKey: rawApiKey,
      })
      result = await provider.generate(
        {
          entityType: validated.entityType,
          prompt: validated.prompt,
          storyId: validated.storyId,
        },
        context,
      )
    } catch {
      // Do NOT log error.message — SDK errors may echo back the API key
      console.error('AI provider generation failed for provider:', providerName)
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 },
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'AI generation failed:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
