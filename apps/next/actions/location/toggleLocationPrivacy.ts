'use server'

import { headers } from 'next/headers'
import { updateLocationPrivacy, getLocation } from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

export default async function toggleLocationPrivacy(args: {
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
      const location = await getLocation(client, { id: args.id })

      if (!location) {
        throw new Error('Location not found')
      }

      if (location.userid !== session.user.id) {
        throw new Error('Unauthorized: You can only update your own locations')
      }

      await updateLocationPrivacy(client, {
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
    throw new Error('Failed to update location privacy')
  }
}
