import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '../../../../lib/rate-limit'
import { requireAuth } from '../../../../lib/auth-middleware'
import { encryptApiKey } from '../../../../lib/api-key-encryption'
import { SaveApiKeySchema } from '../../../../lib/validations/api-key'
import pool from '../../../utils/open-pool'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const client = await pool.connect()
  try {
    const result = await client.query<{
      provider: string
      masked_key: string
      created_at: string
    }>(
      `SELECT provider, masked_key, created_at FROM user_api_keys WHERE user_id = $1 ORDER BY provider`,
      [user.id],
    )

    return NextResponse.json(result.rows)
  } finally {
    client.release()
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.auth)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const client = await pool.connect()
  try {
    const body = await request.json()
    const validated = SaveApiKeySchema.parse(body)

    const { encryptedKey, iv, authTag, maskedKey } = encryptApiKey(
      validated.apiKey,
    )

    await client.query(
      `INSERT INTO user_api_keys (user_id, provider, encrypted_key, iv, auth_tag, masked_key, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, provider) DO UPDATE SET
         encrypted_key = EXCLUDED.encrypted_key,
         iv = EXCLUDED.iv,
         auth_tag = EXCLUDED.auth_tag,
         masked_key = EXCLUDED.masked_key,
         updated_at = NOW()`,
      [user.id, validated.provider, encryptedKey, iv, authTag, maskedKey],
    )

    return NextResponse.json({ provider: validated.provider, maskedKey })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'Error saving API key:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
