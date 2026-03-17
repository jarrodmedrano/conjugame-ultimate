import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'

function makeRequest(pathname: string, sessionToken?: string): NextRequest {
  const url = `http://localhost${pathname}`
  const req = new NextRequest(url)
  if (sessionToken) {
    req.cookies.set('better-auth.session_token', sessionToken)
  }
  return req
}

describe('middleware', () => {
  describe('API auth routes', () => {
    it('passes /api/auth/* through without checking session', async () => {
      const req = makeRequest('/api/auth/signin')
      const res = await middleware(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('location')).toBeNull()
    })
  })

  describe('private routes (unauthenticated)', () => {
    it('redirects /quiz to /signin with callbackUrl when no session', async () => {
      const req = makeRequest('/quiz')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location')!
      expect(location).toContain('/signin')
      expect(location).toContain('callbackUrl=%2Fquiz')
    })

    it('redirects /admin to /signin with callbackUrl when no session', async () => {
      const req = makeRequest('/admin')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location')!
      expect(location).toContain('/signin')
      expect(location).toContain('callbackUrl=%2Fadmin')
    })
  })

  describe('private routes (authenticated)', () => {
    it('allows /quiz through when session cookie is present', async () => {
      const req = makeRequest('/quiz', 'valid-session-token')
      const res = await middleware(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('location')).toBeNull()
    })

    it('allows /admin through when session cookie is present', async () => {
      const req = makeRequest('/admin', 'valid-session-token')
      const res = await middleware(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('location')).toBeNull()
    })
  })

  describe('auth routes (authenticated users redirected away)', () => {
    it('redirects /signin to / when session cookie is present', async () => {
      const req = makeRequest('/signin', 'valid-session-token')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location')!
      expect(location).toContain('/')
    })

    it('redirects /register to / when session cookie is present', async () => {
      const req = makeRequest('/register', 'valid-session-token')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/')
    })
  })

  describe('auth routes (unauthenticated)', () => {
    it('allows /signin through when no session', async () => {
      const req = makeRequest('/signin')
      const res = await middleware(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('location')).toBeNull()
    })
  })

  describe('public routes', () => {
    it('allows / through without session', async () => {
      const req = makeRequest('/')
      const res = await middleware(req)
      expect(res.status).toBe(200)
    })

    it('allows /about through without session', async () => {
      const req = makeRequest('/about')
      const res = await middleware(req)
      expect(res.status).toBe(200)
    })

    it('allows /leaderboard through without session', async () => {
      const req = makeRequest('/leaderboard')
      const res = await middleware(req)
      expect(res.status).toBe(200)
    })

    it('allows /verbs through without session', async () => {
      const req = makeRequest('/verbs')
      const res = await middleware(req)
      expect(res.status).toBe(200)
    })
  })

  describe('x-pathname header', () => {
    it('allows authenticated requests to non-classified routes through', async () => {
      const req = makeRequest('/some/other/page', 'valid-session-token')
      const res = await middleware(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('location')).toBeNull()
    })
  })
})
