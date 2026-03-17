'use server'

import pool from '../../app/utils/open-pool'
import { getTimelineEvents as dbGetTimelineEvents } from '@repo/database'
import type { GetTimelineEventsRow } from '@repo/database'

export async function getTimelineEvents(
  timelineId: number,
): Promise<GetTimelineEventsRow[]> {
  try {
    const client = await pool.connect()
    try {
      return await dbGetTimelineEvents(client, { timelineId })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error fetching timeline events:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return []
  }
}
