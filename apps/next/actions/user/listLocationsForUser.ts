'use server'
import {
  listLocationsForUserWithPrivacy as dbListLocationsForUser,
  ListLocationsForUserWithPrivacyRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function listLocationsForUser(args: {
  userid: string
  viewerid?: string | null
}): Promise<ListLocationsForUserWithPrivacyRow[]> {
  try {
    const client = await pool.connect()
    try {
      const isOwner = args.viewerid === args.userid
      const locations = await dbListLocationsForUser(client, {
        ownerId: args.userid,
        isOwner,
      })
      return locations
    } finally {
      client.release()
    }
  } catch (error) {
    return []
  }
}
