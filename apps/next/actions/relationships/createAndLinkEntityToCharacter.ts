'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  createStory,
  linkCharacterToStory,
  getCharacter,
  checkStorySlugExists,
} from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import { generateUniqueSlug } from '../../utils/slug'

export interface CreateAndLinkEntityToCharacterArgs {
  characterId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  data: { name: string; description: string }
}

export interface CreateAndLinkEntityToCharacterResult {
  success: boolean
  error?: string
  entityId?: number
}

export default async function createAndLinkEntityToCharacter(
  args: CreateAndLinkEntityToCharacterArgs,
): Promise<CreateAndLinkEntityToCharacterResult> {
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

  const userId = session.user.id

  if (!args.data.name) {
    return {
      success: false,
      error: 'Name is required',
    }
  }

  try {
    const client = await pool.connect()
    try {
      const character = await getCharacter(client, { id: args.characterId })

      if (!character) {
        return {
          success: false,
          error: 'Character not found',
        }
      }

      if (character.userid !== userId) {
        return {
          success: false,
          error:
            'Unauthorized: You can only link entities to your own characters',
        }
      }

      if (args.entityType === 'story') {
        // Generate unique slug
        const slug = await generateUniqueSlug(
          args.data.name,
          async (candidateSlug) => {
            const result = await checkStorySlugExists(client, {
              userid: userId,
              slug: candidateSlug,
            })
            return result?.exists ?? false
          },
        )

        // Create the story
        const story = await createStory(client, {
          userid: userId,
          title: args.data.name,
          content: args.data.description || '',
          privacy: 'private',
          slug,
        })

        if (!story) {
          return {
            success: false,
            error: 'Failed to create story',
          }
        }

        // Link character to the new story
        await linkCharacterToStory(client, {
          storyId: story.id,
          characterId: args.characterId,
        })

        revalidatePath(`/${character.userid}/characters/${args.characterId}`)

        return {
          success: true,
          entityId: story.id,
        }
      } else {
        // TODO: Implement creating locations and timelines linked to characters
        return {
          success: false,
          error: `Creating ${args.entityType}s for characters is not yet supported`,
        }
      }
    } finally {
      client.release()
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create and link entity to character',
    }
  }
}
