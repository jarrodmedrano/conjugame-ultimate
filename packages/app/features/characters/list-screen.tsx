'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@repo/ui/components/ui/button'
import { Breadcrumb } from '@repo/ui/components/ui/breadcrumb'
import { CharactersGrid } from './components/CharactersGrid'
import { GridWrapper, Header, Title } from './components/CharactersGrid.styles'

interface Character {
  id: number
  name: string
  description: string | null
  privacy: 'public' | 'private'
  userid: string
  createdAt: Date | null
}

interface CharactersListScreenProps {
  characters: Character[]
  userId: string
  isOwner: boolean
}

export function CharactersListScreen({
  characters,
  userId,
  isOwner,
}: CharactersListScreenProps) {
  const router = useRouter()
  const { resolvedTheme: theme } = useTheme()

  return (
    <GridWrapper>
      <Breadcrumb
        items={[
          { label: 'My Profile', href: `/${userId}` },
          { label: 'Characters' },
        ]}
        className="mb-4"
      />
      <Header>
        <Title $theme={theme}>Characters</Title>
        {isOwner && (
          <Button onClick={() => router.push('/create/characters')}>
            New Character
          </Button>
        )}
      </Header>
      <CharactersGrid characters={characters} userId={userId} theme={theme} />
    </GridWrapper>
  )
}
