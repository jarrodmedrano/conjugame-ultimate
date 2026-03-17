'use server'
import { headers } from 'next/headers'
import { auth } from '../../auth'
import { deleteVerb } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function deleteVerbAction(id: number) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
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
