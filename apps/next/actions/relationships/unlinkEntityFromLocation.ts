'use server'

import { headers } from 'next/headers'
import {
  unlinkLocationFromStory,
  unlinkCharacterFromLocation,
  unlinkLocationFromTimeline,
} from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

interface UnlinkEntityFromLocationArgs {
  locationId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  entityId: number
}

interface UnlinkEntityFromLocationResult {
  success: boolean
  error?: string
}

/**
 * Unlinks an entity (story, character, or timeline) from a specific location.
 * This is the reverse perspective of unlinking from a story.
 */
export default async function unlinkEntityFromLocation({
  locationId,
  entityType,
  entityId,
}: UnlinkEntityFromLocationArgs): Promise<UnlinkEntityFromLocationResult> {
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
        // Unlink story from location using the same table (story_locations)
        await unlinkLocationFromStory(pool, {
          storyId: entityId,
          locationId: locationId,
        })
        break
      case 'character':
        await unlinkCharacterFromLocation(pool, {
          characterId: entityId,
          locationId: locationId,
        })
        break
      case 'timeline':
        await unlinkLocationFromTimeline(pool, {
          locationId: locationId,
          timelineId: entityId,
        })
        break
      default:
        return { success: false, error: `Unknown entity type: ${entityType}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Error unlinking entity from location:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
