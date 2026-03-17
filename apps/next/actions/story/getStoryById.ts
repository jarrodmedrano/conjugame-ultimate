'use server'
import {
  getStory as getStoryDb,
  GetStoryArgs,
  GetStoryRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getStoryById(
  args: GetStoryArgs,
): Promise<GetStoryRow | null> {
  try {
    const client = await pool.connect()
    try {
      const story = await getStoryDb(client, args)
      return story
    } finally {
      client.release()
    }
  } catch (error) {
    return null
  }
}
