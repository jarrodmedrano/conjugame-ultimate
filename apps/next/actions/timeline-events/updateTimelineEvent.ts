'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import {
  updateTimelineEvent as dbUpdateTimelineEvent,
  getTimelineEvent,
  getTimeline,
} from '@repo/database'
import { UpdateTimelineEventSchema } from '../../lib/validations/timeline-event'

export interface UpdateTimelineEventResult {
  success: boolean
  error?: string
}

export async function updateTimelineEvent(args: {
  id: number
  eventDate: string
  title: string
  description?: string | null
  orderIndex: number
}): Promise<UpdateTimelineEventResult> {
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

  let validated
  try {
    validated = UpdateTimelineEventSchema.parse(args)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? 'Validation failed',
      }
    }
    return { success: false, error: 'Validation failed' }
  }

  try {
    const client = await pool.connect()
    try {
      const event = await getTimelineEvent(client, { id: validated.id })
      if (!event) return { success: false, error: 'Event not found' }

      const timeline = await getTimeline(client, { id: event.timelineId })
      if (!timeline) return { success: false, error: 'Timeline not found' }
      if (timeline.userid !== session.user.id) {
        return { success: false, error: 'Unauthorized' }
      }

      await dbUpdateTimelineEvent(client, {
        id: validated.id,
        eventDate: validated.eventDate,
        title: validated.title,
        description: validated.description ?? null,
        orderIndex: validated.orderIndex,
      })

      revalidatePath(
        `/${timeline.userid}/timelines/${timeline.slug ?? timeline.id}`,
      )
      return { success: true }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error updating timeline event:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { success: false, error: 'Failed to update event' }
  }
}
