'use server'

import { checkUsernameExists, getUserByUsername } from '@repo/database'
import { UsernameSchema } from '@repo/schema/username'
import pool from '../../app/utils/open-pool'

export default async function checkUsernameAvailable(args: {
  username: string
  excludeUserId?: string
}): Promise<{ available: boolean; error?: string }> {
  const result = UsernameSchema.safeParse(args.username)
  if (!result.success) {
    return { available: false, error: result.error.issues[0]?.message }
  }

  const client = await pool.connect()
  try {
    const { exists } = await checkUsernameExists(client, {
      username: result.data,
    })

    if (!exists) {
      return { available: true }
    }

    // If the username exists but excludeUserId is provided, check if it
    // belongs to the same user (i.e., user is keeping their current username)
    if (args.excludeUserId) {
      const existingUser = await getUserByUsername(client, {
        username: result.data,
      })
      if (existingUser && existingUser.id === args.excludeUserId) {
        return { available: true }
      }
    }

    return { available: false }
  } catch (error) {
    console.error(
      'Error checking username:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { available: false, error: 'Could not check username availability' }
  } finally {
    client.release()
  }
}
