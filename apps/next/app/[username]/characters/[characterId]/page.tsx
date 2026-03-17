import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '../../../../auth'
import { CharacterDetailScreen } from '@app/features/characters/detail-screen'
import getCharacterById from '../../../../actions/character/getCharacterById'
import getCharacterBySlug from '../../../../actions/character/getCharacterBySlug'
import updateCharacter from '../../../../actions/character/updateCharacter'
import deleteCharacter from '../../../../actions/character/deleteCharacter'
import toggleCharacterPrivacy from '../../../../actions/character/toggleCharacterPrivacy'
import getRelatedEntitiesForCharacter from '../../../../actions/relationships/getRelatedEntitiesForCharacter'
import getUserEntities from '../../../../actions/relationships/getUserEntities'
import linkEntityToCharacter from '../../../../actions/relationships/linkEntityToCharacter'
import unlinkEntityFromCharacter from '../../../../actions/relationships/unlinkEntityFromCharacter'
import createAndLinkEntityToCharacter from '../../../../actions/relationships/createAndLinkEntityToCharacter'
import canUserViewEntity from '../../../../actions/permissions/canUserViewEntity'
import { getEntityImages, getCharacterAttributes } from '@repo/database'
import pool from '../../../../app/utils/open-pool'
import type { EntityImage } from '@app/types/entity-image'
import type { CharacterAttribute } from '@repo/database'
import { resolveUsername } from '../../../../lib/resolve-username'

interface PageProps {
  params: Promise<{ username: string; characterId: string }>
}

export default async function CharacterDetailPage({ params }: PageProps) {
  const { username, characterId } = await params
  const profileUser = await resolveUsername(username)
  const userId = profileUser.id
  const headersList = await headers()

  // Get session
  let session
  try {
    session = await auth.api.getSession({
      headers: headersList,
    })
  } catch (error) {
    session = null
  }

  // Fetch character - try slug first, then fall back to ID for backwards compatibility
  let character = await getCharacterBySlug({
    userid: userId,
    slug: characterId,
  })

  // If not found by slug, try by ID (for backwards compatibility with old URLs)
  if (!character && !isNaN(parseInt(characterId))) {
    character = await getCharacterById({ id: parseInt(characterId) })
  }

  if (!character) {
    notFound()
  }

  // Check permissions
  const canView = canUserViewEntity({
    viewerId: session?.user?.id,
    ownerId: character.userid,
    privacy: character.privacy as 'public' | 'private',
  })

  if (!canView) {
    notFound()
  }

  // Fetch related entities for this character
  const relatedEntities = await getRelatedEntitiesForCharacter({
    characterId: character.id,
  })

  // Fetch entity images and attributes
  const client = await pool.connect()
  let images: EntityImage[] = []
  let attributes: CharacterAttribute[] = []
  try {
    const [dbImages, dbAttributes] = await Promise.all([
      getEntityImages(client, {
        entityType: 'character',
        entityId: character.id,
      }),
      getCharacterAttributes(client, {
        characterId: character.id,
      }),
    ])
    // Convert database rows to EntityImage type
    images = dbImages.map((img) => ({
      id: img.id,
      entityType: img.entityType as
        | 'story'
        | 'character'
        | 'location'
        | 'timeline',
      entityId: img.entityId,
      cloudinaryPublicId: img.cloudinaryPublicId,
      cloudinaryUrl: img.cloudinaryUrl,
      isPrimary: img.isPrimary ?? false,
      displayOrder: img.displayOrder ?? 0,
      fileName: img.fileName ?? '',
      fileSize: img.fileSize ?? 0,
      width: img.width ?? 0,
      height: img.height ?? 0,
      createdAt: img.createdAt ?? new Date(),
      updatedAt: img.updatedAt ?? new Date(),
    }))
    attributes = dbAttributes
  } finally {
    client.release()
  }

  const isOwner = session?.user?.id === character.userid

  return (
    <CharacterDetailScreen
      character={character}
      relatedEntities={relatedEntities}
      images={images}
      attributes={attributes}
      isOwner={isOwner}
      isEditMode={false}
      userId={username}
      onUpdate={updateCharacter}
      onDelete={deleteCharacter}
      onTogglePrivacy={toggleCharacterPrivacy}
      onGetUserEntities={getUserEntities}
      onLinkEntity={linkEntityToCharacter}
      onUnlinkEntity={unlinkEntityFromCharacter}
      onCreateAndLinkEntity={createAndLinkEntityToCharacter}
    />
  )
}
