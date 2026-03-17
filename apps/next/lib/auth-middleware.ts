import { auth } from '../auth'
import { NextResponse } from 'next/server'

/**
 * Authentication middleware for API routes.
 * Validates the user's session and returns the authenticated user.
 */
export async function requireAuth(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || !session.user) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized. Please sign in.' },
          { status: 401 }
        ),
      }
    }

    return {
      user: session.user,
      session: session.session,
    }
  } catch (error) {
    console.error('Authentication error:', error instanceof Error ? error.message : 'Unknown error')
    return {
      error: NextResponse.json(
        { error: 'Authentication failed.' },
        { status: 401 }
      ),
    }
  }
}

/**
 * Authorization middleware to verify resource ownership.
 */
export function verifyOwnership(userId: string, resourceUserId: string) {
  if (userId !== resourceUserId) {
    return NextResponse.json(
      { error: 'Forbidden. You do not have access to this resource.' },
      { status: 403 }
    )
  }
  return null
}

/**
 * Require admin role for the request.
 */
export function requireAdmin(user: { role?: string | null }) {
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden. Admin access required.' },
      { status: 403 }
    )
  }
  return null
}
