import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '../../../../auth'
import { LocationDetailScreen } from '@app/features/locations/detail-screen'
import getLocationById from '../../../../actions/location/getLocationById'
import getLocationBySlug from '../../../../actions/location/getLocationBySlug'
import updateLocation from '../../../../actions/location/updateLocation'
import deleteLocation from '../../../../actions/location/deleteLocation'
import toggleLocationPrivacy from '../../../../actions/location/toggleLocationPrivacy'
import canUserViewEntity from '../../../../actions/permissions/canUserViewEntity'
import getUserEntities from '../../../../actions/relationships/getUserEntities'
import linkEntityToLocation from '../../../../actions/relationships/linkEntityToLocation'
import unlinkEntityFromLocation from '../../../../actions/relationships/unlinkEntityFromLocation'
import createAndLinkEntityToLocation from '../../../../actions/relationships/createAndLinkEntityToLocation'
import getRelatedEntitiesForLocation from '../../../../actions/relationships/getRelatedEntitiesForLocation'
import { getEntityImages, getLocationAttributes } from '@repo/database'
import pool from '../../../../app/utils/open-pool'
import type { EntityImage } from '@app/types/entity-image'
import type { LocationAttribute } from '@repo/database'
import { resolveUsername } from '../../../../lib/resolve-username'

interface PageProps {
  params: Promise<{ username: string; locationId: string }>
}

export default async function LocationDetailPage({ params }: PageProps) {
  const { username, locationId } = await params
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

  // Fetch location - try slug first, then fall back to ID for backwards compatibility
  let location = await getLocationBySlug({ userid: userId, slug: locationId })

  // If not found by slug, try by ID (for backwards compatibility with old URLs)
  if (!location && !isNaN(parseInt(locationId))) {
    location = await getLocationById({ id: parseInt(locationId) })
  }

  if (!location) {
    notFound()
  }

  // Check permissions
  const canView = canUserViewEntity({
    viewerId: session?.user?.id,
    ownerId: location.userid,
    privacy: location.privacy as 'public' | 'private',
  })

  if (!canView) {
    notFound()
  }

  // For now, related entities are empty
  // TODO: Implement getRelatedEntitiesForLocation when database schema is updated
  const relatedEntitiesResult = await getRelatedEntitiesForLocation(location.id)
  const relatedEntities = relatedEntitiesResult.entities || {
    stories: [],
    characters: [],
    timelines: [],
  }

  // Fetch entity images and attributes
  const client = await pool.connect()
  let images: EntityImage[] = []
  let attributes: LocationAttribute[] = []
  try {
    const [dbImages, dbAttributes] = await Promise.all([
      getEntityImages(client, {
        entityType: 'location',
        entityId: location.id,
      }),
      getLocationAttributes(client, {
        locationId: location.id,
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

  const isOwner = session?.user?.id === location.userid

  return (
    <LocationDetailScreen
      location={location}
      relatedEntities={relatedEntities}
      images={images}
      attributes={attributes}
      isOwner={isOwner}
      isEditMode={false}
      userId={username}
      onUpdate={updateLocation}
      onDelete={deleteLocation}
      onTogglePrivacy={toggleLocationPrivacy}
      onGetUserEntities={getUserEntities}
      onLinkEntity={linkEntityToLocation}
      onUnlinkEntity={unlinkEntityFromLocation}
      onCreateAndLinkEntity={createAndLinkEntityToLocation}
    />
  )
}
