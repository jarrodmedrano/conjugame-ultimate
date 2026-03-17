'use server'

import { headers } from 'next/headers'
import { updateUser } from '@repo/database'
import pool from '../../app/utils/open-pool'
import { UsernameSchema } from '@repo/schema/username'
import checkUsernameAvailable from './checkUsernameAvailable'
import getUserById from './getUserById'

export async function updateUsername({
  username,
}: {
  username: string
}): Promise<{ success?: boolean; username?: string; error?: string }> {
  const headersList = await headers()

  let session: { user: { id: string; email: string } } | null = null
  try {
    const { auth } = await import('../../auth')
    const rawSession = await auth.api.getSession({ headers: headersList })
    if (rawSession?.user) {
      session = rawSession as { user: { id: string; email: string } }
    }
  } catch {
    session = null
  }

  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  const result = UsernameSchema.safeParse(username)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid username' }
  }

  const availability = await checkUsernameAvailable({
    username: result.data,
    excludeUserId: session.user.id,
  })
  if (!availability.available) {
    return { error: availability.error ?? 'Username already taken' }
  }

  // Fetch current user to get required email field
  const currentUser = await getUserById({ id: session.user.id })
  if (!currentUser) {
    return { error: 'User not found' }
  }

  const client = await pool.connect()
  try {
    await updateUser(client, {
      id: session.user.id,
      username: result.data,
      name: null,
      email: currentUser.email,
      emailverified: null,
      image: null,
      slug: null,
      role: null,
      istwofactorenabled: null,
      locale: null,
    })
    return { success: true, username: result.data }
  } catch (error) {
    console.error(
      'Error updating username:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { error: 'Failed to update username' }
  } finally {
    client.release()
  }
}
