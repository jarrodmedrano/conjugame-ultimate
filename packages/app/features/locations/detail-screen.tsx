'use client'

import type { GetLocationRow, LocationAttribute } from '@repo/database'
import { EntityDetailScreen } from '../shared/EntityDetailScreen'
import { LocationDetail } from './components/LocationDetail'
import { EditLocationModal } from './components/EditLocationModal'
import { useLocationEdit, type LocationFormData } from './hooks/useLocationEdit'
import type { RelatedEntityItem } from '../shared/EntityDetailScreen.types'
import type { EntityImage } from '../../types/entity-image'

interface RelatedEntities {
  stories: RelatedEntityItem[]
  characters: RelatedEntityItem[]
  timelines: RelatedEntityItem[]
}

interface LocationDetailScreenProps {
  location: GetLocationRow
  relatedEntities: RelatedEntities
  images: EntityImage[]
  attributes?: LocationAttribute[]
  isOwner: boolean
  isEditMode: boolean
  userId: string
  onUpdate?: (args: {
    id: number
    name: string
    description: string | null
  }) => Promise<GetLocationRow | null>
  onDelete?: (args: { id: number }) => Promise<void>
  onTogglePrivacy?: (args: { id: number; privacy: string }) => Promise<void>
  onGetUserEntities?: (args: {
    entityType: 'story' | 'character' | 'location' | 'timeline'
  }) => Promise<{
    success: boolean
    error?: string
    entities?: RelatedEntityItem[]
  }>
  onLinkEntity?: (args: {
    locationId: number
    entityType: 'story' | 'character' | 'location' | 'timeline'
    entityIds: number[]
  }) => Promise<{ success: boolean; error?: string }>
  onUnlinkEntity?: (args: {
    locationId: number
    entityType: 'story' | 'character' | 'location' | 'timeline'
    entityId: number
  }) => Promise<{ success: boolean; error?: string }>
  onCreateAndLinkEntity?: (args: {
    locationId: number
    entityType: 'story' | 'character' | 'location' | 'timeline'
    data: { name: string; description: string }
  }) => Promise<{ success: boolean; error?: string; entityId?: number }>
}

export function LocationDetailScreen(props: LocationDetailScreenProps) {
  // Create a wrapper for useLocationEdit that injects images and attributes
  const useLocationEditWithImages = (config: Record<string, unknown>) => {
    return useLocationEdit({
      ...config,
      images: props.images,
      attributes: props.attributes ?? [],
    } as never)
  }

  return (
    <EntityDetailScreen
      entityType="location"
      entity={props.location}
      relatedEntities={props.relatedEntities}
      isOwner={props.isOwner}
      isEditMode={props.isEditMode}
      userId={props.userId}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
      onTogglePrivacy={props.onTogglePrivacy}
      onGetUserEntities={props.onGetUserEntities}
      onLinkEntity={props.onLinkEntity}
      onUnlinkEntity={props.onUnlinkEntity}
      onCreateAndLinkEntity={props.onCreateAndLinkEntity}
      useEntityEdit={
        useLocationEditWithImages as unknown as (
          config: Record<string, unknown>,
        ) => {
          formData: {
            name: string
            description: string
            images: EntityImage[]
            attributes: LocationAttribute[]
          }
          isEditing: boolean
          isDirty: boolean
          startEditing: () => void
          cancelEditing: () => void
          updateField: (
            field: keyof {
              name: string
              description: string
              images: EntityImage[]
              attributes: LocationAttribute[]
            },
            value: string | EntityImage[] | LocationAttribute[],
          ) => void
          saveChanges: () => void
        }
      }
      handleSave={async ({ entity, formData, onUpdate }) => {
        if (!onUpdate) {
          throw new Error('Update function not available')
        }

        const result = await onUpdate({
          id: entity.id,
          name: formData.name,
          description: formData.description || null,
        })

        if (!result) {
          throw new Error('Update failed')
        }
      }}
      getEntityId={(entity) => entity.id}
      entityLabel="Location"
      entityLabelPlural="Locations"
      DetailComponent={(detailProps) => {
        const location = detailProps.entity || detailProps.location
        return (
          <LocationDetail
            location={{
              ...location,
              privacy: location.privacy as 'public' | 'private',
            }}
            userId={props.userId}
            images={props.images}
            attributes={props.attributes ?? []}
            isOwner={detailProps.isOwner}
            onEdit={detailProps.onEdit}
            onDelete={detailProps.onDelete}
            onTogglePrivacy={detailProps.onTogglePrivacy}
            onToggleRelated={detailProps.onToggleRelated}
            showRelated={detailProps.showRelated}
            theme={detailProps.theme}
          />
        )
      }}
      EditModalComponent={(editProps) => (
        <EditLocationModal
          isOpen={editProps.isOpen}
          formData={editProps.formData as LocationFormData}
          onChange={
            editProps.onChange as (
              field: keyof LocationFormData,
              value: string | EntityImage[] | LocationAttribute[],
            ) => void
          }
          onSave={editProps.onSave}
          onCancel={editProps.onCancel}
          theme={editProps.theme}
          isSaving={editProps.isSaving}
          locationId={props.location.id}
          userId={props.userId}
        />
      )}
      firstPanelType="story"
    />
  )
}
