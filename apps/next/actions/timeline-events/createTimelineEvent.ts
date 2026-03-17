'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import {
  createTimelineEvent as dbCreateTimelineEvent,
  getTimeline,
  getTimelineEvents,
} from '@repo/database'
import { CreateTimelineEventSchema } from '../../lib/validations/timeline-event'

export interface CreateTimelineEventResult {
  success: boolean
  error?: string
}

export async function createTimelineEvent(args: {
  timelineId: number
  eventDate: string
  title: string
  description?: string | null
}): Promise<CreateTimelineEventResult> {
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
    validated = CreateTimelineEventSchema.parse({
      ...args,
      orderIndex: 0,
    })
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
      const timeline = await getTimeline(client, { id: validated.timelineId })
      if (!timeline) return { success: false, error: 'Timeline not found' }
      if (timeline.userid !== session.user.id) {
        return { success: false, error: 'Unauthorized' }
      }

      // Auto-assign order_index as next in sequence
      const existing = await getTimelineEvents(client, {
        timelineId: validated.timelineId,
      })
      const orderIndex = existing.length

      await dbCreateTimelineEvent(client, {
        timelineId: validated.timelineId,
        eventDate: validated.eventDate,
        title: validated.title,
        description: validated.description ?? null,
        orderIndex,
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
      'Error creating timeline event:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { success: false, error: 'Failed to create event' }
  }
}
