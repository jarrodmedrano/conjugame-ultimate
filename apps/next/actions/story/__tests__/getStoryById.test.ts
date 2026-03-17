import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../app/utils/open-pool', () => ({
  default: {
    connect: vi.fn(),
  },
}))

// Import after mocks are set up
const { default: getStoryById } = await import('../getStoryById')

describe('getStoryById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch story by id', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({
        rows: [
          [
            1,
            'user-123',
            'Test Story',
            'Test content',
            'private',
            new Date(),
            new Date(),
          ],
        ],
      }),
      release: vi.fn(),
    }

    const pool = await import('../../../app/utils/open-pool')
    vi.mocked(pool.default.connect).mockResolvedValue(mockClient as any)

    const story = await getStoryById({ id: 1 })

    expect(story).toBeDefined()
    expect(story?.title).toBe('Test Story')
    expect(story?.content).toBe('Test content')
    expect(story?.privacy).toBe('private')
    expect(mockClient.release).toHaveBeenCalled()
  })

  it('should return null for non-existent story', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({
        rows: [],
      }),
      release: vi.fn(),
    }

    const pool = await import('../../../app/utils/open-pool')
    vi.mocked(pool.default.connect).mockResolvedValue(mockClient as any)

    const story = await getStoryById({ id: 99999 })

    expect(story).toBeNull()
    expect(mockClient.release).toHaveBeenCalled()
  })

  it('should handle database errors gracefully', async () => {
    const mockClient = {
      query: vi.fn().mockRejectedValue(new Error('DB Error')),
      release: vi.fn(),
    }

    const pool = await import('../../../app/utils/open-pool')
    vi.mocked(pool.default.connect).mockResolvedValue(mockClient as any)

    const story = await getStoryById({ id: 1 })

    expect(story).toBeNull()
    expect(mockClient.release).toHaveBeenCalled()
  })
})
