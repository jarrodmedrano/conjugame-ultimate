'use server'
import {
  GetTimelineArgs,
  GetTimelineRow,
  getTimeline as getTimelineDb,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getTimelineById(
  args: GetTimelineArgs,
): Promise<GetTimelineRow | null> {
  try {
    const client = await pool.connect()
    try {
      const timeline = await getTimelineDb(client, args)
      return timeline
    } finally {
      client.release()
    }
  } catch (error) {
    return null
  }
}
