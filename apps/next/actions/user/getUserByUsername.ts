'use server'

import { getUserByUsername } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function fetchUserByUsername(args: { username: string }) {
  const client = await pool.connect()
  try {
    return await getUserByUsername(client, { username: args.username })
  } catch (error) {
    console.error(
      'Error fetching user by username:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return null
  } finally {
    client.release()
  }
}
