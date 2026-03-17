import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '../../../auth'
import { StoriesListScreen } from '@app/features/stories/list-screen'
import listStoriesForUser from '../../../actions/user/listStoriesForUser'
import { resolveUsername } from '../../../lib/resolve-username'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function StoriesListPage({ params }: PageProps) {
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

  const stories = await listStoriesForUser({
    userid: userId,
    viewerid: session?.user?.id || null,
  })

  if (!stories) {
    notFound()
  }

  // Map to ensure types are correctly typed and property names match
  const typedStories = stories.map((story) => ({
    id: story.id,
    title: story.title,
    content: story.content,
    privacy: story.privacy as 'public' | 'private',
    userid: story.userid,
    created_at: story.createdAt || new Date(),
  }))

  return (
    <StoriesListScreen
      stories={typedStories}
      userId={username}
      isOwner={isOwner}
    />
  )
}
