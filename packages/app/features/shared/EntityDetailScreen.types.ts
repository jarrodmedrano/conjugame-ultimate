import type { ReactElement } from 'react'

export type EntityType = 'story' | 'character' | 'location' | 'timeline'

// Base entity interface - common fields across all entities
export interface BaseEntity {
  id: number
  userid: string
  privacy: string
  createdAt: Date
  updatedAt: Date
}

// Specific entity types
export interface StoryEntity extends BaseEntity {
  title: string
  content: string
}

export interface CharacterEntity extends BaseEntity {
  name: string
  description: string | null
}

export interface LocationEntity extends BaseEntity {
  name: string
  description: string | null
}

export interface TimelineEntity extends BaseEntity {
  name: string
  description: string | null
}

// Related entity item (simplified for grid display)
// name is required - stories map title->name, others have name directly
export interface RelatedEntityItem {
  id: number
  name: string
  title?: string
  description?: string | null
  primaryImageUrl?: string | null
  // Character relationship fields
  relationshipId?: number
  relationshipLabel?: string
  isFamily?: boolean
}

// Related entities by type
export interface RelatedEntities {
  stories?: RelatedEntityItem[]
  characters?: RelatedEntityItem[]
  locations?: RelatedEntityItem[]
  timelines?: RelatedEntityItem[]
}

// Update arguments for different entity types
export interface StoryUpdateArgs {
  id: number
  title: string
  content: string
}

export interface CharacterUpdateArgs {
  id: number
  name: string
  description: string | null
}

export interface LocationUpdateArgs {
  id: number
  name: string
  description: string | null
}

export interface TimelineUpdateArgs {
  id: number
  name: string
  description: string | null
}

export type EntityUpdateArgs =
  | StoryUpdateArgs
  | CharacterUpdateArgs
  | LocationUpdateArgs
  | TimelineUpdateArgs

// Entity link/unlink arguments
// These interfaces allow for dynamic keys like storyId, characterId, etc.
export interface LinkEntityArgs {
  [key: string]: unknown
  entityType: EntityType
  entityIds: number[]
}

export interface UnlinkEntityArgs {
  [key: string]: unknown
  entityType: EntityType
  entityId: number
}

export interface CreateAndLinkEntityArgs {
  [key: string]: unknown
  entityType: EntityType
  data: { name: string; description: string }
}

// Get user entities result
export interface GetUserEntitiesResult {
  success: boolean
  error?: string
  entities?: RelatedEntityItem[]
}

// Entity edit hook config and return type
export interface EntityEditConfig<TEntity, TFormData> {
  [key: string]: unknown
  onSave: (formData: TFormData) => Promise<void>
  onCancel: () => void
}

export interface EntityEditReturn<TFormData> {
  formData: TFormData
  isEditing: boolean
  isDirty: boolean
  startEditing: () => void
  cancelEditing: () => void
  updateField: <K extends keyof TFormData>(
    field: K,
    value: TFormData[K],
  ) => void
  saveChanges: () => void
}

// Detail component props
export interface DetailComponentProps<TEntity> {
  entity: TEntity
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
  onTogglePrivacy: () => void
  onToggleRelated: () => void
  showRelated: boolean
  theme?: string
  [key: string]: unknown // Allow entity-specific props
}

// Edit modal component props
export interface EditModalComponentProps<TFormData> {
  isOpen: boolean
  formData: TFormData
  onChange: <K extends keyof TFormData>(field: K, value: TFormData[K]) => void
  onSave: () => void
  onCancel: () => void
  theme?: string
  isSaving: boolean
}

// Main config interface with flexible callback types
export interface EntityDetailScreenConfig<
  TEntity,
  TFormData,
  TUpdateArgs = EntityUpdateArgs,
  TLinkArgs extends {
    entityType: EntityType
    entityIds: number[]
  } = LinkEntityArgs,
  TUnlinkArgs extends {
    entityType: EntityType
    entityId: number
  } = UnlinkEntityArgs,
  TCreateLinkArgs extends {
    entityType: EntityType
    data: { name: string; description: string }
  } = CreateAndLinkEntityArgs,
  THookConfig extends Record<string, unknown> = Record<string, unknown>,
> {
  // Entity details
  entityType: EntityType
  entity: TEntity
  relatedEntities: RelatedEntities
  isOwner: boolean
  isEditMode: boolean
  userId: string

  // Callbacks
  onUpdate?: (args: TUpdateArgs) => Promise<TEntity | null>
  onDelete?: (args: { id: number }) => Promise<void>
  onTogglePrivacy?: (args: { id: number; privacy: string }) => Promise<void>
  onGetUserEntities?: (args: {
    entityType: EntityType
  }) => Promise<GetUserEntitiesResult>
  onLinkEntity?: (args: TLinkArgs) => Promise<{
    success: boolean
    error?: string
  }>
  onUnlinkEntity?: (args: TUnlinkArgs) => Promise<{
    success: boolean
    error?: string
  }>
  onCreateAndLinkEntity?: (args: TCreateLinkArgs) => Promise<{
    success: boolean
    error?: string
    entityId?: number
  }>

  // Custom hook for editing - fully generic to accept different hook signatures
  useEntityEdit: (
    config: Record<string, unknown>,
  ) => EntityEditReturn<TFormData>

  // Custom save handler
  handleSave: (args: {
    entity: TEntity
    formData: TFormData
    onUpdate?: (args: TUpdateArgs) => Promise<TEntity | null>
  }) => Promise<void>

  // Entity ID getter
  getEntityId: (entity: TEntity) => number

  // Labels
  entityLabel: string
  entityLabelPlural: string

  // Components
  DetailComponent: (props: DetailComponentProps<TEntity>) => ReactElement
  EditModalComponent: (
    props: EditModalComponentProps<TFormData>,
  ) => ReactElement

  // Related entities grid configuration
  firstPanelType?: EntityType
}
