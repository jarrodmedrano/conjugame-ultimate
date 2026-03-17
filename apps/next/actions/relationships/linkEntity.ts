'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  linkCharacterToStory,
  linkLocationToStory,
  linkTimelineToStory,
  getStory,
} from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

export interface LinkEntityArgs {
  storyId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  entityIds: number[]
}

export interface LinkEntityResult {
  success: boolean
  error?: string
}

export default async function linkEntity(
  args: LinkEntityArgs,
): Promise<LinkEntityResult> {
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

  if (!args.entityIds || args.entityIds.length === 0) {
    return {
      success: false,
      error: 'No entities selected',
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

      const linkPromises = args.entityIds.map((entityId) => {
        if (args.entityType === 'character') {
          return linkCharacterToStory(client, {
            storyId: args.storyId,
            characterId: entityId,
          })
        } else if (args.entityType === 'location') {
          return linkLocationToStory(client, {
            storyId: args.storyId,
            locationId: entityId,
          })
        } else {
          return linkTimelineToStory(client, {
            storyId: args.storyId,
            timelineId: entityId,
          })
        }
      })

      await Promise.all(linkPromises)

      revalidatePath(`/${story.userid}/stories/${args.storyId}`)

      return {
        success: true,
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
          : 'Failed to link entities to story',
    }
  }
}
