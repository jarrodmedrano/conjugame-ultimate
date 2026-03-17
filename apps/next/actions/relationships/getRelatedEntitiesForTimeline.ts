'use server'

import { headers } from 'next/headers'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import {
  getCharactersForTimeline,
  getLocationsForTimeline,
} from '@repo/database'
import type { RelatedEntityItem } from '@app/features/shared/EntityDetailScreen.types'

interface GetRelatedEntitiesForTimelineResult {
  success: boolean
  error?: string
  entities?: {
    stories: RelatedEntityItem[]
    characters: RelatedEntityItem[]
    locations: RelatedEntityItem[]
  }
}

/**
 * Gets all entities (stories, characters, locations) related to a specific timeline.
 * Since the relationship tables are story-centric (story_timelines), we query from that perspective.
 */
export default async function getRelatedEntitiesForTimeline(
  timelineId: number,
): Promise<GetRelatedEntitiesForTimelineResult> {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get stories linked to this timeline via story_timelines table
    const storiesResult = await pool.query(
      `SELECT
        s.id,
        s.title,
        s.content,
        i.cloudinary_url as primary_image_url
       FROM stories s
       JOIN story_timelines st ON s.id = st.story_id
       LEFT JOIN entity_images i ON i.entity_id = s.id
         AND i.entity_type = 'story'
         AND i.is_primary = true
       WHERE st.timeline_id = $1`,
      [timelineId],
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

    // Get characters and locations linked directly to this timeline
    const client = await pool.connect()
    let characters: RelatedEntityItem[] = []
    let locations: RelatedEntityItem[] = []
    try {
      const [characterRows, locationRows] = await Promise.all([
        getCharactersForTimeline(client, { timelineId }),
        getLocationsForTimeline(client, { timelineId }),
      ])
      characters = characterRows.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        primaryImageUrl: c.primaryImageUrl,
      }))
      locations = locationRows.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
        primaryImageUrl: l.primaryImageUrl,
      }))
    } finally {
      client.release()
    }

    return {
      success: true,
      entities: {
        stories,
        characters,
        locations,
      },
    }
  } catch (error) {
    console.error('Error getting related entities for timeline:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
