'use server'
import {
  getStoryBySlug as getStoryBySlugDb,
  GetStoryBySlugArgs,
  GetStoryBySlugRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getStoryBySlug(
  args: GetStoryBySlugArgs,
): Promise<GetStoryBySlugRow | null> {
  try {
    const client = await pool.connect()
    try {
      const story = await getStoryBySlugDb(client, args)
      return story
    } finally {
      client.release()
    }
  } catch (error) {
    return null
  }
}
