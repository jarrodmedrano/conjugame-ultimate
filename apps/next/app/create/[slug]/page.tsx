import { auth } from '../../../auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { signinRoute } from '../../../routes'
import CreateScreen from '@app/features/create/screen'
import listEntitiesForUser from '../../../actions/entities/listEntitiesforUser'
import getStories from '../../../actions/story/getStories'
import pool from '../../utils/open-pool'

interface CreatePageProps {
  params: Promise<{ slug: string }>
}

export default async function CreatePage(props: CreatePageProps) {
  const headersList = await headers()

  // Get the session from better-auth
  let session
  try {
    session = await auth.api.getSession({
      headers: headersList,
    })
  } catch (error) {
    console.error('Error getting session:', error)
    throw new Error(
      `Failed to get session: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }

  if (!session) {
    // Get the current path from headers for callback
    const pathname = headersList.get('x-pathname') || '/'
    const search = headersList.get('x-search') || ''
    const callbackUrl = pathname + search

    redirect(`${signinRoute}?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const resolvedParams = await props.params
  const userId = session.user?.id
  const username = (session.user as { username?: string })?.username ?? ''

  // Fetch stories for the dropdown (only for entity types, not stories)
  let stories: { id: number; title: string }[] = []
  if (userId && resolvedParams?.slug !== 'stories') {
    const userStories = await getStories({
      userid: userId,
      limit: '100',
      offset: '0',
    })
    stories = userStories.map((s) => ({ id: s.id, title: s.title }))
  }

  let hasApiKey = false
  if (userId) {
    const client = await pool.connect()
    try {
      const keyResult = await client.query(
        `SELECT id FROM user_api_keys WHERE user_id = $1 LIMIT 1`,
        [userId],
      )
      hasApiKey = keyResult.rows.length > 0
    } finally {
      client.release()
    }
  }

  return (
    <CreateScreen
      params={resolvedParams}
      listEntitiesForUser={listEntitiesForUser}
      stories={stories}
      userId={userId}
      username={username}
      hasApiKey={hasApiKey}
    />
  )
}
