import React, { ComponentType } from 'react'
import { auth } from '../../auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { signinRoute } from '../../routes'

const withAuth = <P extends object>(
  Component: ComponentType<P & { session: any }>,
) => {
  const AuthenticatedComponent = async (props: P) => {
    const headersList = await headers()

    // Get the session from better-auth
    let session
    try {
      session = await auth.api.getSession({
        headers: headersList,
      })
    } catch (error) {
      console.error('Error getting session in withAuth:', error)
      throw new Error(
        `Failed to get session: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    }

    if (!session) {
      // Get the current path from headers for callback
      const pathname = headersList.get('x-pathname') || '/'
      const search = headersList.get('x-search') || ''
      const callbackUrl = pathname + search

      redirect(`${signinRoute}?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }

    return <Component session={session} {...(props as any)} />
  }

  return AuthenticatedComponent
}

export default withAuth
