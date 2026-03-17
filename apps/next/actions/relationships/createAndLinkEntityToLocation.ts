'use server'

import { headers } from 'next/headers'
import {
  createStory,
  linkLocationToStory,
  getLocation,
  checkStorySlugExists,
} from '@repo/database'
import { auth } from '../../auth'
import { generateUniqueSlug } from '../../utils/slug'
import pool from '../../app/utils/open-pool'
import { revalidatePath } from 'next/cache'

interface CreateAndLinkEntityToLocationArgs {
  locationId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  data: {
    name: string
    description: string
  }
}

interface CreateAndLinkEntityToLocationResult {
  success: boolean
  error?: string
  entityId?: number
}

/**
 * Creates a new entity (story, character, or timeline) and links it to a specific location.
 */
export default async function createAndLinkEntityToLocation({
  locationId,
  entityType,
  data,
}: CreateAndLinkEntityToLocationArgs): Promise<CreateAndLinkEntityToLocationResult> {
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
      const location = await getLocation(client, { id: locationId })

      if (!location) {
        return {
          success: false,
          error: 'Location not found',
        }
      }

      if (location.userid !== userId) {
        return {
          success: false,
          error:
            'Unauthorized: You can only link entities to your own locations',
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

          // Link the story to the location
          await linkLocationToStory(client, {
            storyId: newStory.id,
            locationId: locationId,
          })

          revalidatePath(`/${location.userid}/locations/${locationId}`)

          return { success: true, entityId: newStory.id }
        }
        case 'character':
          return {
            success: false,
            error:
              'Creating and linking characters to locations not yet supported',
          }
        case 'timeline':
          return {
            success: false,
            error:
              'Creating and linking timelines to locations not yet supported',
          }
        default:
          return { success: false, error: `Unknown entity type: ${entityType}` }
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error creating and linking entity to location:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
