import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '../../../auth'
import { TimelinesListScreen } from '@app/features/timelines/list-screen'
import listTimelinesForUser from '../../../actions/user/listTimelinesForUser'
import { resolveUsername } from '../../../lib/resolve-username'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function TimelinesListPage({ params }: PageProps) {
  const { username } = await params
  const profileUser = await resolveUsername(username)
  const userId = profileUser.id
  const headersList = await headers()

  let session
  try {
    session = await auth.api.getSession({
      headers: headersList,
    })
  } catch (error) {
    session = null
  }

  const isOwner = session?.user?.id === userId

  const timelines = await listTimelinesForUser({
    userid: userId,
    viewerid: session?.user?.id || null,
  })

  if (!timelines) {
    notFound()
  }

  // Map to ensure privacy type is correctly typed
  const typedTimelines = timelines.map((timeline) => ({
    ...timeline,
    privacy: timeline.privacy as 'public' | 'private',
  }))

  return (
    <TimelinesListScreen
      timelines={typedTimelines}
      userId={username}
      isOwner={isOwner}
    />
  )
}
