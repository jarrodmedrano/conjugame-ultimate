'use server'

import { headers } from 'next/headers'
import {
  linkLocationToStory,
  linkCharacterToLocation,
  linkLocationToTimeline,
} from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

interface LinkEntityToLocationArgs {
  locationId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  entityIds: number[]
}

interface LinkEntityToLocationResult {
  success: boolean
  error?: string
}

/**
 * Links entities (stories, characters, or timelines) to a specific location.
 * This is the reverse perspective of linking from a story - it links TO a location.
 */
export default async function linkEntityToLocation({
  locationId,
  entityType,
  entityIds,
}: LinkEntityToLocationArgs): Promise<LinkEntityToLocationResult> {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Link each entity to the location
    for (const entityId of entityIds) {
      switch (entityType) {
        case 'story':
          // Link story to location using the same table (story_locations)
          // The function links a location TO a story, so we pass: storyId (the entity), locationId (our location)
          await linkLocationToStory(pool, {
            storyId: entityId,
            locationId: locationId,
          })
          break
        case 'character':
          await linkCharacterToLocation(pool, {
            characterId: entityId,
            locationId: locationId,
          })
          break
        case 'timeline':
          await linkLocationToTimeline(pool, {
            locationId: locationId,
            timelineId: entityId,
          })
          break
        default:
          return { success: false, error: `Unknown entity type: ${entityType}` }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error linking entity to location:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
