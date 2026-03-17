import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '../../../../../auth'
import { CharacterRelationshipsScreen } from '@app/features/characters/relationships-screen'
import getCharacterBySlug from '../../../../../actions/character/getCharacterBySlug'
import getCharacterById from '../../../../../actions/character/getCharacterById'
import { getCharacterRelationships } from '../../../../../actions/character-relationships/getCharacterRelationships'
import canUserViewEntity from '../../../../../actions/permissions/canUserViewEntity'
import { resolveUsername } from '../../../../../lib/resolve-username'

interface PageProps {
  params: Promise<{ username: string; characterId: string }>
}

export default async function CharacterRelationshipsPage({
  params,
}: PageProps) {
  const { username, characterId } = await params
  const profileUser = await resolveUsername(username)
  const userId = profileUser.id
  const headersList = await headers()

  let session
  try {
    session = await auth.api.getSession({ headers: headersList })
  } catch {
    session = null
  }

  // Try slug first, then ID fallback
  let character = await getCharacterBySlug({
    userid: userId,
    slug: characterId,
  })

  if (!character && !isNaN(parseInt(characterId))) {
    character = await getCharacterById({ id: parseInt(characterId) })
  }

  if (!character) {
    notFound()
  }

  const canView = canUserViewEntity({
    viewerId: session?.user?.id,
    ownerId: character.userid,
    privacy: character.privacy as 'public' | 'private',
  })

  if (!canView) {
    notFound()
  }

  const relationships = await getCharacterRelationships({
    characterId: character.id,
  })

  return (
    <CharacterRelationshipsScreen
      character={{
        id: character.id,
        name: character.name,
        slug: character.slug,
        primaryImageUrl: null,
      }}
      relationships={relationships}
      userId={username}
    />
  )
}
