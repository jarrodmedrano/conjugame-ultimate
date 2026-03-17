'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@repo/ui/components/ui/button'
import { Breadcrumb } from '@repo/ui/components/ui/breadcrumb'
import { StoriesGrid } from './components/StoriesGrid'
import { GridWrapper, Header, Title } from './components/StoriesGrid.styles'

interface Story {
  id: number
  title: string
  content: string
  privacy: 'public' | 'private'
  userid: string
  created_at: Date
}

interface StoriesListScreenProps {
  stories: Story[]
  userId: string
  isOwner: boolean
}

export function StoriesListScreen({
  stories,
  userId,
  isOwner,
}: StoriesListScreenProps) {
  const router = useRouter()
  const { resolvedTheme: theme } = useTheme()

  return (
    <GridWrapper>
      <Breadcrumb
        items={[
          { label: 'My Profile', href: `/${userId}` },
          { label: 'Stories' },
        ]}
        className="mb-4"
      />
      <Header>
        <Title $theme={theme}>Stories</Title>
        {isOwner && (
          <Button onClick={() => router.push('/create/stories')}>
            New Story
          </Button>
        )}
      </Header>
      <StoriesGrid stories={stories} userId={userId} theme={theme} />
    </GridWrapper>
  )
}
