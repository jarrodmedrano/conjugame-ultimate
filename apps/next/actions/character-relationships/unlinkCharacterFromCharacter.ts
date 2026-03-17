'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import {
  getCharacter,
  getCharacterRelationship,
  deleteCharacterRelationship,
} from '@repo/database'

export interface UnlinkCharacterFromCharacterArgs {
  characterId: number
  relationshipId: number
}

export interface UnlinkCharacterFromCharacterResult {
  success: boolean
  error?: string
}

export async function unlinkCharacterFromCharacter(
  args: UnlinkCharacterFromCharacterArgs,
): Promise<UnlinkCharacterFromCharacterResult> {
  const headersList = await headers()

  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null
  try {
    session = await auth.api.getSession({
      headers: headersList,
    })
  } catch {
    return { success: false, error: 'Unauthorized: You must be logged in' }
  }

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized: You must be logged in' }
  }

  try {
    const client = await pool.connect()
    try {
      const character = await getCharacter(client, { id: args.characterId })
      if (!character) return { success: false, error: 'Character not found' }
      if (character.userid !== session.user.id) {
        return {
          success: false,
          error:
            'Unauthorized: You can only remove relationships from your own characters',
        }
      }

      const relationship = await getCharacterRelationship(client, {
        id: args.relationshipId,
      })
      if (!relationship)
        return { success: false, error: 'Relationship not found' }
      if (relationship.createdBy !== session.user.id) {
        return {
          success: false,
          error: 'Forbidden: You can only remove relationships you created',
        }
      }

      const otherCharacterId =
        relationship.characterIdA === args.characterId
          ? relationship.characterIdB
          : relationship.characterIdA

      const otherCharacter = await getCharacter(client, {
        id: otherCharacterId,
      })

      await deleteCharacterRelationship(client, {
        id: args.relationshipId,
        createdBy: session.user.id,
      })

      revalidatePath(`/${character.userid}/characters/${args.characterId}`)
      if (otherCharacter) {
        revalidatePath(
          `/${otherCharacter.userid}/characters/${otherCharacterId}`,
        )
      }
      return { success: true }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error unlinking characters:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { success: false, error: 'Failed to unlink characters' }
  }
}
