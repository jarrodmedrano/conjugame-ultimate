'use server'

import { headers } from 'next/headers'
import { deleteStory as deleteStoryDb, getStory } from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

export default async function deleteStory(args: { id: number }): Promise<void> {
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
        throw new Error('Unauthorized: You can only delete your own stories')
      }

      await deleteStoryDb(client, { id: args.id })
    } finally {
      client.release()
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to delete story')
  }
}
