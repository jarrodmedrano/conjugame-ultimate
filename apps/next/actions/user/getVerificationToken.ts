'use server'
import {
  getVerification,
  GetVerificationArgs,
  GetVerificationRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function fetchVerificationToken(
  args: GetVerificationArgs,
): Promise<GetVerificationRow | null> {
  try {
    const client = await pool.connect()
    try {
      const token = await getVerification(client, args)
      return token
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}
