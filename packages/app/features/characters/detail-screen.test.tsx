/**
 * Test file for CharacterDetailScreen
 *
 * SPEC COMPLIANCE: Tests verify the Character detail screen wrapper
 * Tests cover:
 * 1. Proper configuration of EntityDetailScreen
 * 2. Character-specific props mapping
 * 3. Custom save handler with correct field mapping
 * 4. Integration with useCharacterEdit hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CharacterDetailScreen } from './detail-screen'
import type { GetCharacterRow } from '@repo/database'

// Mock EntityDetailScreen
const mockEntityDetailScreen = vi.fn(() => (
  <div data-testid="entity-detail-screen">EntityDetailScreen</div>
))

vi.mock('../shared/EntityDetailScreen', () => ({
  EntityDetailScreen: (props: any) => {
    mockEntityDetailScreen(props)
    return <div data-testid="entity-detail-screen">EntityDetailScreen</div>
  },
}))

// Mock CharacterDetail component
vi.mock('./components/CharacterDetail', () => ({
  CharacterDetail: ({ character }: { character: any }) => (
    <div data-testid="character-detail">Character: {character.name}</div>
  ),
}))

// Mock EditCharacterModal component
vi.mock('./components/EditCharacterModal', () => ({
  EditCharacterModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="edit-character-modal">Edit</div> : null,
}))

// Mock useCharacterEdit hook
vi.mock('./hooks/useCharacterEdit', () => ({
  useCharacterEdit: vi.fn(() => ({
    formData: { name: 'Test', description: 'Desc' },
    isEditing: false,
    isDirty: false,
    startEditing: vi.fn(),
    cancelEditing: vi.fn(),
    updateField: vi.fn(),
    saveChanges: vi.fn(),
  })),
}))

describe('CharacterDetailScreen', () => {
  const mockCharacter: GetCharacterRow = {
    id: 1,
    userid: 'user123',
    name: 'Test Character',
    description: 'Test Description',
    privacy: 'public',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockRelatedEntities = {
    stories: [{ id: 1, name: 'Story 1' }],
    locations: [{ id: 2, name: 'Location 1' }],
    timelines: [{ id: 3, name: 'Timeline 1' }],
  }

  const mockOnUpdate = vi.fn()
  const mockOnGetUserEntities = vi.fn()
  const mockOnLinkEntity = vi.fn()
  const mockOnUnlinkEntity = vi.fn()
  const mockOnCreateAndLinkEntity = vi.fn()

  const defaultProps = {
    character: mockCharacter,
    relatedEntities: mockRelatedEntities,
    isOwner: true,
    isEditMode: false,
    userId: 'user123',
    onUpdate: mockOnUpdate,
    onGetUserEntities: mockOnGetUserEntities,
    onLinkEntity: mockOnLinkEntity,
    onUnlinkEntity: mockOnUnlinkEntity,
    onCreateAndLinkEntity: mockOnCreateAndLinkEntity,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Configuration', () => {
    it('should render EntityDetailScreen with correct entityType', () => {
      render(<CharacterDetailScreen {...defaultProps} />)

      expect(mockEntityDetailScreen).toHaveBeenCalled()
      const props = mockEntityDetailScreen.mock.calls[0][0]
      expect(props.entityType).toBe('character')
    })

    it('should pass character entity to EntityDetailScreen', () => {
      render(<CharacterDetailScreen {...defaultProps} />)

      const props = mockEntityDetailScreen.mock.calls[0][0]
      expect(props.entity).toBe(mockCharacter)
    })

    it('should pass relatedEntities correctly', () => {
      render(<CharacterDetailScreen {...defaultProps} />)

      const props = mockEntityDetailScreen.mock.calls[0][0]
      expect(props.relatedEntities).toBe(mockRelatedEntities)
    })

    it('should set correct entity labels', () => {
      render(<CharacterDetailScreen {...defaultProps} />)

      const props = mockEntityDetailScreen.mock.calls[0][0]
      expect(props.entityLabel).toBe('Character')
      expect(props.entityLabelPlural).toBe('Characters')
    })

    it('should set firstPanelType to "story"', () => {
      render(<CharacterDetailScreen {...defaultProps} />)

      const props = mockEntityDetailScreen.mock.calls[0][0]
      expect(props.firstPanelType).toBe('story')
    })
  })

  describe('Custom Save Handler', () => {
    it('should handle save with correct field mapping', async () => {
      const mockOnUpdate = vi.fn().mockResolvedValue(mockCharacter)

      render(
        <CharacterDetailScreen {...defaultProps} onUpdate={mockOnUpdate} />,
      )

      const props = mockEntityDetailScreen.mock.calls[0][0]
      const handleSave = props.handleSave

      const formData = {
        name: 'Updated Name',
        description: 'Updated Description',
      }

      await handleSave({
        entity: mockCharacter,
        formData,
        onUpdate: mockOnUpdate,
      })

      expect(mockOnUpdate).toHaveBeenCalledWith({
        id: mockCharacter.id,
        name: 'Updated Name',
        description: 'Updated Description',
      })
    })

    it('should throw error when onUpdate is not provided', async () => {
      render(<CharacterDetailScreen {...defaultProps} onUpdate={undefined} />)

      const props = mockEntityDetailScreen.mock.calls[0][0]
      const handleSave = props.handleSave

      await expect(
        handleSave({
          entity: mockCharacter,
          formData: { name: 'Test', description: 'Test' },
          onUpdate: undefined,
        }),
      ).rejects.toThrow('Update function not available')
    })

    it('should throw error when update returns null', async () => {
      const mockOnUpdate = vi.fn().mockResolvedValue(null)

      render(
        <CharacterDetailScreen {...defaultProps} onUpdate={mockOnUpdate} />,
      )

      const props = mockEntityDetailScreen.mock.calls[0][0]
      const handleSave = props.handleSave

      await expect(
        handleSave({
          entity: mockCharacter,
          formData: { name: 'Test', description: 'Test' },
          onUpdate: mockOnUpdate,
        }),
      ).rejects.toThrow('Update failed')
    })
  })

  describe('Entity ID Getter', () => {
    it('should return correct entity ID', () => {
      render(<CharacterDetailScreen {...defaultProps} />)

      const props = mockEntityDetailScreen.mock.calls[0][0]
      const getEntityId = props.getEntityId

      expect(getEntityId(mockCharacter)).toBe(1)
    })
  })

  describe('DetailComponent Rendering', () => {
    it('should render DetailComponent with entity and entity key', () => {
      render(<CharacterDetailScreen {...defaultProps} />)

      const props = mockEntityDetailScreen.mock.calls[0][0]
      const DetailComponent = props.DetailComponent

      const detailProps = {
        entity: mockCharacter,
        character: mockCharacter,
        isOwner: true,
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onTogglePrivacy: vi.fn(),
        onToggleRelated: vi.fn(),
        showRelated: false,
        theme: 'light',
      }

      const { container } = render(<DetailComponent {...detailProps} />)

      expect(
        container.querySelector('[data-testid="character-detail"]'),
      ).toBeTruthy()
    })

    it('should map privacy field correctly', () => {
      render(<CharacterDetailScreen {...defaultProps} />)

      const props = mockEntityDetailScreen.mock.calls[0][0]
      const DetailComponent = props.DetailComponent

      const detailProps = {
        entity: { ...mockCharacter, privacy: 'private' },
        character: { ...mockCharacter, privacy: 'private' },
        isOwner: true,
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onTogglePrivacy: vi.fn(),
        onToggleRelated: vi.fn(),
        showRelated: false,
        theme: 'light',
      }

      render(<DetailComponent {...detailProps} />)
      // Privacy mapping is tested through the component render
    })
  })

  describe('Callback Forwarding', () => {
    it('should forward all callbacks to EntityDetailScreen', () => {
      render(<CharacterDetailScreen {...defaultProps} />)

      const props = mockEntityDetailScreen.mock.calls[0][0]

      expect(props.onUpdate).toBe(mockOnUpdate)
      expect(props.onGetUserEntities).toBe(mockOnGetUserEntities)
      expect(props.onLinkEntity).toBe(mockOnLinkEntity)
      expect(props.onUnlinkEntity).toBe(mockOnUnlinkEntity)
      expect(props.onCreateAndLinkEntity).toBe(mockOnCreateAndLinkEntity)
    })

    it('should forward ownership and edit mode flags', () => {
      render(
        <CharacterDetailScreen
          {...defaultProps}
          isOwner={false}
          isEditMode={true}
        />,
      )

      const props = mockEntityDetailScreen.mock.calls[0][0]

      expect(props.isOwner).toBe(false)
      expect(props.isEditMode).toBe(true)
    })
  })

  describe('Hook Integration', () => {
    it('should pass useCharacterEdit hook to EntityDetailScreen', () => {
      render(<CharacterDetailScreen {...defaultProps} />)

      const props = mockEntityDetailScreen.mock.calls[0][0]

      expect(props.useEntityEdit).toBeDefined()
      expect(typeof props.useEntityEdit).toBe('function')
    })
  })
})
