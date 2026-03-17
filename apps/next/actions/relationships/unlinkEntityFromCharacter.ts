'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  unlinkCharacterFromStory,
  unlinkCharacterFromLocation,
  unlinkCharacterFromTimeline,
  getCharacter,
} from '@repo/database'
import { z } from 'zod'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import { unlinkCharacterFromCharacter } from '../character-relationships/unlinkCharacterFromCharacter'

const UnlinkEntityFromCharacterSchema = z.object({
  characterId: z.number().int().positive(),
  entityType: z.enum(['story', 'character', 'location', 'timeline']),
  entityId: z.number().int().positive(),
})

export interface UnlinkEntityFromCharacterArgs {
  characterId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  entityId: number
}

export interface UnlinkEntityFromCharacterResult {
  success: boolean
  error?: string
}

export default async function unlinkEntityFromCharacter(
  args: UnlinkEntityFromCharacterArgs,
): Promise<UnlinkEntityFromCharacterResult> {
  const headersList = await headers()

  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null
  try {
    session = await auth.api.getSession({
      headers: headersList,
    })
  } catch (_error) {
    return {
      success: false,
      error: 'Unauthorized: You must be logged in',
    }
  }

  if (!session?.user?.id) {
    return {
      success: false,
      error: 'Unauthorized: You must be logged in',
    }
  }

  const parsed = UnlinkEntityFromCharacterSchema.safeParse(args)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid input',
    }
  }
  const validatedArgs = parsed.data

  try {
    const client = await pool.connect()
    try {
      const character = await getCharacter(client, {
        id: validatedArgs.characterId,
      })

      if (!character) {
        return {
          success: false,
          error: 'Character not found',
        }
      }

      if (character.userid !== session.user.id) {
        return {
          success: false,
          error:
            'Unauthorized: You can only unlink entities from your own characters',
        }
      }

      if (validatedArgs.entityType === 'story') {
        await unlinkCharacterFromStory(client, {
          storyId: validatedArgs.entityId,
          characterId: validatedArgs.characterId,
        })
      } else if (validatedArgs.entityType === 'character') {
        // For character relationships, entityId is the relationship row ID (relationshipId)
        const result = await unlinkCharacterFromCharacter({
          characterId: validatedArgs.characterId,
          relationshipId: validatedArgs.entityId,
        })
        if (!result.success) {
          return { success: false, error: result.error }
        }
      } else if (validatedArgs.entityType === 'location') {
        await unlinkCharacterFromLocation(client, {
          characterId: validatedArgs.characterId,
          locationId: validatedArgs.entityId,
        })
      } else if (validatedArgs.entityType === 'timeline') {
        await unlinkCharacterFromTimeline(client, {
          characterId: validatedArgs.characterId,
          timelineId: validatedArgs.entityId,
        })
      } else {
        return {
          success: false,
          error: `Unlinking ${validatedArgs.entityType}s from characters is not yet supported`,
        }
      }

      revalidatePath(
        `/${character.userid}/characters/${validatedArgs.characterId}`,
      )

      return {
        success: true,
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error unlinking entity from character:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return {
      success: false,
      error: 'Failed to unlink entity from character',
    }
  }
}
