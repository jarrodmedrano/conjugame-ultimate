'use server'

import { headers } from 'next/headers'
import {
  createStory,
  linkTimelineToStory,
  getTimeline,
  checkStorySlugExists,
} from '@repo/database'
import { auth } from '../../auth'
import { generateUniqueSlug } from '../../utils/slug'
import pool from '../../app/utils/open-pool'
import { revalidatePath } from 'next/cache'

interface CreateAndLinkEntityToTimelineArgs {
  timelineId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  data: {
    name: string
    description: string
  }
}

interface CreateAndLinkEntityToTimelineResult {
  success: boolean
  error?: string
  entityId?: number
}

/**
 * Creates a new entity (story, character, or location) and links it to a specific timeline.
 */
export default async function createAndLinkEntityToTimeline({
  timelineId,
  entityType,
  data,
}: CreateAndLinkEntityToTimelineArgs): Promise<CreateAndLinkEntityToTimelineResult> {
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
    return { success: false, error: 'Unauthorized' }
  }

  const userId = session.user.id

  if (!data.name) {
    return {
      success: false,
      error: 'Name is required',
    }
  }

  try {
    const client = await pool.connect()
    try {
      const timeline = await getTimeline(client, { id: timelineId })

      if (!timeline) {
        return {
          success: false,
          error: 'Timeline not found',
        }
      }

      if (timeline.userid !== userId) {
        return {
          success: false,
          error:
            'Unauthorized: You can only link entities to your own timelines',
        }
      }

      switch (entityType) {
        case 'story': {
          // Generate unique slug
          const slug = await generateUniqueSlug(
            data.name,
            async (candidateSlug) => {
              const result = await checkStorySlugExists(client, {
                userid: userId,
                slug: candidateSlug,
              })
              return result?.exists ?? false
            },
          )

          // Create the story
          const newStory = await createStory(client, {
            userid: userId,
            title: data.name,
            content: data.description || '',
            privacy: 'private',
            slug,
          })

          if (!newStory) {
            return { success: false, error: 'Failed to create story' }
          }

          // Link the story to the timeline
          await linkTimelineToStory(client, {
            storyId: newStory.id,
            timelineId: timelineId,
          })

          revalidatePath(`/${timeline.userid}/timelines/${timelineId}`)

          return { success: true, entityId: newStory.id }
        }
        case 'character':
          return {
            success: false,
            error:
              'Creating and linking characters to timelines not yet supported',
          }
        case 'location':
          return {
            success: false,
            error:
              'Creating and linking locations to timelines not yet supported',
          }
        default:
          return { success: false, error: `Unknown entity type: ${entityType}` }
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error creating and linking entity to timeline:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
