'use server'
import {
  listCharactersForUserWithPrivacy as dbListCharactersForUser,
  ListCharactersForUserWithPrivacyRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function listCharactersForUser(args: {
  userid: string
  viewerid?: string | null
}): Promise<ListCharactersForUserWithPrivacyRow[]> {
  try {
    const client = await pool.connect()
    try {
      const isOwner = args.viewerid === args.userid
      const characters = await dbListCharactersForUser(client, {
        ownerId: args.userid,
        isOwner,
      })
      return characters
    } finally {
      client.release()
    }
  } catch (error) {
    return []
  }
}
