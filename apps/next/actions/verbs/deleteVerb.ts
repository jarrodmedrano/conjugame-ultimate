'use server'
import { headers } from 'next/headers'
import { auth } from '../../auth'
import { deleteVerb } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function deleteVerbAction(id: number) {
  const session = await auth.api.getSession({ headers: await headers() })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUser = session?.user as any
  if (!sessionUser || sessionUser.role !== 'admin') {
    return { error: 'Unauthorized' }
  }
  try {
    const client = await pool.connect()
    try {
      await deleteVerb(client, { id })
      return { success: true }
    } finally {
      client.release()
    }
  } catch {
    return { error: 'Failed to delete verb' }
  }
}
