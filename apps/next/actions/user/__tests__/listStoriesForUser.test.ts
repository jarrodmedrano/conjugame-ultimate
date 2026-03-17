import { describe, it, expect, vi, beforeEach } from 'vitest'
import listStoriesForUser from '../listStoriesForUser'

vi.mock('../../../app/utils/open-pool', () => ({
  default: {
    connect: vi.fn(),
  },
}))

describe('listStoriesForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return stories for a valid user', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({
        rows: [
          [
            1,
            'user-123',
            'Test Story',
            'Content',
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

    const result = await listStoriesForUser({
      userid: 'user-123',
      limit: '10',
      offset: '0',
    })

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Test Story')
    expect(mockClient.release).toHaveBeenCalled()
  })

  it('should return empty array when no stories found', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    }

    const pool = await import('../../../app/utils/open-pool')
    vi.mocked(pool.default.connect).mockResolvedValue(mockClient as any)

    const result = await listStoriesForUser({
      userid: 'user-456',
      limit: '10',
      offset: '0',
    })

    expect(result).toEqual([])
  })

  it('should handle database errors gracefully', async () => {
    const mockClient = {
      query: vi.fn().mockRejectedValue(new Error('DB Error')),
      release: vi.fn(),
    }

    const pool = await import('../../../app/utils/open-pool')
    vi.mocked(pool.default.connect).mockResolvedValue(mockClient as any)

    const result = await listStoriesForUser({
      userid: 'user-789',
      limit: '10',
      offset: '0',
    })

    expect(result).toEqual([])
    expect(mockClient.release).toHaveBeenCalled()
  })
})
