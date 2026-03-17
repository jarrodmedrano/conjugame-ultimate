'use server'
import { headers } from 'next/headers'
import { auth } from '../../auth'
import { createVerb } from '@repo/database'
import pool from '../../app/utils/open-pool'
import { CreateVerbSchema } from '@repo/schema'

export default async function createVerbAction(
  input: unknown,
): Promise<Record<string, unknown>> {
  const session = await auth.api.getSession({ headers: await headers() })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUser = session?.user as any
  if (!sessionUser || sessionUser.role !== 'admin') {
    return { error: 'Unauthorized' }
  }
  const parsed = CreateVerbSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  try {
    const client = await pool.connect()
    try {
      const verb = await createVerb(client, {
        name: parsed.data.name,
        language: parsed.data.language,
        infinitive: parsed.data.infinitive ?? null,
      })
      return { verb }
    } finally {
      client.release()
    }
  } catch {
    return { error: 'Failed to create verb' }
  }
}
