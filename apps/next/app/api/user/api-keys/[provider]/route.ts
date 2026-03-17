import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitConfigs } from '../../../../../lib/rate-limit'
import { requireAuth } from '../../../../../lib/auth-middleware'
import { DeleteApiKeySchema } from '../../../../../lib/validations/api-key'
import pool from '../../../../utils/open-pool'
import { z } from 'zod'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const client = await pool.connect()
  try {
    const { provider } = await params
    const validated = DeleteApiKeySchema.parse({ provider })

    await client.query(
      `DELETE FROM user_api_keys WHERE user_id = $1 AND provider = $2`,
      [user.id, validated.provider],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'Error deleting API key:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
