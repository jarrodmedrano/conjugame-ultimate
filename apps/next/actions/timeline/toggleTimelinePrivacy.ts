'use server'

import { headers } from 'next/headers'
import { updateTimelinePrivacy, getTimeline } from '@repo/database'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'

export default async function toggleTimelinePrivacy(args: {
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
      const timeline = await getTimeline(client, { id: args.id })

      if (!timeline) {
        throw new Error('Timeline not found')
      }

      if (timeline.userid !== session.user.id) {
        throw new Error('Unauthorized: You can only update your own timelines')
      }

      await updateTimelinePrivacy(client, {
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
    throw new Error('Failed to update timeline privacy')
  }
}
