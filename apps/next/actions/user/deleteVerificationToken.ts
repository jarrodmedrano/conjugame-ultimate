'use server'
import { deleteVerification, DeleteVerificationArgs } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function deleteToken(
  args: DeleteVerificationArgs,
): Promise<void> {
  try {
    const client = await pool.connect()
    try {
      await deleteVerification(client, args)
      return
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error deleting token:', error)
  }
}
