'use server'

import { headers } from 'next/headers'
import {
  deleteCharacter as deleteCharacterDb,
  getCharacter,
} from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

export default async function deleteCharacter(args: {
  id: number
}): Promise<void> {
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
      const character = await getCharacter(client, { id: args.id })

      if (!character) {
        throw new Error('Character not found')
      }

      if (character.userid !== session.user.id) {
        throw new Error('Unauthorized: You can only delete your own characters')
      }

      await deleteCharacterDb(client, { id: args.id })
    } finally {
      client.release()
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to delete character')
  }
}
