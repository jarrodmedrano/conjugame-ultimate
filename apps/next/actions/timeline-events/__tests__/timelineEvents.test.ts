import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('../../../auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('../../../app/utils/open-pool', () => ({
  default: { connect: vi.fn() },
}))

vi.mock('@repo/database', () => ({
  createTimelineEvent: vi.fn(),
  updateTimelineEvent: vi.fn(),
  deleteTimelineEvent: vi.fn(),
  getTimeline: vi.fn(),
  getTimelineEvents: vi.fn(),
  getTimelineEvent: vi.fn(),
}))

// ── Imports (after mocks) ──────────────────────────────────────────────────────

const { createTimelineEvent } = await import('../createTimelineEvent')
const { updateTimelineEvent } = await import('../updateTimelineEvent')
const { deleteTimelineEvent } = await import('../deleteTimelineEvent')
const { auth } = await import('../../../auth')
const { default: pool } = await import('../../../app/utils/open-pool')
const db = await import('@repo/database')

// ── Helpers ────────────────────────────────────────────────────────────────────

function mockAuth(userId: string) {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: { id: userId },
    session: {},
  } as any)
}

function mockClient() {
  const client = {
    query: vi.fn(),
    release: vi.fn(),
  }
  vi.mocked(pool.connect).mockResolvedValue(client as any)
  return client
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('createTimelineEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should correctly create a new timeline event with auto-assigned orderIndex', async () => {
    mockAuth('user-123')
    mockClient()

    vi.mocked(db.getTimeline).mockResolvedValue({
      id: 1,
      userid: 'user-123',
      slug: 'my-timeline',
    } as any)

    // Two existing events → next orderIndex should be 2
    vi.mocked(db.getTimelineEvents).mockResolvedValue([
      { id: 10 },
      { id: 11 },
    ] as any)

    vi.mocked(db.createTimelineEvent).mockResolvedValue({
      id: 12,
      timelineId: 1,
      eventDate: '2025-01-01',
      title: 'New Event',
      description: null,
      orderIndex: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await createTimelineEvent({
      timelineId: 1,
      eventDate: '2025-01-01',
      title: 'New Event',
    })

    expect(result).toEqual({ success: true })
    expect(db.createTimelineEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        timelineId: 1,
        eventDate: '2025-01-01',
        title: 'New Event',
        description: null,
        orderIndex: 2,
      }),
    )
  })

  it('should return validation error for invalid input', async () => {
    mockAuth('user-123')

    const result = await createTimelineEvent({
      timelineId: -1,
      eventDate: '',
      title: '',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    // Should not attempt any DB calls
    expect(db.getTimeline).not.toHaveBeenCalled()
  })

  it('should return unauthorized when no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any)

    const result = await createTimelineEvent({
      timelineId: 1,
      eventDate: '2025-01-01',
      title: 'New Event',
    })

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(db.getTimeline).not.toHaveBeenCalled()
  })

  it('should return error when timeline is not found', async () => {
    mockAuth('user-123')
    mockClient()

    vi.mocked(db.getTimeline).mockResolvedValue(null as any)

    const result = await createTimelineEvent({
      timelineId: 999,
      eventDate: '2025-01-01',
      title: 'New Event',
    })

    expect(result).toEqual({ success: false, error: 'Timeline not found' })
    expect(db.createTimelineEvent).not.toHaveBeenCalled()
  })

  it('should return unauthorized when user does not own the timeline', async () => {
    mockAuth('user-123')
    mockClient()

    vi.mocked(db.getTimeline).mockResolvedValue({
      id: 1,
      userid: 'other-user',
      slug: 'my-timeline',
    } as any)

    const result = await createTimelineEvent({
      timelineId: 1,
      eventDate: '2025-01-01',
      title: 'New Event',
    })

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(db.createTimelineEvent).not.toHaveBeenCalled()
  })

  it('should return error when database operation fails', async () => {
    mockAuth('user-123')
    mockClient()

    vi.mocked(db.getTimeline).mockResolvedValue({
      id: 1,
      userid: 'user-123',
      slug: 'my-timeline',
    } as any)
    vi.mocked(db.getTimelineEvents).mockResolvedValue([])
    vi.mocked(db.createTimelineEvent).mockRejectedValue(new Error('DB error'))

    const result = await createTimelineEvent({
      timelineId: 1,
      eventDate: '2025-01-01',
      title: 'New Event',
    })

    expect(result).toEqual({ success: false, error: 'Failed to create event' })
  })
})

