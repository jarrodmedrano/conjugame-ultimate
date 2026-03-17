import { createAuthClient } from 'better-auth/react'

// Create auth client instance
const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
})

export const useAuthType = (): any => {
  const { data: session } = authClient.useSession()

  const signOut = async () => {
    await authClient.signOut()
    // Redirect after sign out
    if (typeof window !== 'undefined') {
      window.location.href = '/signin'
    }
  }

  return {
    user: session?.user,
    signOut,
  }
}

export const signIn: typeof authClient.signIn = authClient.signIn
export const signUp: typeof authClient.signUp = authClient.signUp
export const signOut: typeof authClient.signOut = authClient.signOut
export const useSession: typeof authClient.useSession = authClient.useSession
