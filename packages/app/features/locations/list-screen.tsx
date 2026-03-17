'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@repo/ui/components/ui/button'
import { Breadcrumb } from '@repo/ui/components/ui/breadcrumb'
import { LocationsGrid } from './components/LocationsGrid'
import { GridWrapper, Header, Title } from './components/LocationsGrid.styles'

interface Location {
  id: number
  name: string
  description: string | null
  privacy: 'public' | 'private'
  userid: string
  createdAt: Date | null
}

interface LocationsListScreenProps {
  locations: Location[]
  userId: string
  isOwner: boolean
}

export function LocationsListScreen({
  locations,
  userId,
  isOwner,
}: LocationsListScreenProps) {
  const router = useRouter()
  const { resolvedTheme: theme } = useTheme()

  return (
    <GridWrapper>
      <Breadcrumb
        items={[
          { label: 'My Profile', href: `/${userId}` },
          { label: 'Locations' },
        ]}
        className="mb-4"
      />
      <Header>
        <Title $theme={theme}>Locations</Title>
        {isOwner && (
          <Button onClick={() => router.push('/create/locations')}>
            New Location
          </Button>
        )}
      </Header>
      <LocationsGrid locations={locations} userId={userId} theme={theme} />
    </GridWrapper>
  )
}
