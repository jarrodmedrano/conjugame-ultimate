/**
 * Test file for LocationDetailScreen
 *
 * Tests verify the Location detail screen wrapper configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { LocationDetailScreen } from './detail-screen'
import type { GetLocationRow } from '@repo/database'

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

vi.mock('./components/LocationDetail', () => ({
  LocationDetail: () => <div data-testid="location-detail">Location</div>,
}))

vi.mock('./components/EditLocationModal', () => ({
  EditLocationModal: () => null,
}))

vi.mock('./hooks/useLocationEdit', () => ({
  useLocationEdit: vi.fn(),
}))

describe('LocationDetailScreen', () => {
  const mockLocation: GetLocationRow = {
    id: 1,
    userid: 'user123',
    name: 'Test Location',
    description: 'Test Description',
    privacy: 'public',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const defaultProps = {
    location: mockLocation,
    relatedEntities: {
      stories: [],
      characters: [],
      timelines: [],
    },
    isOwner: true,
    isEditMode: false,
    userId: 'user123',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should configure EntityDetailScreen with location entityType', () => {
    render(<LocationDetailScreen {...defaultProps} />)

    const props = mockEntityDetailScreen.mock.calls[0][0]
    expect(props.entityType).toBe('location')
    expect(props.entityLabel).toBe('Location')
    expect(props.entityLabelPlural).toBe('Locations')
  })

  it('should handle save with correct field mapping', async () => {
    const mockOnUpdate = vi.fn().mockResolvedValue(mockLocation)

    render(<LocationDetailScreen {...defaultProps} onUpdate={mockOnUpdate} />)

    const props = mockEntityDetailScreen.mock.calls[0][0]
    await props.handleSave({
      entity: mockLocation,
      formData: { name: 'Updated', description: 'Updated Desc' },
      onUpdate: mockOnUpdate,
    })

    expect(mockOnUpdate).toHaveBeenCalledWith({
      id: 1,
      name: 'Updated',
      description: 'Updated Desc',
    })
  })
})
