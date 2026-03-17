'use server'

import { headers } from 'next/headers'
import { updateCharacterPrivacy, getCharacter } from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

export default async function toggleCharacterPrivacy(args: {
  id: number
  privacy: string
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
        throw new Error('Unauthorized: You can only update your own characters')
      }

      await updateCharacterPrivacy(client, {
        id: args.id,
        privacy: args.privacy,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update character privacy')
  }
}
