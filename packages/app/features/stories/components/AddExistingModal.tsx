'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog'
import { Button } from '@repo/ui/components/ui/button'
import { Checkbox } from '@repo/ui/components/ui/checkbox'
import {
  ModalContent,
  SearchInput,
  EntityList,
  EntityItem,
  EntityCheckbox,
  EntityInfo,
  EntityName,
  EntityDescription,
  LinkedBadge,
  NoResults,
  ModalActions,
  RelationshipSection,
  RelationshipLabel,
  RelationshipSelect,
  CustomLabelInput,
} from './AddExistingModal.styles'
import type { RelatedEntityItem } from '../../shared/EntityDetailScreen.types'
import { PREDEFINED_RELATIONSHIP_OPTIONS } from '../../characters/utils/relationshipInverse'

export interface AddExistingModalProps {
  isOpen: boolean
  entityType: 'character' | 'location' | 'timeline'
  availableEntities: RelatedEntityItem[]
  linkedEntityIds: number[]
  onClose: () => void
  onAdd: (
    selectedIds: number[],
    relationshipType?: string,
    customLabel?: string | null,
  ) => void
  showRelationshipSelector?: boolean
}

export function AddExistingModal({
  isOpen,
  entityType,
  availableEntities,
  linkedEntityIds,
  onClose,
  onAdd,
  showRelationshipSelector = false,
}: AddExistingModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [relationshipType, setRelationshipType] = useState('custom')
  const [customLabel, setCustomLabel] = useState('')

  // Reset selection when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set())
      setSearchQuery('')
      setRelationshipType('custom')
      setCustomLabel('')
    }
  }, [isOpen])

  const entityTypePlural = useMemo(() => {
    const pluralMap: Record<string, string> = {
      character: 'Characters',
      location: 'Locations',
      timeline: 'Timelines',
    }
    return pluralMap[entityType]
  }, [entityType])

  const linkedIdsSet = useMemo(
    () => new Set(linkedEntityIds),
    [linkedEntityIds],
  )

  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableEntities
    }

    const lowerQuery = searchQuery.toLowerCase()
    return availableEntities.filter(
      (entity) => entity?.name?.toLowerCase().includes(lowerQuery),
    )
  }, [availableEntities, searchQuery])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
    },
    [],
  )

  const handleCheckboxChange = useCallback((entityId: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(entityId)) {
        newSet.delete(entityId)
      } else {
        newSet.add(entityId)
      }
      return newSet
    })
  }, [])

  const createCheckboxHandler = useCallback(
    (entityId: number) => () => handleCheckboxChange(entityId),
    [handleCheckboxChange],
  )

  const handleRelationshipTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setRelationshipType(e.target.value)
    },
    [],
  )

  const handleCustomLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomLabel(e.target.value)
    },
    [],
  )

  const handleAddSelected = useCallback(() => {
    const idsArray = Array.from(selectedIds)
    if (showRelationshipSelector) {
      onAdd(idsArray, relationshipType, customLabel || null)
    } else {
      onAdd(idsArray)
    }
    onClose()
  }, [
    selectedIds,
    onAdd,
    onClose,
    showRelationshipSelector,
    relationshipType,
    customLabel,
  ])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose()
      }
    },
    [onClose],
  )

  const selectedCount = selectedIds.size
  const buttonText =
    selectedCount > 0 ? `Add Selected (${selectedCount})` : 'Add Selected'

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-label={`Add Existing ${entityTypePlural}`}
        data-testid="add-existing-modal"
      >
        <DialogHeader>
          <DialogTitle>Add Existing {entityTypePlural}</DialogTitle>
          <DialogDescription>
            Select entities to link to your story. Already linked entities are
            disabled.
          </DialogDescription>
        </DialogHeader>

        <ModalContent>
          <SearchInput
            type="text"
            placeholder={`Search ${entityTypePlural?.toLowerCase()}...`}
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label={`Search ${entityTypePlural?.toLowerCase()}`}
          />

          {filteredEntities.length === 0 ? (
            <NoResults>No results found</NoResults>
          ) : (
            <EntityList data-testid="entity-list">
              {filteredEntities.map((entity) => {
                const isLinked = linkedIdsSet.has(entity.id)
                const isSelected = selectedIds.has(entity.id)

                return (
                  <EntityItem
                    key={entity.id}
                    $isDisabled={isLinked}
                    htmlFor={`entity-${entity.id}`}
                  >
                    <EntityCheckbox>
                      <Checkbox
                        id={`entity-${entity.id}`}
                        checked={isSelected}
                        disabled={isLinked}
                        onCheckedChange={createCheckboxHandler(entity.id)}
                        data-testid={`entity-checkbox-${entity.id}`}
                      />
                    </EntityCheckbox>

                    <EntityInfo>
                      <EntityName>{entity.name}</EntityName>
                      {entity.description && (
                        <EntityDescription>
                          {entity.description}
                        </EntityDescription>
                      )}
                      {isLinked && <LinkedBadge>Already linked</LinkedBadge>}
                    </EntityInfo>
                  </EntityItem>
                )
              })}
            </EntityList>
          )}

          {showRelationshipSelector && (
            <RelationshipSection>
              <RelationshipLabel htmlFor="relationship-type">
                Relationship Type
              </RelationshipLabel>
              <RelationshipSelect
                id="relationship-type"
                value={relationshipType}
                onChange={handleRelationshipTypeChange}
                aria-label="Select relationship type"
              >
                {PREDEFINED_RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </RelationshipSelect>
              {relationshipType === 'custom' && (
                <>
                  <RelationshipLabel htmlFor="custom-label">
                    Custom Label
                  </RelationshipLabel>
                  <CustomLabelInput
                    id="custom-label"
                    type="text"
                    placeholder="e.g., Rival, Mentor, Ally..."
                    value={customLabel}
                    onChange={handleCustomLabelChange}
                    maxLength={100}
                    aria-label="Custom relationship label"
                  />
                </>
              )}
            </RelationshipSection>
          )}
        </ModalContent>

        <ModalActions>
          <Button
            variant="outline"
            onClick={onClose}
            aria-label="Cancel adding entities"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleAddSelected}
            disabled={selectedCount === 0}
            aria-label={buttonText}
          >
            {buttonText}
          </Button>
        </ModalActions>
      </DialogContent>
    </Dialog>
  )
}
