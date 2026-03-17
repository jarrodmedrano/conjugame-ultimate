'use server'

import { headers } from 'next/headers'
import { updateStoryPrivacy, getStory } from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

export default async function toggleStoryPrivacy(args: {
  id: number
  privacy: string
}): Promise<void> {
  const headersList = await headers()

  let session
  try {
    session = await auth.api.getSession({
      headers: headersList,
    })
  } catch (error) {
    throw new Error('Unauthorized: You must be logged in')
  }

  if (!session?.user?.id) {
    throw new Error('Unauthorized: You must be logged in')
  }

  try {
    const client = await pool.connect()
    try {
      const story = await getStory(client, { id: args.id })

      if (!story) {
        throw new Error('Story not found')
      }

      if (story.userid !== session.user.id) {
        throw new Error('Unauthorized: You can only update your own stories')
      }

      await updateStoryPrivacy(client, { id: args.id, privacy: args.privacy })
    } finally {
      client.release()
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update story privacy')
  }
}
