import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '../../../../auth'
import { TimelineDetailScreen } from '@app/features/timelines/detail-screen'
import getTimelineById from '../../../../actions/timeline/getTimelineById'
import getTimelineBySlug from '../../../../actions/timeline/getTimelineBySlug'
import updateTimeline from '../../../../actions/timeline/updateTimeline'
import deleteTimeline from '../../../../actions/timeline/deleteTimeline'
import toggleTimelinePrivacy from '../../../../actions/timeline/toggleTimelinePrivacy'
import canUserViewEntity from '../../../../actions/permissions/canUserViewEntity'
import getUserEntities from '../../../../actions/relationships/getUserEntities'
import linkEntityToTimeline from '../../../../actions/relationships/linkEntityToTimeline'
import unlinkEntityFromTimeline from '../../../../actions/relationships/unlinkEntityFromTimeline'
import createAndLinkEntityToTimeline from '../../../../actions/relationships/createAndLinkEntityToTimeline'
import getRelatedEntitiesForTimeline from '../../../../actions/relationships/getRelatedEntitiesForTimeline'
import { getTimelineEvents } from '../../../../actions/timeline-events/getTimelineEvents'
import { createTimelineEvent } from '../../../../actions/timeline-events/createTimelineEvent'
import { updateTimelineEvent } from '../../../../actions/timeline-events/updateTimelineEvent'
import { deleteTimelineEvent } from '../../../../actions/timeline-events/deleteTimelineEvent'
import { getEntityImages } from '@repo/database'
import pool from '../../../../app/utils/open-pool'
import type { EntityImage } from '@app/types/entity-image'
import { resolveUsername } from '../../../../lib/resolve-username'

interface PageProps {
  params: Promise<{ username: string; timelineId: string }>
}

export default async function TimelineDetailPage({ params }: PageProps) {
  const { username, timelineId } = await params
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

  // Fetch timeline - try slug first, then fall back to ID for backwards compatibility
  let timeline = await getTimelineBySlug({ userid: userId, slug: timelineId })

  // If not found by slug, try by ID (for backwards compatibility with old URLs)
  if (!timeline && !isNaN(parseInt(timelineId))) {
    timeline = await getTimelineById({ id: parseInt(timelineId) })
  }

  if (!timeline) {
    notFound()
  }

  // Check permissions
  const canView = canUserViewEntity({
    viewerId: session?.user?.id,
    ownerId: timeline.userid,
    privacy: timeline.privacy as 'public' | 'private',
  })

  if (!canView) {
    notFound()
  }

  const relatedEntitiesResult = await getRelatedEntitiesForTimeline(timeline.id)
  const relatedEntities = relatedEntitiesResult.entities || {
    stories: [],
    characters: [],
    locations: [],
  }

  // Fetch timeline events
  const events = await getTimelineEvents(timeline.id)

  // Fetch entity images
  const client = await pool.connect()
  let images: EntityImage[] = []
  try {
    const dbImages = await getEntityImages(client, {
      entityType: 'timeline',
      entityId: timeline.id,
    })
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
  } finally {
    client.release()
  }

  const isOwner = session?.user?.id === timeline.userid

  return (
    <TimelineDetailScreen
      timeline={timeline}
      relatedEntities={relatedEntities}
      images={images}
      isOwner={isOwner}
      isEditMode={false}
      userId={username}
      events={events}
      onUpdate={updateTimeline}
      onDelete={deleteTimeline}
      onTogglePrivacy={toggleTimelinePrivacy}
      onGetUserEntities={getUserEntities}
      onLinkEntity={linkEntityToTimeline}
      onUnlinkEntity={unlinkEntityFromTimeline}
      onCreateAndLinkEntity={createAndLinkEntityToTimeline}
      onCreateEvent={createTimelineEvent}
      onUpdateEvent={updateTimelineEvent}
      onDeleteEvent={deleteTimelineEvent}
    />
  )
}
