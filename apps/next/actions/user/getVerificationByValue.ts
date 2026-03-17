'use server'
import {
  getVerificationByValue,
  GetVerificationByValueArgs,
  GetVerificationByValueRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function fetchVerificationByValue(
  args: GetVerificationByValueArgs,
): Promise<GetVerificationByValueRow | null> {
  try {
    const client = await pool.connect()
    try {
      const token = await getVerificationByValue(client, args)
      return token
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching verification by value:', error)
    return null
  }
}
