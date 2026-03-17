'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import {
  deleteTimelineEvent as dbDeleteTimelineEvent,
  getTimelineEvent,
  getTimeline,
} from '@repo/database'

export interface DeleteTimelineEventResult {
  success: boolean
  error?: string
}

export async function deleteTimelineEvent(args: {
  id: number
}): Promise<DeleteTimelineEventResult> {
  const headersList = await headers()

  let session
  try {
    session = await auth.api.getSession({ headers: headersList })
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const client = await pool.connect()
    try {
      const event = await getTimelineEvent(client, { id: args.id })
      if (!event) return { success: false, error: 'Event not found' }

      const timeline = await getTimeline(client, { id: event.timelineId })
      if (!timeline) return { success: false, error: 'Timeline not found' }
      if (timeline.userid !== session.user.id) {
        return { success: false, error: 'Unauthorized' }
      }

      await dbDeleteTimelineEvent(client, { id: args.id })

      revalidatePath(
        `/${timeline.userid}/timelines/${timeline.slug ?? timeline.id}`,
      )
      return { success: true }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error deleting timeline event:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { success: false, error: 'Failed to delete event' }
  }
}
