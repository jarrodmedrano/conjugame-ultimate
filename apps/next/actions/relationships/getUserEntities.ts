'use server'

import { headers } from 'next/headers'
import {
  listCharactersForUser,
  listLocationsForUser,
  listTimelinesForUser,
  listStoriesForUser,
} from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import type { RelatedEntityItem } from '@app/features/shared/EntityDetailScreen.types'

export interface GetUserEntitiesArgs {
  entityType: 'character' | 'location' | 'timeline' | 'story'
}

export interface GetUserEntitiesResult {
  success: boolean
  error?: string
  entities?: RelatedEntityItem[]
}

export default async function getUserEntities(
  args: GetUserEntitiesArgs,
): Promise<GetUserEntitiesResult> {
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
      let entities: RelatedEntityItem[]

      if (args.entityType === 'character') {
        const chars = await listCharactersForUser(client, {
          userid: session.user.id,
          limit: '1000',
          offset: '0',
        })
        entities = chars.map((char) => ({
          id: char.id,
          name: char.name,
          description: char.description,
        }))
      } else if (args.entityType === 'location') {
        const locs = await listLocationsForUser(client, {
          userid: session.user.id,
          limit: '1000',
          offset: '0',
        })
        entities = locs.map((loc) => ({
          id: loc.id,
          name: loc.name,
          description: loc.description,
        }))
      } else if (args.entityType === 'story') {
        const stories = await listStoriesForUser(client, {
          userid: session.user.id,
          limit: '1000',
          offset: '0',
        })
        // Normalize stories to have 'name' instead of 'title' for consistency with other entity types
        entities = stories.map((story) => ({
          id: story.id,
          name: story.title,
          title: story.title,
          description: story.content,
        }))
      } else {
        const timelines = await listTimelinesForUser(client, {
          userid: session.user.id,
          limit: '1000',
          offset: '0',
        })
        entities = timelines.map((timeline) => ({
          id: timeline.id,
          name: timeline.name,
          description: timeline.description,
        }))
      }

      return {
        success: true,
        entities,
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
          : 'Failed to fetch user entities',
    }
  }
}
