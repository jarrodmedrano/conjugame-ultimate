'use server'
import {
  getCharactersForStory as dbGetCharactersForStory,
  getLocationsForStory as dbGetLocationsForStory,
  getTimelinesForStory as dbGetTimelinesForStory,
  GetCharactersForStoryRow,
  GetLocationsForStoryRow,
  GetTimelinesForStoryRow,
} from '@repo/database'
import type { RelatedEntityItem } from '@app/features/shared/EntityDetailScreen.types'
import pool from '../../app/utils/open-pool'

interface RelatedEntities {
  characters: RelatedEntityItem[]
  locations: RelatedEntityItem[]
  timelines: RelatedEntityItem[]
}

export default async function getRelatedEntities({
  storyId,
}: {
  storyId: number
}): Promise<RelatedEntities> {
  try {
    const client = await pool.connect()
    try {
      const [characters, locations, timelines] = await Promise.all([
        dbGetCharactersForStory(client, { storyId }),
        dbGetLocationsForStory(client, { storyId }),
        dbGetTimelinesForStory(client, { storyId }),
      ])

      return {
        characters: (characters || []).map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          primaryImageUrl: c.primaryImageUrl,
        })),
        locations: (locations || []).map((l) => ({
          id: l.id,
          name: l.name,
          description: l.description,
          primaryImageUrl: l.primaryImageUrl,
        })),
        timelines: (timelines || []).map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          primaryImageUrl: t.primaryImageUrl,
        })),
      }
    } finally {
      client.release()
    }
  } catch (error) {
    return { characters: [], locations: [], timelines: [] }
  }
}
