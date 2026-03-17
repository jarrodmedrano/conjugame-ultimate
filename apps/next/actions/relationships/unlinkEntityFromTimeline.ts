'use server'

import { headers } from 'next/headers'
import {
  unlinkTimelineFromStory,
  unlinkCharacterFromTimeline,
  unlinkLocationFromTimeline,
} from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

interface UnlinkEntityFromTimelineArgs {
  timelineId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  entityId: number
}

interface UnlinkEntityFromTimelineResult {
  success: boolean
  error?: string
}

/**
 * Unlinks an entity (story, character, or location) from a specific timeline.
 * This is the reverse perspective of unlinking from a story.
 */
export default async function unlinkEntityFromTimeline({
  timelineId,
  entityType,
  entityId,
}: UnlinkEntityFromTimelineArgs): Promise<UnlinkEntityFromTimelineResult> {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    switch (entityType) {
      case 'story':
        // Unlink story from timeline using the same table (story_timelines)
        await unlinkTimelineFromStory(pool, {
          storyId: entityId,
          timelineId: timelineId,
        })
        break
      case 'character':
        await unlinkCharacterFromTimeline(pool, {
          characterId: entityId,
          timelineId: timelineId,
        })
        break
      case 'location':
        await unlinkLocationFromTimeline(pool, {
          locationId: entityId,
          timelineId: timelineId,
        })
        break
      default:
        return { success: false, error: `Unknown entity type: ${entityType}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Error unlinking entity from timeline:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
