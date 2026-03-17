'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  linkCharacterToStory,
  linkCharacterToLocation,
  linkCharacterToTimeline,
  getCharacter,
} from '@repo/database'
import { z } from 'zod'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import { linkCharacterToCharacter } from '../character-relationships/linkCharacterToCharacter'

const LinkEntityToCharacterSchema = z.object({
  characterId: z.number().int().positive(),
  entityType: z.enum(['story', 'character', 'location', 'timeline']),
  entityIds: z.array(z.number().int().positive()).min(1),
  relationshipType: z.string().optional(),
  customLabel: z.string().max(100).trim().optional().nullable(),
})

export interface LinkEntityToCharacterArgs {
  characterId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  entityIds: number[]
  relationshipType?: string
  customLabel?: string | null
}

export interface LinkEntityToCharacterResult {
  success: boolean
  error?: string
}

export default async function linkEntityToCharacter(
  args: LinkEntityToCharacterArgs,
): Promise<LinkEntityToCharacterResult> {
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

  const parsed = LinkEntityToCharacterSchema.safeParse(args)
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
            'Unauthorized: You can only link entities to your own characters',
        }
      }

      if (validatedArgs.entityType === 'story') {
        // Link stories to this character
        const linkPromises = validatedArgs.entityIds.map((storyId) =>
          linkCharacterToStory(client, {
            storyId,
            characterId: validatedArgs.characterId,
          }),
        )
        await Promise.all(linkPromises)
      } else if (validatedArgs.entityType === 'character') {
        // Link characters to this character via the relationship table
        const linkResults = await Promise.all(
          validatedArgs.entityIds.map((targetCharacterId) =>
            linkCharacterToCharacter({
              characterId: validatedArgs.characterId,
              targetCharacterId,
              relationshipType: validatedArgs.relationshipType,
              customLabel: validatedArgs.customLabel,
            }),
          ),
        )
        const failed = linkResults.find((r) => !r.success)
        if (failed) {
          return { success: false, error: failed.error }
        }
      } else if (validatedArgs.entityType === 'location') {
        const linkPromises = validatedArgs.entityIds.map((locationId) =>
          linkCharacterToLocation(client, {
            characterId: validatedArgs.characterId,
            locationId,
          }),
        )
        await Promise.all(linkPromises)
      } else if (validatedArgs.entityType === 'timeline') {
        const linkPromises = validatedArgs.entityIds.map((timelineId) =>
          linkCharacterToTimeline(client, {
            characterId: validatedArgs.characterId,
            timelineId,
          }),
        )
        await Promise.all(linkPromises)
      } else {
        return {
          success: false,
          error: `Linking ${validatedArgs.entityType}s to characters is not yet supported`,
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
      'Error linking entities to character:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return {
      success: false,
      error: 'Failed to link entities to character',
    }
  }
}
