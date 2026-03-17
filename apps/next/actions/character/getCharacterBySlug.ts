'use server'

import {
  getCharacterBySlug as getCharacterBySlugDb,
  GetCharacterBySlugArgs,
  GetCharacterBySlugRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getCharacterBySlug(
  args: GetCharacterBySlugArgs,
): Promise<GetCharacterBySlugRow | null> {
  try {
    const client = await pool.connect()
    try {
      const character = await getCharacterBySlugDb(client, args)
      return character
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching character by slug:', error)
    return null
  }
}
