import { RateLimiter } from 'limiter'
import { NextResponse } from 'next/server'

/**
 * Rate limiting middleware for API routes
 * Uses in-memory rate limiting with the limiter package
 */

// Store rate limiters per IP address with a max cap to prevent unbounded growth.
// Entries are evicted when the map exceeds MAX_LIMITERS to prevent memory leaks
// in long-running server instances.
const MAX_LIMITERS = 10_000
const limiters = new Map<string, RateLimiter>()

function evictOldestLimiters() {
  if (limiters.size < MAX_LIMITERS) return
  // Delete the first ~10% of entries (oldest by insertion order)
  const toDelete = Math.ceil(MAX_LIMITERS * 0.1)
  let deleted = 0
  Array.from(limiters.keys()).some((key) => {
    if (deleted >= toDelete) return true
    limiters.delete(key)
    deleted++
    return false
  })
}

interface RateLimitConfig {
  tokensPerInterval: number
  interval: 'second' | 'minute' | 'hour'
  message?: string
}

/**
 * Get or create a rate limiter for an IP address
 */
function getLimiter(ip: string, config: RateLimitConfig): RateLimiter {
  const key = `${ip}-${config.tokensPerInterval}-${config.interval}`

  if (!limiters.has(key)) {
    evictOldestLimiters()
    const limiter = new RateLimiter({
      tokensPerInterval: config.tokensPerInterval,
      interval: config.interval,
    })
    limiters.set(key, limiter)
  }

  return limiters.get(key)!
}

/**
 * Extract IP address from request
 */
function getIP(request: Request): string {
  // Try various headers for IP address (handle proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')

  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()

  return 'unknown'
}

/**
 * Apply rate limiting to a request
 * Returns null if allowed, or a NextResponse with 429 status if rate limited
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig,
): Promise<NextResponse | null> {
  const ip = getIP(request)
  const limiter = getLimiter(ip, config)

  try {
    // Try to remove a token
    const remainingRequests = await limiter.removeTokens(1)

    // If no tokens remaining (rate limit exceeded)
    if (remainingRequests < 0) {
      // Rate limit exceeded
      return NextResponse.json(
        {
          error:
            config.message ||
            'Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60', // Suggest retry after 60 seconds
            'X-RateLimit-Limit': config.tokensPerInterval.toString(),
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }

    // Request allowed
    return null
  } catch (error) {
    console.error('Rate limiting error:', error)
    // If rate limiting fails, allow the request (fail open)
    return null
  }
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitConfigs = {
  // Standard API endpoints: 100 requests per 15 minutes
  api: {
    tokensPerInterval: 100,
    interval: 'minute' as const,
    message: 'Too many API requests. Please try again in 15 minutes.',
  },

  // Stricter limit for expensive operations: 10 requests per minute
  expensive: {
    tokensPerInterval: 10,
    interval: 'minute' as const,
    message: 'Too many requests. Please try again in a minute.',
  },

  // Upload endpoints: 10 uploads per minute
  upload: {
    tokensPerInterval: 10,
    interval: 'minute' as const,
    message: 'Too many upload requests. Please try again in a minute.',
  },

  // Auth endpoints: 5 attempts per minute (prevents brute force)
  auth: {
    tokensPerInterval: 5,
    interval: 'minute' as const,
    message: 'Too many authentication attempts. Please try again later.',
  },
} as const
