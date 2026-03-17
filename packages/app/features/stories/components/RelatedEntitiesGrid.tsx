/**
 * RelatedEntitiesGrid Component
 *
 * Displays related entities (characters, locations, timelines) in a 2x2 resizable panel grid.
 * Each panel shows entity cards that are clickable and link to their detail pages.
 * Props:
 * - characters: Array of character entities to display in top-left panel
 * - locations: Array of location entities to display in top-right panel
 * - timelines: Array of timeline entities to display in bottom-left panel
 * - relatedCharacters: Optional array of character-to-character relationships for 4th panel
 * - isOwner: Whether current user owns the story (controls action button visibility)
 * - userId: User ID for generating entity detail page URLs (REQUIRED for navigation links)
 * - theme: Optional theme ('light' | 'dark') for styling
 * - onAddExisting: Callback when "Add Existing" button clicked
 * - onCreateNew: Callback when "Create New" button clicked
 * - onUnlink: Callback when entity remove button clicked
 */
'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@repo/ui/components/ui/resizable'
import { Button } from '@repo/ui/components/ui/button'
import { Link2, Plus } from 'lucide-react'
import {
  GridWrapper,
  PanelContent,
  PanelHeader,
  PanelTitle,
  PanelActions,
  EntitiesContainer,
  EntityCard,
  EntityCardContent,
  EntityName,
  EntityDescription,
  RemoveButton,
  EmptyState,
  EmptyStateText,
  EmptyStateActions,
  EntityLink,
  RelationshipBadge,
} from './RelatedEntitiesGrid.styles'
import type { RelatedEntityItem } from '../../shared/EntityDetailScreen.types'
import styles from './ResizablePanel.module.css'

type Entity = RelatedEntityItem

// Extended entity type to support all entity types including story
type EntityType = 'character' | 'location' | 'timeline' | 'story'

interface RelatedEntitiesGridProps {
  characters: Entity[]
  locations: Entity[]
  timelines: Entity[]
  /** Related characters for the 4th panel (character-to-character relationships) */
  relatedCharacters?: Entity[]
  isOwner: boolean
  userId: string // Required to generate navigation URLs (/{userId}/characters/{id})
  theme?: string
  onAddExisting: (entityType: EntityType) => void
  onCreateNew: (entityType: EntityType) => void
  onUnlink: (entityType: EntityType, entityId: number) => void
  // Optional: customize the first panel (defaults to 'character')
  firstPanelType?: 'character' | 'story'
  // Optional: customize the second (top-right) panel label and entity type (defaults to 'location'/'Locations')
  secondPanelEntityType?: EntityType
  secondPanelLabel?: string
}

const STORAGE_KEY = 'related-entities-grid-layout'

function truncateDescription(description: string | undefined): string {
  if (!description) {
    return ''
  }
  if (description.length <= 100) {
    return description
  }
  return `${description.substring(0, 100)}...`
}

