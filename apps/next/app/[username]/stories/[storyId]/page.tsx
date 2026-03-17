import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '../../../../auth'
import { StoryDetailScreen } from '@app/features/stories/detail-screen'
import getStoryById from '../../../../actions/story/getStoryById'
import getStoryBySlug from '../../../../actions/story/getStoryBySlug'
import updateStory from '../../../../actions/story/updateStory'
import deleteStory from '../../../../actions/story/deleteStory'
import toggleStoryPrivacy from '../../../../actions/story/toggleStoryPrivacy'
import getRelatedEntities from '../../../../actions/relationships/getRelatedEntities'
import getUserEntities from '../../../../actions/relationships/getUserEntities'
import linkEntity from '../../../../actions/relationships/linkEntity'
import unlinkEntity from '../../../../actions/relationships/unlinkEntity'
import createAndLinkEntity from '../../../../actions/relationships/createAndLinkEntity'
import canUserViewEntity from '../../../../actions/permissions/canUserViewEntity'
import { getEntityImages, getStoryAttributes } from '@repo/database'
import pool from '../../../../app/utils/open-pool'
import type { EntityImage } from '@app/types/entity-image'
import type { StoryAttribute } from '@repo/database'
import { resolveUsername } from '../../../../lib/resolve-username'

interface PageProps {
  params: Promise<{ username: string; storyId: string }>
}

export default async function StoryDetailPage({ params }: PageProps) {
  const { username, storyId } = await params
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

  // Fetch story - try by slug first, then by ID for backwards compatibility
  let story = await getStoryBySlug({ userid: userId, slug: storyId })

  // If not found by slug, try by ID (for old URLs or numeric IDs)
  if (!story && /^\d+$/.test(storyId)) {
    story = await getStoryById({ id: parseInt(storyId) })
  }

  if (!story) {
    notFound()
  }

  // Check permissions
  const canView = canUserViewEntity({
    viewerId: session?.user?.id,
    ownerId: story.userid,
    privacy: story.privacy as 'public' | 'private',
  })

  if (!canView) {
    notFound()
  }

  // Fetch related entities
  const relatedEntities = await getRelatedEntities({
    storyId: story.id,
  })

  // Fetch entity images and attributes
  const client = await pool.connect()
  let images: EntityImage[] = []
  let attributes: StoryAttribute[] = []
  try {
    const [dbImages, dbAttributes] = await Promise.all([
      getEntityImages(client, {
        entityType: 'story',
        entityId: story.id,
      }),
      getStoryAttributes(client, {
        storyId: story.id,
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

  const isOwner = session?.user?.id === story.userid

  return (
    <StoryDetailScreen
      story={story}
      relatedEntities={relatedEntities}
      images={images}
      attributes={attributes}
      isOwner={isOwner}
      isEditMode={false}
      userId={username}
      onUpdate={updateStory}
      onDelete={deleteStory}
      onTogglePrivacy={toggleStoryPrivacy}
      onGetUserEntities={getUserEntities}
      onLinkEntity={linkEntity}
      onUnlinkEntity={unlinkEntity}
      onCreateAndLinkEntity={createAndLinkEntity}
    />
  )
}
