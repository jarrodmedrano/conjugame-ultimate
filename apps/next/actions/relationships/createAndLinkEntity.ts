'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  createCharacter,
  createLocation,
  createTimeline,
  linkCharacterToStory,
  linkLocationToStory,
  linkTimelineToStory,
  getStory,
} from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

export interface CreateAndLinkEntityArgs {
  storyId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  data: {
    name: string
    description: string
  }
}

export interface CreateAndLinkEntityResult {
  success: boolean
  error?: string
  entityId?: number
}

export default async function createAndLinkEntity(
  args: CreateAndLinkEntityArgs,
): Promise<CreateAndLinkEntityResult> {
  const headersList = await headers()

  let session
  try {
    session = await auth.api.getSession({
      headers: headersList,
    })
  } catch (error) {
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

  if (!args.data.name || args.data.name.trim().length === 0) {
    return {
      success: false,
      error: 'Entity name is required',
    }
  }

  try {
    const client = await pool.connect()
    try {
      const story = await getStory(client, { id: args.storyId })

      if (!story) {
        return {
          success: false,
          error: 'Story not found',
        }
      }

      if (story.userid !== session.user.id) {
        return {
          success: false,
          error: 'Unauthorized: You can only link entities to your own stories',
        }
      }

      const slug = args.data.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const entityData = {
        userid: session.user.id,
        name: args.data.name.trim(),
        description: args.data.description.trim() || null,
        privacy: 'private',
        slug,
      }

      let newEntity: { id: number } | null = null

      if (args.entityType === 'character') {
        newEntity = await createCharacter(client, entityData)
        if (newEntity) {
          await linkCharacterToStory(client, {
            storyId: args.storyId,
            characterId: newEntity.id,
          })
        }
      } else if (args.entityType === 'location') {
        newEntity = await createLocation(client, entityData)
        if (newEntity) {
          await linkLocationToStory(client, {
            storyId: args.storyId,
            locationId: newEntity.id,
          })
        }
      } else {
        newEntity = await createTimeline(client, entityData)
        if (newEntity) {
          await linkTimelineToStory(client, {
            storyId: args.storyId,
            timelineId: newEntity.id,
          })
        }
      }

      if (!newEntity) {
        return {
          success: false,
          error: 'Failed to create entity',
        }
      }

      revalidatePath(`/${story.userid}/stories/${args.storyId}`)

      return {
        success: true,
        entityId: newEntity.id,
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
          : 'Failed to create and link entity',
    }
  }
}
