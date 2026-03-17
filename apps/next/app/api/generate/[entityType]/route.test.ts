// apps/next/app/api/generate/[entityType]/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('../../../../lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
  RateLimitConfigs: { expensive: 'expensive' },
}))

vi.mock('../../../../lib/auth-middleware', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: 'user-1' },
    error: null,
  }),
}))

vi.mock('../../../../lib/api-key-encryption', () => ({
  decryptApiKey: vi.fn().mockReturnValue('sk-ant-fake-key-for-testing'),
}))

const mockApiKeyRow = {
  provider: 'anthropic',
  encrypted_key: Buffer.alloc(16),
  iv: Buffer.alloc(12),
  auth_tag: Buffer.alloc(16),
}

vi.mock('../../../utils/open-pool', () => ({
  default: {
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [mockApiKeyRow] }),
      release: vi.fn(),
    }),
  },
}))

vi.mock('../../../../lib/ai/provider', () => ({
  getAIProvider: vi.fn().mockReturnValue({
    generate: vi.fn().mockResolvedValue({
      name: 'Detective Marsh',
      description: 'A haunted investigator.',
      attributes: [{ key: 'Age', value: '45' }],
      mentionedCharacters: [],
    }),
  }),
}))

vi.mock('../../../../lib/ai/context-builder', () => ({
  buildStoryContext: vi.fn().mockResolvedValue(null),
}))

describe('POST /api/generate/[entityType]', () => {
  let POST: (
    req: NextRequest,
    ctx: { params: Promise<{ entityType: string }> },
  ) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    // Re-apply default mock for pool connect
    const { default: pool } = await import('../../../utils/open-pool')
    ;(pool.connect as ReturnType<typeof vi.fn>).mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [mockApiKeyRow] }),
      release: vi.fn(),
    })
    const mod = await import('./route')
    POST = mod.POST
  })

  it('returns 200 with generated entity', async () => {
    const req = new NextRequest('http://localhost/api/generate/character', {
      method: 'POST',
      body: JSON.stringify({
        entityType: 'character',
        prompt: 'A brooding detective',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req, {
      params: Promise.resolve({ entityType: 'character' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Detective Marsh')
  })

  it('returns 400 for invalid entity type', async () => {
    const req = new NextRequest('http://localhost/api/generate/invalid', {
      method: 'POST',
      body: JSON.stringify({ entityType: 'invalid', prompt: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req, {
      params: Promise.resolve({ entityType: 'invalid' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 403 when no api key configured', async () => {
    const { default: pool } = await import('../../../utils/open-pool')
    const mockClient = {
      query: vi.fn().mockResolvedValue({ rows: [] }), // no api key
      release: vi.fn(),
    }
    ;(pool.connect as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockClient,
    )

    const req = new NextRequest('http://localhost/api/generate/character', {
      method: 'POST',
      body: JSON.stringify({ entityType: 'character', prompt: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req, {
      params: Promise.resolve({ entityType: 'character' }),
    })
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('api_key_required')
  })
})
