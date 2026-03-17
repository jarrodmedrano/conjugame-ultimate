'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  unlinkCharacterFromStory,
  unlinkLocationFromStory,
  unlinkTimelineFromStory,
  getStory,
} from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

export interface UnlinkEntityArgs {
  storyId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  entityId: number
}

export interface UnlinkEntityResult {
  success: boolean
  error?: string
}

export default async function unlinkEntity(
  args: UnlinkEntityArgs,
): Promise<UnlinkEntityResult> {
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
          error:
            'Unauthorized: You can only unlink entities from your own stories',
        }
      }

      if (args.entityType === 'character') {
        await unlinkCharacterFromStory(client, {
          storyId: args.storyId,
          characterId: args.entityId,
        })
      } else if (args.entityType === 'location') {
        await unlinkLocationFromStory(client, {
          storyId: args.storyId,
          locationId: args.entityId,
        })
      } else {
        await unlinkTimelineFromStory(client, {
          storyId: args.storyId,
          timelineId: args.entityId,
        })
      }

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
          : 'Failed to unlink entity from story',
    }
  }
}
