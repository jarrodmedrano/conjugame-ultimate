import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from './auth'
import { apiAuthPrefix, authRoutes, publicRoutes } from './routes'

export async function proxy(request: NextRequest) {
  const { nextUrl } = request

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
  const isAuthRoute = authRoutes.includes(nextUrl.pathname)
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname)

  // Let API auth routes pass through
  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  // Let public routes pass through
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // THIS IS NOT SECURE!
  // This is the recommended approach to optimistically redirect users
  // We recommend handling auth checks in each page/route
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // If no session and not on an auth route, redirect to sign-in
  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // If has session and on an auth route, redirect to home
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Add pathname and search to headers for use in pages
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', nextUrl.pathname)
  requestHeaders.set('x-search', nextUrl.search)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Specify the routes the proxy applies to
export const config = {
  matcher: ['/', '/((?!.+\\.[\\w]+$|_next).*)', '/(api|trpc)(.*)'],
}
