import { describe, it, expect, vi, beforeEach } from 'vitest'
import listLocationsForUser from '../listLocationsForUser'

vi.mock('../../../app/utils/open-pool', () => ({
  default: {
    connect: vi.fn(),
  },
}))

describe('listLocationsForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return locations for a valid user', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({
        rows: [
          [
            1,
            'user-123',
            'Test Location',
            'Description',
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

    const result = await listLocationsForUser({
      userid: 'user-123',
      limit: '10',
      offset: '0',
    })

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Test Location')
    expect(mockClient.release).toHaveBeenCalled()
  })

  it('should return empty array when no locations found', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    }

    const pool = await import('../../../app/utils/open-pool')
    vi.mocked(pool.default.connect).mockResolvedValue(mockClient as any)

    const result = await listLocationsForUser({
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

    const result = await listLocationsForUser({
      userid: 'user-789',
      limit: '10',
      offset: '0',
    })

    expect(result).toEqual([])
    expect(mockClient.release).toHaveBeenCalled()
  })
})
