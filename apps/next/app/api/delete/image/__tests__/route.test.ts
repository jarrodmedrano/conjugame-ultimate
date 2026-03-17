import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../../../../../lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
  RateLimitConfigs: { api: { tokensPerInterval: 100, interval: 'minute' } },
}))

vi.mock('../../../../../lib/auth-middleware', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('../../../../utils/open-pool', () => ({
  default: { connect: vi.fn() },
}))

vi.mock('database', () => ({
  deleteEntityImage: vi.fn(),
}))

vi.mock('../../../../../lib/cloudinary', () => ({
  cloudinary: { uploader: { destroy: vi.fn() } },
}))

// ── Imports (after mocks) ──────────────────────────────────────────────────────

const { DELETE } = await import('../route')
const { requireAuth } = await import('../../../../../lib/auth-middleware')
const { default: pool } = await import('../../../../utils/open-pool')
const { deleteEntityImage } = await import('database')
const { cloudinary } = await import('../../../../../lib/cloudinary')

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/delete/image?id=${id}`, {
    method: 'DELETE',
  })
}

function mockAuth(userId: string) {
  vi.mocked(requireAuth).mockResolvedValue({
    user: { id: userId },
    session: {},
  } as any)
}

function mockClient(queryResult: { rows: any[] }) {
  const client = {
    query: vi.fn().mockResolvedValue(queryResult),
    release: vi.fn(),
  }
  vi.mocked(pool.connect).mockResolvedValue(client as any)
  return client
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('DELETE /api/delete/image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 403 if the user does not own the image', async () => {
    mockAuth('user-abc')
    mockClient({
      rows: [{ owner_id: 'user-other', cloudinary_public_id: 'img_123' }],
    })

    const response = await DELETE(makeRequest('1'))
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.error).toMatch(/Forbidden/)
  })

  it('should delete the image from the database and Cloudinary if the user owns it', async () => {
    mockAuth('user-abc')
    const client = mockClient({
      rows: [{ owner_id: 'user-abc', cloudinary_public_id: 'img_123' }],
    })

    const response = await DELETE(makeRequest('1'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(deleteEntityImage).toHaveBeenCalledWith(client, { id: 1 })
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('img_123')
    expect(client.release).toHaveBeenCalled()
  })

  it('should return 404 if the image is not found', async () => {
    mockAuth('user-abc')
    mockClient({ rows: [] })

    const response = await DELETE(makeRequest('999'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toMatch(/not found/i)
  })
})
