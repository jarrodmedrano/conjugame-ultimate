'use server'
import {
  listStoriesForUserWithPrivacy as dbListStoriesForUser,
  ListStoriesForUserWithPrivacyArgs,
  ListStoriesForUserWithPrivacyRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function listStoriesForUser(args: {
  userid: string
  viewerid?: string | null
}): Promise<ListStoriesForUserWithPrivacyRow[]> {
  try {
    const client = await pool.connect()
    try {
      const isOwner = args.viewerid === args.userid
      const stories = await dbListStoriesForUser(client, {
        ownerId: args.userid,
        isOwner,
      })
      return stories
    } finally {
      client.release()
    }
  } catch (error) {
    return []
  }
}
