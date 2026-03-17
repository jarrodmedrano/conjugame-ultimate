'use client'

import { Globe, Lock } from 'lucide-react'
import Link from 'next/link'
import {
  Grid,
  StoryCard,
  StoryTitle,
  StoryContent,
  PrivacyBadge,
} from './StoriesGrid.styles'

interface Story {
  id: number
  title: string
  content: string
  privacy: 'public' | 'private'
  userid: string
  created_at: Date
}

interface StoriesGridProps {
  stories: Story[]
  userId: string
  theme?: string
}

export function StoriesGrid({ stories, userId, theme }: StoriesGridProps) {
  return (
    <Grid>
      {stories.map((story) => (
        <Link
          key={story.id}
          href={`/${userId}/stories/${story.id}`}
          style={{ textDecoration: 'none' }}
        >
          <StoryCard $theme={theme}>
            <StoryTitle $theme={theme}>{story.title}</StoryTitle>
            <StoryContent $theme={theme}>
              {story.content.substring(0, 150)}
              {story.content.length > 150 && '...'}
            </StoryContent>
            <PrivacyBadge $isPublic={story.privacy === 'public'} $theme={theme}>
              {story.privacy === 'public' ? (
                <>
                  <Globe className="h-3 w-3" /> Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" /> Private
                </>
              )}
            </PrivacyBadge>
          </StoryCard>
        </Link>
      ))}
    </Grid>
  )
}
