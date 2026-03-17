'use server'
import {
  listTimelinesForUserWithPrivacy as dbListTimelinesForUser,
  ListTimelinesForUserWithPrivacyRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function listTimelinesForUser(args: {
  userid: string
  viewerid?: string | null
}): Promise<ListTimelinesForUserWithPrivacyRow[]> {
  try {
    const client = await pool.connect()
    try {
      const isOwner = args.viewerid === args.userid
      const timelines = await dbListTimelinesForUser(client, {
        ownerId: args.userid,
        isOwner,
      })
      return timelines
    } finally {
      client.release()
    }
  } catch (error) {
    return []
  }
}
