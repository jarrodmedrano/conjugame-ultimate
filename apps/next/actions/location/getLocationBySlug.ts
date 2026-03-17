'use server'

import {
  getLocationBySlug as getLocationBySlugDb,
  GetLocationBySlugArgs,
  GetLocationBySlugRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getLocationBySlug(
  args: GetLocationBySlugArgs,
): Promise<GetLocationBySlugRow | null> {
  try {
    const client = await pool.connect()
    try {
      const location = await getLocationBySlugDb(client, args)
      return location
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching location by slug:', error)
    return null
  }
}
