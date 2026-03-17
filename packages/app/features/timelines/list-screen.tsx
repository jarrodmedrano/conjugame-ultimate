'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@repo/ui/components/ui/button'
import { Breadcrumb } from '@repo/ui/components/ui/breadcrumb'
import { TimelinesGrid } from './components/TimelinesGrid'
import { GridWrapper, Header, Title } from './components/TimelinesGrid.styles'

interface Timeline {
  id: number
  name: string
  description: string | null
  privacy: 'public' | 'private'
  userid: string
  createdAt: Date | null
}

interface TimelinesListScreenProps {
  timelines: Timeline[]
  userId: string
  isOwner: boolean
}

export function TimelinesListScreen({
  timelines,
  userId,
  isOwner,
}: TimelinesListScreenProps) {
  const router = useRouter()
  const { resolvedTheme: theme } = useTheme()

  return (
    <GridWrapper>
      <Breadcrumb
        items={[
          { label: 'My Profile', href: `/${userId}` },
          { label: 'Timelines' },
        ]}
        className="mb-4"
      />
      <Header>
        <Title $theme={theme}>Timelines</Title>
        {isOwner && (
          <Button onClick={() => router.push('/create/timelines')}>
            New Timeline
          </Button>
        )}
      </Header>
      <TimelinesGrid timelines={timelines} userId={userId} theme={theme} />
    </GridWrapper>
  )
}
