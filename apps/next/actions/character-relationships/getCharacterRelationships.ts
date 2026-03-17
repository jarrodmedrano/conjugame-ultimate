'use server'

import pool from '../../app/utils/open-pool'
import { getCharacterRelationships as dbGetCharacterRelationships } from '@repo/database'
import {
  getInverseRelationshipType,
  getRelationshipLabel,
  FAMILY_TYPES,
} from '@app/features/characters/utils/relationshipInverse'

export interface RelatedCharacter {
  id: number
  relationshipId: number
  name: string
  slug: string | null
  primaryImageUrl: string | null
  relationshipLabel: string
  isFamily: boolean
}

export async function getCharacterRelationships({
  characterId,
}: {
  characterId: number
}): Promise<RelatedCharacter[]> {
  try {
    const client = await pool.connect()
    try {
      const rows = await dbGetCharacterRelationships(client, { characterId })

      return rows.map((row) => {
        const isOrigin = row.characterIdA === characterId
        const displayType = isOrigin
          ? row.relationshipType
          : getInverseRelationshipType(row.relationshipType)

        const label = getRelationshipLabel(displayType, row.customLabel)

        return {
          id: row.relatedCharacterId,
          relationshipId: row.id,
          name: row.relatedCharacterName,
          slug: row.relatedCharacterSlug,
          primaryImageUrl: row.primaryImageUrl,
          relationshipLabel: label,
          isFamily: FAMILY_TYPES.has(displayType),
        }
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error fetching character relationships:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return []
  }
}
