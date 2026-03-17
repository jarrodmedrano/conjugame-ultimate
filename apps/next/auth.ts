import { betterAuth, type BetterAuthOptions } from 'better-auth'
import type { Auth } from 'better-auth'
import { Pool } from 'pg'
import { nextCookies } from 'better-auth/next-js'
import { sendVerificationEmail } from './lib/email'

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'postgres12',
  user: process.env.DATABASE_USER || 'root',
  port: parseInt(process.env.DATABASE_PORT || '5498'),
  password: process.env.DATABASE_SECRET || 'secret',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  database: process.env.DATABASE_NAME || 'starter-app',
})

const authConfig = {
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url)
    },
  },
  user: {
    modelName: 'users',
    additionalFields: {
      role: {
        type: ['user', 'admin'],
        required: false,
        defaultValue: 'user',
        input: false, // Don't allow user to set role during signup
      },
      locale: {
        type: 'string',
        required: false,
        defaultValue: 'en',
      },
      isTwoFactorEnabled: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      username: {
        type: 'string',
        required: false,
        defaultValue: null,
      },
    },
  },
  session: {
    modelName: 'sessions',
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  account: {
    modelName: 'accounts',
  },
  verification: {
    modelName: 'verifications',
  },
  // Social providers (uncomment and configure as needed)
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      enabled: !!(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
      enabled: !!(
        process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ),
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID as string,
      clientSecret: process.env.APPLE_CLIENT_SECRET as string,
      enabled: !!(
        process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
      ),
    },
  },
  // Advanced configuration
  advanced: {
    database: {
      // Use Web Crypto API (available in Node.js 19+ and modern browsers)
      generateId: () => globalThis.crypto.randomUUID(),
    },
  },
  // Base URL for the auth endpoints
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000',
  // Secret for signing tokens - REQUIRED for security
  secret: (() => {
    const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET
    // During build time, use a placeholder secret (Next.js build phase)
    // The real secret MUST be set at runtime via environment variables
    if (
      process.env.NODE_ENV === 'production' &&
      (!secret || secret.length < 32)
    ) {
      // Allow build to proceed with a warning - runtime will use actual env var
      console.warn(
        'WARNING: BETTER_AUTH_SECRET not set during build. Ensure it is set at runtime.',
      )
      return 'build-time-placeholder-secret-minimum-32-chars'
    }
    if (!secret || secret.length < 32) {
      throw new Error(
        'BETTER_AUTH_SECRET must be set and at least 32 characters long. ' +
          "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
      )
    }
    return secret
  })(),
  plugins: [nextCookies()],
} satisfies BetterAuthOptions

export const auth: ReturnType<typeof betterAuth> = betterAuth(authConfig)

// Export types for use in the application
export type Session = typeof auth.$Infer.Session.session & {
  user: typeof auth.$Infer.Session.user
}
export type User = typeof auth.$Infer.Session.user

// Export handlers for Next.js route handler
export const handlers = {
  GET: auth.handler,
  POST: auth.handler,
}

// Keep these exports for backward compatibility during migration
export const signIn: typeof auth.api.signInEmail = auth.api.signInEmail
export const signOut: typeof auth.api.signOut = auth.api.signOut
