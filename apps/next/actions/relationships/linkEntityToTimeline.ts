'use server'

import { headers } from 'next/headers'
import {
  linkTimelineToStory,
  linkCharacterToTimeline,
  linkLocationToTimeline,
} from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

interface LinkEntityToTimelineArgs {
  timelineId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  entityIds: number[]
}

interface LinkEntityToTimelineResult {
  success: boolean
  error?: string
}

/**
 * Links entities (stories, characters, or locations) to a specific timeline.
 * This is the reverse perspective of linking from a story - it links TO a timeline.
 */
export default async function linkEntityToTimeline({
  timelineId,
  entityType,
  entityIds,
}: LinkEntityToTimelineArgs): Promise<LinkEntityToTimelineResult> {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Link each entity to the timeline
    for (const entityId of entityIds) {
      switch (entityType) {
        case 'story':
          // Link story to timeline using the same table (story_timelines)
          await linkTimelineToStory(pool, {
            storyId: entityId,
            timelineId: timelineId,
          })
          break
        case 'character':
          await linkCharacterToTimeline(pool, {
            characterId: entityId,
            timelineId: timelineId,
          })
          break
        case 'location':
          await linkLocationToTimeline(pool, {
            locationId: entityId,
            timelineId: timelineId,
          })
          break
        default:
          return { success: false, error: `Unknown entity type: ${entityType}` }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error linking entity to timeline:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
