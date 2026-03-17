'use client'

import type { GetTimelineRow } from '@repo/database'
import { EntityDetailScreen } from '../shared/EntityDetailScreen'
import { TimelineDetail } from './components/TimelineDetail'
import { EditTimelineModal } from './components/EditTimelineModal'
import { useTimelineEdit } from './hooks/useTimelineEdit'
import type { RelatedEntityItem } from '../shared/EntityDetailScreen.types'
import type { EntityImage } from '../../types/entity-image'
import type { TimelineEvent } from './components/TimelineEventsDisplay'

interface RelatedEntities {
  stories: RelatedEntityItem[]
  characters: RelatedEntityItem[]
  locations: RelatedEntityItem[]
}

interface TimelineDetailScreenProps {
  timeline: GetTimelineRow
  relatedEntities: RelatedEntities
  images: EntityImage[]
  isOwner: boolean
  isEditMode: boolean
  userId: string
  onUpdate?: (args: {
    id: number
    name: string
    description: string | null
  }) => Promise<GetTimelineRow | null>
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
    timelineId: number
    entityType: 'story' | 'character' | 'location' | 'timeline'
    entityIds: number[]
  }) => Promise<{ success: boolean; error?: string }>
  onUnlinkEntity?: (args: {
    timelineId: number
    entityType: 'story' | 'character' | 'location' | 'timeline'
    entityId: number
  }) => Promise<{ success: boolean; error?: string }>
  onCreateAndLinkEntity?: (args: {
    timelineId: number
    entityType: 'story' | 'character' | 'location' | 'timeline'
    data: { name: string; description: string }
  }) => Promise<{ success: boolean; error?: string; entityId?: number }>
  events?: TimelineEvent[]
  onCreateEvent?: (args: {
    timelineId: number
    eventDate: string
    title: string
    description?: string | null
  }) => Promise<{ success: boolean; error?: string }>
  onUpdateEvent?: (args: {
    id: number
    eventDate: string
    title: string
    description: string | null
    orderIndex: number
  }) => Promise<{ success: boolean; error?: string }>
  onDeleteEvent?: (args: {
    id: number
  }) => Promise<{ success: boolean; error?: string }>
}

export function TimelineDetailScreen(props: TimelineDetailScreenProps) {
  // Create a wrapper for useTimelineEdit that injects images
  const useTimelineEditWithImages = (config: Record<string, unknown>) => {
    return useTimelineEdit({
      ...config,
      images: props.images,
    } as never)
  }

  return (
    <EntityDetailScreen
      entityType="timeline"
      entity={props.timeline}
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
        useTimelineEditWithImages as unknown as (
          config: Record<string, unknown>,
        ) => {
          formData: {
            name: string
            description: string
            images: EntityImage[]
          }
          isEditing: boolean
          isDirty: boolean
          startEditing: () => void
          cancelEditing: () => void
          updateField: <
            K extends keyof {
              name: string
              description: string
              images: EntityImage[]
            },
          >(
            field: K,
            value: {
              name: string
              description: string
              images: EntityImage[]
            }[K],
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
      entityLabel="Timeline"
      entityLabelPlural="Timelines"
      DetailComponent={(detailProps) => {
        const timeline = detailProps.entity || detailProps.timeline
        return (
          <TimelineDetail
            timeline={{
              ...timeline,
              privacy: timeline.privacy as 'public' | 'private',
            }}
            userId={props.userId}
            images={props.images}
            isOwner={detailProps.isOwner}
            events={props.events}
            onEdit={detailProps.onEdit}
            onDelete={detailProps.onDelete}
            onTogglePrivacy={detailProps.onTogglePrivacy}
            onToggleRelated={detailProps.onToggleRelated}
            showRelated={detailProps.showRelated}
            theme={detailProps.theme}
            onCreateEvent={
              props.onCreateEvent
                ? (data) =>
                    props.onCreateEvent!({
                      timelineId: timeline.id,
                      ...data,
                    })
                : undefined
            }
            onUpdateEvent={props.onUpdateEvent}
            onDeleteEvent={
              props.onDeleteEvent
                ? (id) => props.onDeleteEvent!({ id })
                : undefined
            }
          />
        )
      }}
      EditModalComponent={(editProps) => (
        <EditTimelineModal
          isOpen={editProps.isOpen}
          formData={editProps.formData}
          onChange={editProps.onChange}
          onSave={editProps.onSave}
          onCancel={editProps.onCancel}
          theme={editProps.theme}
          isSaving={editProps.isSaving}
          timelineId={props.timeline.id}
          userId={props.userId}
        />
      )}
      firstPanelType="story"
    />
  )
}
