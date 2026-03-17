'use client'

import { Globe, Lock } from 'lucide-react'
import Link from 'next/link'
import {
  Grid,
  LocationCard,
  LocationTitle,
  LocationContent,
  PrivacyBadge,
} from './LocationsGrid.styles'

interface Location {
  id: number
  name: string
  description: string | null
  privacy: 'public' | 'private'
  userid: string
  createdAt: Date | null
}

interface LocationsGridProps {
  locations: Location[]
  userId: string
  theme?: string
}

export function LocationsGrid({
  locations,
  userId,
  theme,
}: LocationsGridProps) {
  return (
    <Grid>
      {locations.map((location) => (
        <Link
          key={location.id}
          href={`/${userId}/locations/${location.id}`}
          style={{ textDecoration: 'none' }}
        >
          <LocationCard $theme={theme}>
            <LocationTitle $theme={theme}>{location.name}</LocationTitle>
            <LocationContent $theme={theme}>
              {location.description
                ? location.description.substring(0, 150)
                : 'No description'}
              {location.description &&
                location.description.length > 150 &&
                '...'}
            </LocationContent>
            <PrivacyBadge
              $isPublic={location.privacy === 'public'}
              $theme={theme}
            >
              {location.privacy === 'public' ? (
                <>
                  <Globe className="h-3 w-3" /> Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" /> Private
                </>
              )}
            </PrivacyBadge>
          </LocationCard>
        </Link>
      ))}
    </Grid>
  )
}
