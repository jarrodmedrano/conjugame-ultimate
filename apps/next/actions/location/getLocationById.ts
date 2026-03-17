'use server'
import {
  GetLocationArgs,
  GetLocationRow,
  getLocation as getLocationDb,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getLocationById(
  args: GetLocationArgs,
): Promise<GetLocationRow | null> {
  try {
    const client = await pool.connect()
    try {
      const location = await getLocationDb(client, args)
      return location
    } finally {
      client.release()
    }
  } catch (error) {
    return null
  }
}
