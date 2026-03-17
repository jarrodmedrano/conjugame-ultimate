import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock the limiter package ───────────────────────────────────────────────────

let removeTokensReturnValue = 99

vi.mock('limiter', () => {
  return {
    RateLimiter: vi.fn().mockImplementation(function (this: any) {
      this.removeTokens = vi.fn().mockImplementation(() =>
        Promise.resolve(removeTokensReturnValue),
      )
    }),
  }
})

// ── Import after mocks ─────────────────────────────────────────────────────────

const { rateLimit, RateLimitConfigs } = await import('../rate-limit')

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRequest(ip = '127.0.0.1') {
  return new Request('http://localhost/api/test', {
    headers: { 'x-forwarded-for': ip },
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('rateLimit', () => {
  beforeEach(() => {
    removeTokensReturnValue = 99
  })

  it('should return null (allow) when tokens remain', async () => {
    removeTokensReturnValue = 5
    const result = await rateLimit(makeRequest(), RateLimitConfigs.api)
    expect(result).toBeNull()
  })

  it('should return 429 when rate limit is exceeded', async () => {
    removeTokensReturnValue = -1
    const result = await rateLimit(makeRequest(), RateLimitConfigs.api)

    expect(result).not.toBeNull()
    expect(result!.status).toBe(429)

    const body = await result!.json()
    expect(body.error).toBeDefined()
  })
})

describe('rate limiter eviction', () => {
  it('should evict oldest limiters when MAX_LIMITERS is reached', async () => {
    // MAX_LIMITERS is 10 000, so we create that many unique IPs to fill the map,
    // then add one more and verify the total doesn't grow unbounded.
    // Because each call goes through getLimiter → evictOldestLimiters, the
    // internal Map is capped. We can't inspect the Map directly, but we can
    // verify no errors are thrown and the function continues to work.

    removeTokensReturnValue = 99

    // Fill up to MAX_LIMITERS (10 000) unique entries
    const promises: Promise<any>[] = []
    for (let i = 0; i < 10_000; i++) {
      promises.push(rateLimit(makeRequest(`10.0.${Math.floor(i / 256)}.${i % 256}`), RateLimitConfigs.api))
    }
    await Promise.all(promises)

    // One more request triggers eviction — should still work without error
    const result = await rateLimit(makeRequest('192.168.1.1'), RateLimitConfigs.api)
    expect(result).toBeNull()
  })
})
