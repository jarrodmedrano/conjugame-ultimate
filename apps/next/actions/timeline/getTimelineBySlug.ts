'use server'

import {
  getTimelineBySlug as getTimelineBySlugDb,
  GetTimelineBySlugArgs,
  GetTimelineBySlugRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getTimelineBySlug(
  args: GetTimelineBySlugArgs,
): Promise<GetTimelineBySlugRow | null> {
  try {
    const client = await pool.connect()
    try {
      const timeline = await getTimelineBySlugDb(client, args)
      return timeline
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching timeline by slug:', error)
    return null
  }
}
