'use server'
import {
  ListStoriesForUserArgs,
  ListStoriesForUserRow,
  listStoriesForUser,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getStories(
  args: ListStoriesForUserArgs,
): Promise<ListStoriesForUserRow[]> {
  try {
    const client = await pool.connect()
    try {
      const stories = await listStoriesForUser(client, args)
      return stories
    } finally {
      client.release()
    }
  } catch (error) {
    return []
  }
}
