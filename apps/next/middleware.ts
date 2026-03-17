import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import {
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  privateRoutes,
} from './routes'

/**
 * Middleware for route protection and auth redirects.
 * Runs on Edge Runtime for optimal performance.
 *
 * Note: We check for session cookies, not database state.
 * Actual session validation happens in route handlers.
 */
export async function middleware(request: NextRequest) {
  const { nextUrl } = request

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
  const isAuthRoute = authRoutes.includes(nextUrl.pathname)
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
  const isPrivateRoute = privateRoutes.some((route) =>
    nextUrl.pathname.startsWith(route),
  )

  // Let API auth routes pass through
  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  // Redirect legacy UUID-based profile paths to username-based URLs
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const isApiRoute = nextUrl.pathname.startsWith('/api/')
  const firstSegment = nextUrl.pathname.split('/')[1]

  if (!isApiRoute && firstSegment && UUID_PATTERN.test(firstSegment)) {
    const rest = nextUrl.pathname.slice(firstSegment.length + 1)
    const redirectUrl = new URL(
      `/api/user-redirect/${firstSegment}${rest}${nextUrl.search}`,
      request.url,
    )
    return NextResponse.redirect(redirectUrl, { status: 301 })
  }

  // Check if user has session cookie (lightweight check, no database hit)
  // Use better-auth's helper so it handles both 'better-auth.session_token'
  // (HTTP) and '__Secure-better-auth.session_token' (HTTPS) automatically.
  const sessionToken = getSessionCookie(request)
  const isLoggedIn = !!sessionToken

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Protect private routes - require authentication cookie
  if (isPrivateRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(
      new URL(`/signin?callbackUrl=${callbackUrl}`, request.url),
    )
  }

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Add headers for use in pages
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', nextUrl.pathname)
  requestHeaders.set('x-search', nextUrl.search)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/', '/((?!.+\\.[\\w]+$|_next).*)', '/(api|trpc)(.*)'],
}
