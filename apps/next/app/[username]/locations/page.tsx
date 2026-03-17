import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '../../../auth'
import { LocationsListScreen } from '@app/features/locations/list-screen'
import listLocationsForUser from '../../../actions/user/listLocationsForUser'
import { resolveUsername } from '../../../lib/resolve-username'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function LocationsListPage({ params }: PageProps) {
  const { username } = await params
  const profileUser = await resolveUsername(username)
  const userId = profileUser.id
  const headersList = await headers()

  let session
  try {
    session = await auth.api.getSession({
      headers: headersList,
    })
  } catch (error) {
    session = null
  }

  const isOwner = session?.user?.id === userId

  const locations = await listLocationsForUser({
    userid: userId,
    viewerid: session?.user?.id || null,
  })

  if (!locations) {
    notFound()
  }

  // Map to ensure privacy type is correctly typed
  const typedLocations = locations.map((loc) => ({
    ...loc,
    privacy: loc.privacy as 'public' | 'private',
  }))

  return (
    <LocationsListScreen
      locations={typedLocations}
      userId={username}
      isOwner={isOwner}
    />
  )
}
