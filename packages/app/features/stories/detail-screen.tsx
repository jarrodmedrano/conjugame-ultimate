'use client'

import type { GetStoryRow, StoryAttribute } from '@repo/database'
import { EntityDetailScreen } from '../shared/EntityDetailScreen'
import { StoryDetail } from './components/StoryDetail'
import { EditStoryModal } from './components/EditStoryModal'
import { useStoryEdit, type StoryFormData } from './hooks/useStoryEdit'
import type { RelatedEntityItem } from '../shared/EntityDetailScreen.types'
import type { EntityImage } from '../../types/entity-image'

interface RelatedEntities {
  characters: RelatedEntityItem[]
  locations: RelatedEntityItem[]
  timelines: RelatedEntityItem[]
}

interface StoryDetailScreenProps {
  story: GetStoryRow
  relatedEntities: RelatedEntities
  images: EntityImage[]
  attributes?: StoryAttribute[]
  isOwner: boolean
  isEditMode: boolean
  userId: string
  onUpdate?: (args: {
    id: number
    title: string
    content: string
  }) => Promise<GetStoryRow | null>
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
    storyId: number
    entityType: 'story' | 'character' | 'location' | 'timeline'
    entityIds: number[]
  }) => Promise<{ success: boolean; error?: string }>
  onUnlinkEntity?: (args: {
    storyId: number
    entityType: 'story' | 'character' | 'location' | 'timeline'
    entityId: number
  }) => Promise<{ success: boolean; error?: string }>
  onCreateAndLinkEntity?: (args: {
    storyId: number
    entityType: 'story' | 'character' | 'location' | 'timeline'
    data: { name: string; description: string }
  }) => Promise<{ success: boolean; error?: string; entityId?: number }>
}

export function StoryDetailScreen(props: StoryDetailScreenProps) {
  // Create a wrapper for useStoryEdit that injects images and attributes
  const useStoryEditWithImages = (config: Record<string, unknown>) => {
    return useStoryEdit({
      ...config,
      images: props.images,
      attributes: props.attributes ?? [],
    } as never)
  }

  return (
    <EntityDetailScreen
      entityType="story"
      entity={props.story}
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
        useStoryEditWithImages as unknown as (
          config: Record<string, unknown>,
        ) => {
          formData: {
            name: string
            description: string
            content: string
            images: EntityImage[]
            attributes: StoryAttribute[]
          }
          isEditing: boolean
          isDirty: boolean
          startEditing: () => void
          cancelEditing: () => void
          updateField: (
            field: keyof {
              name: string
              description: string
              content: string
              images: EntityImage[]
              attributes: StoryAttribute[]
            },
            value: string | EntityImage[] | StoryAttribute[],
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
          title: formData.name,
          content: formData.content,
        })

        if (!result) {
          throw new Error('Update failed')
        }
      }}
      getEntityId={(entity) => entity.id}
      entityLabel="Story"
      entityLabelPlural="Stories"
      DetailComponent={(detailProps) => {
        const story = detailProps.entity || detailProps.story
        return (
          <StoryDetail
            story={{
              id: story.id,
              title: story.title,
              content: story.content,
              privacy: story.privacy as 'public' | 'private',
              userid: story.userid,
              created_at: story.createdAt,
              updated_at: story.updatedAt,
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
        <EditStoryModal
          isOpen={editProps.isOpen}
          formData={editProps.formData as StoryFormData}
          onChange={
            editProps.onChange as (
              field: keyof StoryFormData,
              value: string | EntityImage[] | StoryAttribute[],
            ) => void
          }
          onSave={editProps.onSave}
          onCancel={editProps.onCancel}
          theme={editProps.theme}
          isSaving={editProps.isSaving}
          storyId={props.story.id}
          userId={props.userId}
        />
      )}
    />
  )
}
