'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import { getCharacter, createCharacterRelationship } from '@repo/database'
import { LinkCharacterToCharacterSchema } from '../../lib/validations/character-relationship'
import { z } from 'zod'

export interface LinkCharacterToCharacterArgs {
  characterId: number
  targetCharacterId: number
  relationshipType?: string
  customLabel?: string | null
}

export interface LinkCharacterToCharacterResult {
  success: boolean
  error?: string
}

export async function linkCharacterToCharacter(
  args: LinkCharacterToCharacterArgs,
): Promise<LinkCharacterToCharacterResult> {
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

  let validated: z.infer<typeof LinkCharacterToCharacterSchema>
  try {
    validated = LinkCharacterToCharacterSchema.parse({
      characterId: args.characterId,
      targetCharacterId: args.targetCharacterId,
      relationshipType: args.relationshipType ?? 'custom',
      customLabel: args.customLabel,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? 'Validation failed',
      }
    }
    return { success: false, error: 'Validation failed' }
  }

  if (validated.characterId === validated.targetCharacterId) {
    return { success: false, error: 'A character cannot be related to itself' }
  }

  try {
    const client = await pool.connect()
    try {
      const character = await getCharacter(client, {
        id: validated.characterId,
      })
      if (!character) return { success: false, error: 'Character not found' }
      if (character.userid !== session.user.id) {
        return {
          success: false,
          error:
            'Unauthorized: You can only add relationships to your own characters',
        }
      }

      const targetCharacter = await getCharacter(client, {
        id: validated.targetCharacterId,
      })
      if (!targetCharacter)
        return { success: false, error: 'Target character not found' }
      if (targetCharacter.userid !== session.user.id) {
        return {
          success: false,
          error: 'Unauthorized: You can only link to your own characters',
        }
      }

      await createCharacterRelationship(client, {
        characterIdA: validated.characterId,
        characterIdB: validated.targetCharacterId,
        relationshipType: validated.relationshipType,
        customLabel: validated.customLabel ?? null,
        createdBy: session.user.id,
      })

      revalidatePath(`/${character.userid}/characters/${args.characterId}`)
      revalidatePath(
        `/${targetCharacter.userid}/characters/${args.targetCharacterId}`,
      )
      return { success: true }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error linking characters:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { success: false, error: 'Failed to link characters' }
  }
}
