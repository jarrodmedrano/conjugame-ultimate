/**
 * Routes that are accessible to the public (no auth required)
 */
export const publicRoutes = [
  '/',
  '/verify',
  '/verifytoken',
  '/about',
  '/signin',
  '/leaderboard',
  '/verbs',
]

/**
 * Routes that require authentication
 */
export const privateRoutes = ['/admin', '/quiz']

/**
 * Auth-specific routes (redirect logged-in users away)
 */
export const authRoutes = [
  '/signin',
  '/register',
  '/error',
  '/reset',
  '/new-password',
  '/user',
]

export const apiAuthPrefix = '/api/auth'
export const DEFAULT_LOGIN_REDIRECT = '/quiz'
export const signinRoute = '/signin'