export function RelatedEntitiesGrid({
  characters,
  locations,
  timelines,
  relatedCharacters,
  isOwner,
  userId,
  theme,
  onAddExisting,
  onCreateNew,
  onUnlink,
  firstPanelType = 'character',
  secondPanelEntityType = 'location',
  secondPanelLabel = 'Locations',
}: RelatedEntitiesGridProps) {
  const [layout, setLayout] = useState<number[]>([25, 25, 25, 25])

  useEffect(() => {
    const savedLayout = localStorage.getItem(STORAGE_KEY)
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout)
        setLayout(parsed)
      } catch {
        // Use default layout if parsing fails
      }
    }
  }, [])

  const handleLayoutChange = useCallback((sizes: number[]) => {
    setLayout(sizes)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes))
  }, [])

  // First panel handlers - either character or story based on firstPanelType
  const handleAddExistingFirstPanel = useCallback(() => {
    onAddExisting(firstPanelType)
  }, [onAddExisting, firstPanelType])

  const handleCreateNewFirstPanel = useCallback(() => {
    onCreateNew(firstPanelType)
  }, [onCreateNew, firstPanelType])

  const handleAddExistingLocation = useCallback(() => {
    onAddExisting(secondPanelEntityType)
  }, [onAddExisting, secondPanelEntityType])

  const handleAddExistingTimeline = useCallback(() => {
    onAddExisting('timeline')
  }, [onAddExisting])

  const handleCreateNewLocation = useCallback(() => {
    onCreateNew(secondPanelEntityType)
  }, [onCreateNew, secondPanelEntityType])

  const handleCreateNewTimeline = useCallback(() => {
    onCreateNew('timeline')
  }, [onCreateNew])

  const handleAddExistingRelatedCharacter = useCallback(() => {
    onAddExisting('character')
  }, [onAddExisting])

  const handleCreateNewRelatedCharacter = useCallback(() => {
    onCreateNew('character')
  }, [onCreateNew])

  const createUnlinkHandler = useCallback(
    (entityType: EntityType, entityId: number) => {
      return (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onUnlink(entityType, entityId)
      }
    },
    [onUnlink],
  )

  const renderPanelHeader = useCallback(
    (
      title: string,
      entityType: EntityType,
      onAddExistingClick: () => void,
      onCreateNewClick: () => void,
    ) => {
      return (
        <PanelHeader $theme={theme}>
          <PanelTitle $theme={theme}>{title}</PanelTitle>
          {isOwner && (
            <PanelActions>
              <Button
                variant="outline"
                size="icon"
                onClick={onAddExistingClick}
                title="Add Existing"
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={onCreateNewClick}
                title="Create New"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </PanelActions>
          )}
        </PanelHeader>
      )
    },
    [theme, isOwner],
  )

  const renderEntityCard = useCallback(
    (entity: Entity, entityType: EntityType) => {
      // Handle URL path for different entity types
      let entityPath: string
      if (entityType === 'timeline') {
        entityPath = 'timelines'
      } else if (entityType === 'story') {
        entityPath = 'stories'
      } else {
        entityPath = `${entityType}s`
      }
      const href = `/${userId}/${entityPath}/${entity.id}`

      return (
        <EntityLink key={entity.id} href={href}>
          <EntityCard $theme={theme} data-testid="entity-card">
            {isOwner && (
              <RemoveButton
                $theme={theme}
                onClick={createUnlinkHandler(entityType, entity.id)}
                aria-label={`Remove ${entity.name}`}
              >
                ×
              </RemoveButton>
            )}
            {entity.primaryImageUrl && (
              <img
                src={entity.primaryImageUrl}
                alt={entity.name}
                className="h-16 w-16 rounded object-cover"
              />
            )}
            <EntityCardContent>
              <EntityName $theme={theme}>{entity.name}</EntityName>
              {entity.description && (
                <EntityDescription $theme={theme}>
                  {truncateDescription(entity.description)}
                </EntityDescription>
              )}
            </EntityCardContent>
          </EntityCard>
        </EntityLink>
      )
    },
    [userId, theme, isOwner, createUnlinkHandler],
  )

  // Special card renderer for character-to-character relationships
  // Uses relationshipId for unlink and shows relationship label badge
  const renderRelatedCharacterCard = useCallback(
    (entity: Entity) => {
      const href = `/${userId}/characters/${entity.id}`
      // Use relationshipId (junction table row ID) for unlinking
      const unlinkId = entity.relationshipId ?? entity.id

      return (
        <EntityLink key={entity.id} href={href}>
          <EntityCard $theme={theme} data-testid="entity-card">
            {isOwner && (
              <RemoveButton
                $theme={theme}
                onClick={createUnlinkHandler('character', unlinkId)}
                aria-label={`Remove ${entity.name}`}
              >
                ×
              </RemoveButton>
            )}
            {entity.primaryImageUrl && (
              <img
                src={entity.primaryImageUrl}
                alt={entity.name}
                className="h-16 w-16 rounded object-cover"
              />
            )}
            <EntityCardContent>
              <EntityName $theme={theme}>{entity.name}</EntityName>
              {entity.relationshipLabel && (
                <RelationshipBadge $isFamily={entity.isFamily}>
                  {entity.relationshipLabel}
                </RelationshipBadge>
              )}
            </EntityCardContent>
          </EntityCard>
        </EntityLink>
      )
    },
    [userId, theme, isOwner, createUnlinkHandler],
  )

  const renderEmptyState = useCallback(
    (
      entityType: EntityType,
      onAddExistingClick: () => void,
      onCreateNewClick: () => void,
    ) => {
      return (
        <EmptyState>
          <EmptyStateText $theme={theme}>
            No {entityType}s linked yet
          </EmptyStateText>
          {isOwner && (
            <EmptyStateActions>
              <Button
                variant="outline"
                size="icon"
                onClick={onAddExistingClick}
                title="Add Existing"
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={onCreateNewClick}
                title="Create New"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </EmptyStateActions>
          )}
        </EmptyState>
      )
    },
    [theme, isOwner],
  )

  const renderEntities = useCallback(
    (
      entities: Entity[],
      entityType: EntityType,
      onAddExistingClick: () => void,
      onCreateNewClick: () => void,
    ) => {
      if (entities.length === 0) {
        return renderEmptyState(
          entityType,
          onAddExistingClick,
          onCreateNewClick,
        )
      }

      return (
        <EntitiesContainer>
          {entities.map((entity) => renderEntityCard(entity, entityType))}
        </EntitiesContainer>
      )
    },
    [renderEmptyState, renderEntityCard],
  )

  const renderRelatedCharacterEntities = useCallback(
    (entities: Entity[]) => {
      if (entities.length === 0) {
        return renderEmptyState(
          'character',
          handleAddExistingRelatedCharacter,
          handleCreateNewRelatedCharacter,
        )
      }

      return (
        <EntitiesContainer>
          {entities.map((entity) => renderRelatedCharacterCard(entity))}
        </EntitiesContainer>
      )
    },
    [
      renderEmptyState,
      renderRelatedCharacterCard,
      handleAddExistingRelatedCharacter,
      handleCreateNewRelatedCharacter,
    ],
  )

  // Compute the first panel title based on type
  const firstPanelTitle = firstPanelType === 'story' ? 'Stories' : 'Characters'

  return (
    <GridWrapper data-testid="related-entities-grid">
      <ResizablePanelGroup direction="horizontal" onLayout={handleLayoutChange}>
        <ResizablePanel defaultSize={layout[0]} minSize={20}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel
              defaultSize={50}
              minSize={20}
              className={`p-5 ${styles.resizableOverflowAuto}`}
            >
              <PanelContent data-testid={`${firstPanelType}s-panel`}>
                {renderPanelHeader(
                  firstPanelTitle,
                  firstPanelType,
                  handleAddExistingFirstPanel,
                  handleCreateNewFirstPanel,
                )}
                {renderEntities(
                  characters,
                  firstPanelType,
                  handleAddExistingFirstPanel,
                  handleCreateNewFirstPanel,
                )}
              </PanelContent>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={50}
              minSize={20}
              className={`p-5 ${styles.resizableOverflowAuto}`}
            >
              <PanelContent data-testid="timelines-panel">
                {renderPanelHeader(
                  'Timelines',
                  'timeline',
                  handleAddExistingTimeline,
                  handleCreateNewTimeline,
                )}
                {renderEntities(
                  timelines,
                  'timeline',
                  handleAddExistingTimeline,
                  handleCreateNewTimeline,
                )}
              </PanelContent>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={layout[1]} minSize={20}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel
              defaultSize={50}
              minSize={20}
              className={`p-5 ${styles.resizableOverflowAuto}`}
            >
              <PanelContent data-testid="locations-panel">
                {renderPanelHeader(
                  secondPanelLabel,
                  secondPanelEntityType,
                  handleAddExistingLocation,
                  handleCreateNewLocation,
                )}
                {renderEntities(
                  locations,
                  secondPanelEntityType,
                  handleAddExistingLocation,
                  handleCreateNewLocation,
                )}
              </PanelContent>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={50}
              minSize={20}
              className={`p-5 ${styles.resizableOverflowAuto}`}
            >
              <PanelContent data-testid="related-characters-panel">
                {relatedCharacters !== undefined ? (
                  <>
                    {renderPanelHeader(
                      'Related Characters',
                      'character',
                      handleAddExistingRelatedCharacter,
                      handleCreateNewRelatedCharacter,
                    )}
                    {renderRelatedCharacterEntities(relatedCharacters)}
                  </>
                ) : null}
              </PanelContent>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </GridWrapper>
  )
}
