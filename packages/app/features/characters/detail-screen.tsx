'use client'

import type { GetCharacterRow, CharacterAttribute } from '@repo/database'
import { EntityDetailScreen } from '../shared/EntityDetailScreen'
import { CharacterDetail } from './components/CharacterDetail'
import { EditCharacterModal } from './components/EditCharacterModal'
import { useCharacterEdit } from './hooks/useCharacterEdit'
import type { RelatedEntityItem } from '../shared/EntityDetailScreen.types'
import type { EntityImage } from '../../types/entity-image'

interface RelatedEntities {
  stories: RelatedEntityItem[]
  locations: RelatedEntityItem[]
  timelines: RelatedEntityItem[]
  characters?: RelatedEntityItem[]
}

interface CharacterDetailScreenProps {
  character: GetCharacterRow
  relatedEntities: RelatedEntities
  images: EntityImage[]
  attributes?: CharacterAttribute[]
  isOwner: boolean
  isEditMode: boolean
  userId: string
  onUpdate?: (args: {
    id: number
    name: string
    description: string | null
  }) => Promise<GetCharacterRow | null>
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
    characterId: number
    entityType: 'story' | 'character' | 'location' | 'timeline'
    entityIds: number[]
    relationshipType?: string
    customLabel?: string | null
  }) => Promise<{ success: boolean; error?: string }>
  onUnlinkEntity?: (args: {
    characterId: number
    entityType: 'story' | 'character' | 'location' | 'timeline'
    entityId: number
  }) => Promise<{ success: boolean; error?: string }>
  onCreateAndLinkEntity?: (args: {
    characterId: number
    entityType: 'story' | 'character' | 'location' | 'timeline'
    data: { name: string; description: string }
  }) => Promise<{ success: boolean; error?: string; entityId?: number }>
}

export function CharacterDetailScreen(props: CharacterDetailScreenProps) {
  // Create a wrapper for useCharacterEdit that injects images
  const useCharacterEditWithImages = (config: Record<string, unknown>) => {
    return useCharacterEdit({
      ...config,
      images: props.images,
      attributes: props.attributes ?? [],
    } as never)
  }

  return (
    <EntityDetailScreen
      entityType="character"
      entity={props.character}
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
        useCharacterEditWithImages as unknown as (
          config: Record<string, unknown>,
        ) => {
          formData: {
            name: string
            description: string
            images: EntityImage[]
            attributes: CharacterAttribute[]
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
              attributes: CharacterAttribute[]
            },
            value: string | EntityImage[] | CharacterAttribute[],
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
      entityLabel="Character"
      entityLabelPlural="Characters"
      DetailComponent={(detailProps) => {
        const character = detailProps.entity || detailProps.character
        const slug = character.slug ?? character.id
        const relationshipMapHref = `/${props.userId}/characters/${slug}/relationships`
        return (
          <CharacterDetail
            character={{
              ...character,
              privacy: character.privacy as 'public' | 'private',
            }}
            userId={props.userId}
            images={props.images}
            attributes={props.attributes ?? []}
            relationshipMapHref={relationshipMapHref}
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
        <EditCharacterModal
          isOpen={editProps.isOpen}
          formData={editProps.formData}
          onChange={editProps.onChange}
          onSave={editProps.onSave}
          onCancel={editProps.onCancel}
          theme={editProps.theme}
          isSaving={editProps.isSaving}
          characterId={props.character.id}
          userId={props.userId}
        />
      )}
      firstPanelType="story"
    />
  )
}
