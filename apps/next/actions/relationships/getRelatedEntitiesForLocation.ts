'use server'

import { headers } from 'next/headers'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import {
  getCharactersForLocation,
  getTimelinesForLocation,
} from '@repo/database'
import type { RelatedEntityItem } from '@app/features/shared/EntityDetailScreen.types'

interface GetRelatedEntitiesForLocationResult {
  success: boolean
  error?: string
  entities?: {
    stories: RelatedEntityItem[]
    characters: RelatedEntityItem[]
    timelines: RelatedEntityItem[]
  }
}

/**
 * Gets all entities (stories, characters, timelines) related to a specific location.
 * Since the relationship tables are story-centric (story_locations), we query from that perspective.
 */
export default async function getRelatedEntitiesForLocation(
  locationId: number,
): Promise<GetRelatedEntitiesForLocationResult> {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get stories linked to this location via story_locations table
    const storiesResult = await pool.query(
      `SELECT
        s.id,
        s.title,
        s.content,
        i.cloudinary_url as primary_image_url
       FROM stories s
       JOIN story_locations sl ON s.id = sl.story_id
       LEFT JOIN entity_images i ON i.entity_id = s.id
         AND i.entity_type = 'story'
         AND i.is_primary = true
       WHERE sl.location_id = $1`,
      [locationId],
    )

    // Normalize stories to have name/description for RelatedEntitiesGrid compatibility
    const stories: RelatedEntityItem[] = (storiesResult.rows || []).map(
      (story: any) => ({
        id: story.id,
        name: story.title,
        description: story.content,
        primaryImageUrl: story.primary_image_url,
      }),
    )

    // Get characters and timelines linked directly to this location
    const client = await pool.connect()
    let characters: RelatedEntityItem[] = []
    let timelines: RelatedEntityItem[] = []
    try {
      const [characterRows, timelineRows] = await Promise.all([
        getCharactersForLocation(client, { locationId }),
        getTimelinesForLocation(client, { locationId }),
      ])
      characters = characterRows.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        primaryImageUrl: c.primaryImageUrl,
      }))
      timelines = timelineRows.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        primaryImageUrl: t.primaryImageUrl,
      }))
    } finally {
      client.release()
    }

    return {
      success: true,
      entities: {
        stories,
        characters,
        timelines,
      },
    }
  } catch (error) {
    console.error('Error getting related entities for location:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
