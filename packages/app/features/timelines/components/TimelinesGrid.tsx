'use client'

import { Globe, Lock } from 'lucide-react'
import Link from 'next/link'
import {
  Grid,
  TimelineCard,
  TimelineTitle,
  TimelineContent,
  PrivacyBadge,
} from './TimelinesGrid.styles'

interface Timeline {
  id: number
  name: string
  description: string | null
  privacy: 'public' | 'private'
  userid: string
  createdAt: Date | null
}

interface TimelinesGridProps {
  timelines: Timeline[]
  userId: string
  theme?: string
}

export function TimelinesGrid({
  timelines,
  userId,
  theme,
}: TimelinesGridProps) {
  return (
    <Grid>
      {timelines.map((timeline) => (
        <Link
          key={timeline.id}
          href={`/${userId}/timelines/${timeline.id}`}
          style={{ textDecoration: 'none' }}
        >
          <TimelineCard $theme={theme}>
            <TimelineTitle $theme={theme}>{timeline.name}</TimelineTitle>
            <TimelineContent $theme={theme}>
              {timeline.description
                ? timeline.description.substring(0, 150)
                : 'No description'}
              {timeline.description &&
                timeline.description.length > 150 &&
                '...'}
            </TimelineContent>
            <PrivacyBadge
              $isPublic={timeline.privacy === 'public'}
              $theme={theme}
            >
              {timeline.privacy === 'public' ? (
                <>
                  <Globe className="h-3 w-3" /> Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" /> Private
                </>
              )}
            </PrivacyBadge>
          </TimelineCard>
        </Link>
      ))}
    </Grid>
  )
}
