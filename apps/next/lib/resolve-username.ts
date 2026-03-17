import { cache } from 'react'
import { getUserByUsername } from '@repo/database'
import pool from '../app/utils/open-pool'
import { notFound } from 'next/navigation'

/**
 * Resolves a username to a user object.
 * Cached per-request — safe to call from layout + page without double DB hit.
 */
export const resolveUsername = cache(async (username: string) => {
  const client = await pool.connect()
  try {
    const user = await getUserByUsername(client, { username })
    if (!user) notFound()
    return user
  } finally {
    client.release()
  }
})