describe('updateTimelineEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should correctly update an existing timeline event', async () => {
    mockAuth('user-123')
    mockClient()

    vi.mocked(db.getTimelineEvent).mockResolvedValue({
      id: 5,
      timelineId: 1,
      eventDate: '2025-01-01',
      title: 'Old Title',
      description: null,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(db.getTimeline).mockResolvedValue({
      id: 1,
      userid: 'user-123',
      slug: 'my-timeline',
    } as any)

    vi.mocked(db.updateTimelineEvent).mockResolvedValue({
      id: 5,
      timelineId: 1,
      eventDate: '2025-06-15',
      title: 'Updated Title',
      description: 'Updated desc',
      orderIndex: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await updateTimelineEvent({
      id: 5,
      eventDate: '2025-06-15',
      title: 'Updated Title',
      description: 'Updated desc',
      orderIndex: 3,
    })

    expect(result).toEqual({ success: true })
    expect(db.updateTimelineEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: 5,
        eventDate: '2025-06-15',
        title: 'Updated Title',
        description: 'Updated desc',
        orderIndex: 3,
      }),
    )
  })

  it('should return validation error for invalid input', async () => {
    mockAuth('user-123')

    const result = await updateTimelineEvent({
      id: -1,
      eventDate: '',
      title: '',
      orderIndex: -5,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(db.getTimelineEvent).not.toHaveBeenCalled()
  })

  it('should return unauthorized when no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any)

    const result = await updateTimelineEvent({
      id: 5,
      eventDate: '2025-06-15',
      title: 'Updated Title',
      orderIndex: 0,
    })

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(db.getTimelineEvent).not.toHaveBeenCalled()
  })

  it('should return error when event is not found', async () => {
    mockAuth('user-123')
    mockClient()

    vi.mocked(db.getTimelineEvent).mockResolvedValue(null as any)

    const result = await updateTimelineEvent({
      id: 999,
      eventDate: '2025-06-15',
      title: 'Updated Title',
      orderIndex: 0,
    })

    expect(result).toEqual({ success: false, error: 'Event not found' })
    expect(db.updateTimelineEvent).not.toHaveBeenCalled()
  })

  it('should return unauthorized when user does not own the timeline', async () => {
    mockAuth('user-123')
    mockClient()

    vi.mocked(db.getTimelineEvent).mockResolvedValue({
      id: 5,
      timelineId: 1,
      eventDate: '2025-01-01',
      title: 'Old Title',
      description: null,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(db.getTimeline).mockResolvedValue({
      id: 1,
      userid: 'other-user',
      slug: 'my-timeline',
    } as any)

    const result = await updateTimelineEvent({
      id: 5,
      eventDate: '2025-06-15',
      title: 'Updated Title',
      orderIndex: 0,
    })

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(db.updateTimelineEvent).not.toHaveBeenCalled()
  })

  it('should return error when database operation fails', async () => {
    mockAuth('user-123')
    mockClient()

    vi.mocked(db.getTimelineEvent).mockResolvedValue({
      id: 5,
      timelineId: 1,
      eventDate: '2025-01-01',
      title: 'Old Title',
      description: null,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(db.getTimeline).mockResolvedValue({
      id: 1,
      userid: 'user-123',
      slug: 'my-timeline',
    } as any)

    vi.mocked(db.updateTimelineEvent).mockRejectedValue(new Error('DB error'))

    const result = await updateTimelineEvent({
      id: 5,
      eventDate: '2025-06-15',
      title: 'Updated Title',
      orderIndex: 0,
    })

    expect(result).toEqual({ success: false, error: 'Failed to update event' })
  })
})

describe('deleteTimelineEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should correctly delete a timeline event', async () => {
    mockAuth('user-123')
    mockClient()

    vi.mocked(db.getTimelineEvent).mockResolvedValue({
      id: 5,
      timelineId: 1,
      eventDate: '2025-01-01',
      title: 'To Delete',
      description: null,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(db.getTimeline).mockResolvedValue({
      id: 1,
      userid: 'user-123',
      slug: 'my-timeline',
    } as any)

    vi.mocked(db.deleteTimelineEvent).mockResolvedValue(undefined)

    const result = await deleteTimelineEvent({ id: 5 })

    expect(result).toEqual({ success: true })
    expect(db.deleteTimelineEvent).toHaveBeenCalledWith(expect.anything(), {
      id: 5,
    })
  })

  it('should return unauthorized when no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as any)

    const result = await deleteTimelineEvent({ id: 5 })

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(db.getTimelineEvent).not.toHaveBeenCalled()
  })

  it('should return error when event is not found', async () => {
    mockAuth('user-123')
    mockClient()

    vi.mocked(db.getTimelineEvent).mockResolvedValue(null as any)

    const result = await deleteTimelineEvent({ id: 999 })

    expect(result).toEqual({ success: false, error: 'Event not found' })
    expect(db.deleteTimelineEvent).not.toHaveBeenCalled()
  })

  it('should return unauthorized when user does not own the timeline', async () => {
    mockAuth('user-123')
    mockClient()

    vi.mocked(db.getTimelineEvent).mockResolvedValue({
      id: 5,
      timelineId: 1,
      eventDate: '2025-01-01',
      title: 'To Delete',
      description: null,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(db.getTimeline).mockResolvedValue({
      id: 1,
      userid: 'other-user',
      slug: 'my-timeline',
    } as any)

    const result = await deleteTimelineEvent({ id: 5 })

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(db.deleteTimelineEvent).not.toHaveBeenCalled()
  })

  it('should return error when database operation fails', async () => {
    mockAuth('user-123')
    mockClient()

    vi.mocked(db.getTimelineEvent).mockResolvedValue({
      id: 5,
      timelineId: 1,
      eventDate: '2025-01-01',
      title: 'To Delete',
      description: null,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(db.getTimeline).mockResolvedValue({
      id: 1,
      userid: 'user-123',
      slug: 'my-timeline',
    } as any)

    vi.mocked(db.deleteTimelineEvent).mockRejectedValue(new Error('DB error'))

    const result = await deleteTimelineEvent({ id: 5 })

    expect(result).toEqual({ success: false, error: 'Failed to delete event' })
  })
})
