import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '../../../auth'
import { CharactersListScreen } from '@app/features/characters/list-screen'
import listCharactersForUser from '../../../actions/user/listCharactersForUser'
import { resolveUsername } from '../../../lib/resolve-username'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function CharactersListPage({ params }: PageProps) {
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

  const characters = await listCharactersForUser({
    userid: userId,
    viewerid: session?.user?.id || null,
  })

  if (!characters) {
    notFound()
  }

  // Map to ensure privacy type is correctly typed
  const typedCharacters = characters.map((char) => ({
    ...char,
    privacy: char.privacy as 'public' | 'private',
  }))

  return (
    <CharactersListScreen
      characters={typedCharacters}
      userId={username}
      isOwner={isOwner}
    />
  )
}
