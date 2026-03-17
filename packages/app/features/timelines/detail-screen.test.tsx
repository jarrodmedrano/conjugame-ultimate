/**
 * Test file for TimelineDetailScreen
 *
 * Tests verify the Timeline detail screen wrapper configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { TimelineDetailScreen } from './detail-screen'
import type { GetTimelineRow } from '@repo/database'

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

vi.mock('./components/TimelineDetail', () => ({
  TimelineDetail: () => <div data-testid="timeline-detail">Timeline</div>,
}))

vi.mock('./components/EditTimelineModal', () => ({
  EditTimelineModal: () => null,
}))

vi.mock('./hooks/useTimelineEdit', () => ({
  useTimelineEdit: vi.fn(),
}))

describe('TimelineDetailScreen', () => {
  const mockTimeline: GetTimelineRow = {
    id: 1,
    userid: 'user123',
    name: 'Test Timeline',
    description: 'Test Description',
    privacy: 'public',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const defaultProps = {
    timeline: mockTimeline,
    relatedEntities: {
      stories: [],
      characters: [],
      locations: [],
    },
    isOwner: true,
    isEditMode: false,
    userId: 'user123',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should configure EntityDetailScreen with timeline entityType', () => {
    render(<TimelineDetailScreen {...defaultProps} />)

    const props = mockEntityDetailScreen.mock.calls[0][0]
    expect(props.entityType).toBe('timeline')
    expect(props.entityLabel).toBe('Timeline')
    expect(props.entityLabelPlural).toBe('Timelines')
  })

  it('should handle save with correct field mapping', async () => {
    const mockOnUpdate = vi.fn().mockResolvedValue(mockTimeline)

    render(<TimelineDetailScreen {...defaultProps} onUpdate={mockOnUpdate} />)

    const props = mockEntityDetailScreen.mock.calls[0][0]
    await props.handleSave({
      entity: mockTimeline,
      formData: { name: 'Updated', description: 'Updated Desc' },
      onUpdate: mockOnUpdate,
    })

    expect(mockOnUpdate).toHaveBeenCalledWith({
      id: 1,
      name: 'Updated',
      description: 'Updated Desc',
    })
  })

  it('should set firstPanelType to story', () => {
    render(<TimelineDetailScreen {...defaultProps} />)

    const props = mockEntityDetailScreen.mock.calls[0][0]
    expect(props.firstPanelType).toBe('story')
  })
})
