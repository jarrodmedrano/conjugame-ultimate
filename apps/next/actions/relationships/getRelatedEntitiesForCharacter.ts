'use server'

import pool from '../../app/utils/open-pool'
import type { RelatedEntityItem } from '@app/features/shared/EntityDetailScreen.types'
import { getCharacterRelationships } from '../character-relationships/getCharacterRelationships'
import {
  getStoriesForCharacter,
  getLocationsForCharacter,
  getTimelinesForCharacter,
} from '@repo/database'

interface RelatedEntitiesForCharacter {
  stories: RelatedEntityItem[]
  locations: RelatedEntityItem[]
  timelines: RelatedEntityItem[]
  characters: RelatedEntityItem[]
}

export default async function getRelatedEntitiesForCharacter({
  characterId,
}: {
  characterId: number
}): Promise<RelatedEntitiesForCharacter> {
  try {
    const client = await pool.connect()
    try {
      // Get stories linked to this character
      const storyRows = await getStoriesForCharacter(client, { characterId })
      const stories: RelatedEntityItem[] = storyRows.map((row) => ({
        id: row.id,
        name: row.title,
        description: row.content,
        primaryImageUrl: row.primaryImageUrl,
      }))

      // Get characters related to this character
      const relatedCharacters = await getCharacterRelationships({ characterId })
      const characters: RelatedEntityItem[] = relatedCharacters.map((rc) => ({
        id: rc.id,
        name: rc.name,
        primaryImageUrl: rc.primaryImageUrl,
        relationshipId: rc.relationshipId,
        relationshipLabel: rc.relationshipLabel,
        isFamily: rc.isFamily,
      }))

      // Get locations linked to this character
      const locationRows = await getLocationsForCharacter(client, {
        characterId,
      })
      const locations: RelatedEntityItem[] = locationRows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        primaryImageUrl: row.primaryImageUrl,
      }))

      // Get timelines linked to this character
      const timelineRows = await getTimelinesForCharacter(client, {
        characterId,
      })
      const timelines: RelatedEntityItem[] = timelineRows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        primaryImageUrl: row.primaryImageUrl,
      }))

      return {
        stories,
        locations,
        timelines,
        characters,
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error fetching related entities for character:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { stories: [], locations: [], timelines: [], characters: [] }
  }
}
