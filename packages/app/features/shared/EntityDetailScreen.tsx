'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { toast } from '@repo/ui/components/ui/use-toast'
import { UnsavedChangesModal } from '../stories/components/UnsavedChangesModal'
import { RelatedEntitiesGrid } from '../stories/components/RelatedEntitiesGrid'
import { AddExistingModal } from '../stories/components/AddExistingModal'
import { CreateNewModal } from '../stories/components/CreateNewModal'
import { useUnsavedChanges } from '../stories/hooks/useUnsavedChanges'
import type {
  EntityType,
  EntityDetailScreenConfig,
  RelatedEntityItem,
  LinkEntityArgs,
  UnlinkEntityArgs,
  CreateAndLinkEntityArgs,
} from './EntityDetailScreen.types'

export function EntityDetailScreen<
  TEntity,
  TFormData,
  TUpdateArgs = unknown,
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
>({
  entityType,
  entity,
  relatedEntities,
  isOwner,
  isEditMode,
  userId,
  onUpdate,
  onDelete,
  onTogglePrivacy,
  onGetUserEntities,
  onLinkEntity,
  onUnlinkEntity,
  onCreateAndLinkEntity,
  useEntityEdit,
  handleSave: customHandleSave,
  getEntityId,
  entityLabel,
  entityLabelPlural,
  DetailComponent,
  EditModalComponent,
  firstPanelType,
}: EntityDetailScreenConfig<
  TEntity,
  TFormData,
  TUpdateArgs,
  TLinkArgs,
  TUnlinkArgs,
  TCreateLinkArgs,
  THookConfig
>) {
  const router = useRouter()
  const { resolvedTheme: theme } = useTheme()
  const [showRelated, setShowRelated] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showAddExisting, setShowAddExisting] = useState(false)
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [activeEntityType, setActiveEntityType] = useState<EntityType | null>(
    null,
  )
  const [availableEntities, setAvailableEntities] = useState<
    RelatedEntityItem[]
  >([])
  const [isLoadingEntities, setIsLoadingEntities] = useState(false)

  // Whether same-type linking is allowed (only character-to-character)
  const isSameTypeLinkAllowed = entityType === 'character'

  const handleSaveEntity = useCallback(
    async (formData: TFormData) => {
      if (!onUpdate) {
        toast({
          title: 'Error',
          description: 'Update function not available',
          variant: 'destructive',
        })
        return
      }

      setIsSaving(true)
      try {
        await customHandleSave({ entity, formData, onUpdate })

        toast({
          title: 'Success',
          description: `${entityLabel} updated successfully`,
        })
        router.refresh()
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error
              ? error.message
              : `Failed to save ${entityLabel.toLowerCase()} changes`,
          variant: 'destructive',
        })
      } finally {
        setIsSaving(false)
      }
    },
    [entity, router, onUpdate, customHandleSave, entityLabel],
  )

  const handleCancelEdit = useCallback(() => {
    setShowRelated(true)
  }, [])

  const {
    formData,
    isEditing,
    isDirty,
    startEditing,
    cancelEditing,
    updateField,
    saveChanges,
  } = useEntityEdit({
    [entityType]: entity,
    onSave: handleSaveEntity,
    onCancel: handleCancelEdit,
  } as unknown as THookConfig)

  const { showModal, confirmNavigation, cancelNavigation } = useUnsavedChanges({
    isDirty,
  })

  const handleEdit = useCallback(() => {
    startEditing()
    setShowRelated(false)
  }, [startEditing])

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelModal(true)
      return
    }
    cancelEditing()
  }, [isDirty, cancelEditing])

  const handleCancelModalDiscard = useCallback(() => {
    setShowCancelModal(false)
    cancelEditing()
  }, [cancelEditing])

  const handleCancelModalStay = useCallback(() => {
    setShowCancelModal(false)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!onDelete) return

    try {
      await onDelete({ id: getEntityId(entity) })
      toast({
        title: 'Success',
        description: `${entityLabel} deleted successfully`,
      })
      router.push(`/${userId}/${entityLabelPlural.toLowerCase()}`)
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : `Failed to delete ${entityLabel.toLowerCase()}`,
        variant: 'destructive',
      })
    }
  }, [
    onDelete,
    entity,
    getEntityId,
    entityLabel,
    entityLabelPlural,
    router,
    userId,
  ])

  const handleTogglePrivacy = useCallback(async () => {
    if (!onTogglePrivacy) return

    const currentPrivacy = (entity as { privacy: string }).privacy
    const newPrivacy = currentPrivacy === 'public' ? 'private' : 'public'

    try {
      await onTogglePrivacy({ id: getEntityId(entity), privacy: newPrivacy })
      toast({
        title: 'Success',
        description: `${entityLabel} is now ${newPrivacy}`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : `Failed to update ${entityLabel.toLowerCase()} privacy`,
        variant: 'destructive',
      })
    }
  }, [onTogglePrivacy, entity, getEntityId, entityLabel, router])

  const handleToggleRelated = useCallback(() => {
    setShowRelated((prev) => !prev)
  }, [])

  const handleModalDiscard = useCallback(() => {
    cancelEditing()
    confirmNavigation()
  }, [cancelEditing, confirmNavigation])

  const handleModalSave = useCallback(() => {
    saveChanges()
    confirmNavigation()
  }, [saveChanges, confirmNavigation])

  const handleModalStay = useCallback(() => {
    cancelNavigation()
  }, [cancelNavigation])

  const handleAddExisting = useCallback(
    async (targetEntityType: EntityType) => {
      // Block same-type linking unless character-to-character is allowed
      if (targetEntityType === entityType && !isSameTypeLinkAllowed) return

      if (!onGetUserEntities) {
        toast({
          title: 'Error',
          description: 'Get entities function not available',
          variant: 'destructive',
        })
        return
      }

      setActiveEntityType(targetEntityType)
      setIsLoadingEntities(true)

      try {
        const result = await onGetUserEntities({
          entityType: targetEntityType,
        })

        if (result.success && result.entities) {
          setAvailableEntities(result.entities)
          setShowAddExisting(true)
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to load entities',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'Failed to load entities',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingEntities(false)
      }
    },
    [entityType, isSameTypeLinkAllowed, onGetUserEntities],
  )

  const handleCreateNew = useCallback(
    (targetEntityType: EntityType) => {
      // Block same-type creation unless character-to-character is allowed
      if (targetEntityType === entityType && !isSameTypeLinkAllowed) return

      setActiveEntityType(targetEntityType)
      setShowCreateNew(true)
    },
    [entityType, isSameTypeLinkAllowed],
  )

  const handleAddExistingClose = useCallback(() => {
    setShowAddExisting(false)
    setActiveEntityType(null)
    setAvailableEntities([])
  }, [])

  const handleCreateNewClose = useCallback(() => {
    setShowCreateNew(false)
    setActiveEntityType(null)
  }, [])

  const handleAddSelectedEntities = useCallback(
    async (
      selectedIds: number[],
      relationshipType?: string,
      customLabel?: string | null,
    ) => {
      const isSameLinkBlocked =
        activeEntityType === entityType && !isSameTypeLinkAllowed
      if (!activeEntityType || isSameLinkBlocked) {
        return
      }

      if (!onLinkEntity) {
        toast({
          title: 'Error',
          description: 'Link entity function not available',
          variant: 'destructive',
        })
        return
      }

      try {
        const linkArgs: Record<string, unknown> = {
          [`${entityType}Id`]: getEntityId(entity),
          entityType: activeEntityType,
          entityIds: selectedIds,
        }

        if (relationshipType !== undefined) {
          linkArgs.relationshipType = relationshipType
        }
        if (customLabel !== undefined) {
          linkArgs.customLabel = customLabel
        }

        const result = await onLinkEntity(linkArgs as unknown as TLinkArgs)

        if (result.success) {
          toast({
            title: 'Success',
            description: `${selectedIds.length} ${activeEntityType}(s) linked successfully`,
          })
          router.refresh()
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to link entities',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'Failed to link entities',
          variant: 'destructive',
        })
      }
    },
    [
      activeEntityType,
      entityType,
      isSameTypeLinkAllowed,
      entity,
      getEntityId,
      router,
      onLinkEntity,
    ],
  )

  const handleCreateEntity = useCallback(
    async (data: { name: string; description: string }) => {
      const isSameLinkBlocked =
        activeEntityType === entityType && !isSameTypeLinkAllowed
      if (!activeEntityType || isSameLinkBlocked) {
        return
      }

      if (!onCreateAndLinkEntity) {
        toast({
          title: 'Error',
          description: 'Create entity function not available',
          variant: 'destructive',
        })
        return
      }

      try {
        const createArgs = {
          [`${entityType}Id`]: getEntityId(entity),
          entityType: activeEntityType,
          data,
        }

        const result = await onCreateAndLinkEntity(
          createArgs as unknown as TCreateLinkArgs,
        )

        if (result.success) {
          toast({
            title: 'Success',
            description: `${activeEntityType} created and linked successfully`,
          })
          router.refresh()
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to create entity',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'Failed to create entity',
          variant: 'destructive',
        })
      }
    },
    [
      activeEntityType,
      entityType,
      isSameTypeLinkAllowed,
      entity,
      getEntityId,
      router,
      onCreateAndLinkEntity,
    ],
  )

  const handleUnlinkEntity = useCallback(
    async (targetEntityType: EntityType, targetEntityId: number) => {
      // Block same-type unlinking unless character-to-character is allowed
      if (targetEntityType === entityType && !isSameTypeLinkAllowed) return

      if (!onUnlinkEntity) {
        toast({
          title: 'Error',
          description: 'Unlink entity function not available',
          variant: 'destructive',
        })
        return
      }

      try {
        const unlinkArgs = {
          [`${entityType}Id`]: getEntityId(entity),
          entityType: targetEntityType,
          entityId: targetEntityId,
        }

        const result = await onUnlinkEntity(
          unlinkArgs as unknown as TUnlinkArgs,
        )

        if (result.success) {
          toast({
            title: 'Success',
            description: `${targetEntityType} unlinked successfully`,
          })
          router.refresh()
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to unlink entity',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'Failed to unlink entity',
          variant: 'destructive',
        })
      }
    },
    [
      entityType,
      isSameTypeLinkAllowed,
      entity,
      getEntityId,
      router,
      onUnlinkEntity,
    ],
  )

  // Build entity-specific props for DetailComponent
  const detailProps = {
    entity,
    [entityType]: entity,
    isOwner,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onTogglePrivacy: handleTogglePrivacy,
    onToggleRelated: handleToggleRelated,
    showRelated,
    theme,
  }

  // Get linked entity IDs for the active type
  const getLinkedEntityIds = () => {
    if (!activeEntityType) return []

    const entityMap: Record<EntityType, RelatedEntityItem[]> = {
      story: relatedEntities.stories || [],
      character: relatedEntities.characters || [],
      location: relatedEntities.locations || [],
      timeline: relatedEntities.timelines || [],
    }

    return entityMap[activeEntityType].map((e) => e.id)
  }

  // Whether the currently active modal is for character-to-character linking
  const isCharacterToCharacter =
    entityType === 'character' && activeEntityType === 'character'

  // Whether the modal/creation should be shown (allow same-type for character)
  const shouldShowModals =
    activeEntityType !== null &&
    (activeEntityType !== entityType || isSameTypeLinkAllowed)

  return (
    <div>
      <DetailComponent {...detailProps} />

      {showRelated && (
        <div className="mt-6">
          <RelatedEntitiesGrid
            characters={
              entityType === 'story'
                ? relatedEntities.characters || []
                : relatedEntities.stories || []
            }
            locations={
              entityType === 'location'
                ? relatedEntities.characters || []
                : relatedEntities.locations || []
            }
            timelines={
              entityType === 'timeline'
                ? relatedEntities.locations || []
                : relatedEntities.timelines || []
            }
            relatedCharacters={
              entityType === 'character'
                ? relatedEntities.characters || []
                : undefined
            }
            isOwner={isOwner}
            userId={userId}
            theme={theme}
            onAddExisting={handleAddExisting}
            onCreateNew={handleCreateNew}
            onUnlink={handleUnlinkEntity}
            firstPanelType={entityType === 'story' ? 'character' : 'story'}
            secondPanelEntityType={
              entityType === 'location' ? 'character' : 'location'
            }
            secondPanelLabel={
              entityType === 'location' ? 'Characters' : 'Locations'
            }
          />
        </div>
      )}

      <EditModalComponent
        isOpen={isEditing}
        formData={formData}
        onChange={updateField}
        onSave={saveChanges}
        onCancel={handleCancel}
        theme={theme}
        isSaving={isSaving}
      />

      <UnsavedChangesModal
        isOpen={showModal}
        onSave={isSaving ? undefined : handleModalSave}
        onDiscard={handleModalDiscard}
        onStay={handleModalStay}
      />

      <UnsavedChangesModal
        isOpen={showCancelModal}
        onDiscard={handleCancelModalDiscard}
        onStay={handleCancelModalStay}
      />

      {shouldShowModals && (
        <>
          <AddExistingModal
            isOpen={showAddExisting}
            entityType={
              activeEntityType as 'character' | 'location' | 'timeline'
            }
            availableEntities={availableEntities}
            linkedEntityIds={getLinkedEntityIds()}
            onClose={handleAddExistingClose}
            onAdd={handleAddSelectedEntities}
            showRelationshipSelector={isCharacterToCharacter}
          />

          <CreateNewModal
            isOpen={showCreateNew}
            entityType={
              activeEntityType as 'character' | 'location' | 'timeline'
            }
            userId={userId}
            onClose={handleCreateNewClose}
            onCreate={handleCreateEntity}
          />
        </>
      )}
    </div>
  )
}
