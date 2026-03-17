'use server'
import {
  GetCharacterArgs,
  GetCharacterRow,
  getCharacter as getCharacterDb,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getCharacterById(
  args: GetCharacterArgs,
): Promise<GetCharacterRow | null> {
  try {
    const client = await pool.connect()
    try {
      const character = await getCharacterDb(client, args)
      return character
    } finally {
      client.release()
    }
  } catch (error) {
    return null
  }
}
