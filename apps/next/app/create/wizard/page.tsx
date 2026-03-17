import { auth } from '../../../auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { signinRoute } from '../../../routes'

export default async function CreatePage() {
  const headersList = await headers()

  // Get the session from better-auth
  let session
  try {
    session = await auth.api.getSession({
      headers: headersList,
    })
  } catch (error) {
    console.error('Error getting session:', error)
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

  return (
    <>
      <h2 className="mt-4 font-medium">You are logged in as:</h2>
      <p className="mt-4">{session?.user?.name}</p>
    </>
  )
}
