'use client'

import { Globe, Lock } from 'lucide-react'
import Link from 'next/link'
import {
  Grid,
  CharacterCard,
  CharacterTitle,
  CharacterContent,
  PrivacyBadge,
} from './CharactersGrid.styles'

interface Character {
  id: number
  name: string
  description: string | null
  privacy: 'public' | 'private'
  userid: string
  createdAt: Date | null
}

interface CharactersGridProps {
  characters: Character[]
  userId: string
  theme?: string
}

export function CharactersGrid({
  characters,
  userId,
  theme,
}: CharactersGridProps) {
  return (
    <Grid>
      {characters.map((character) => (
        <Link
          key={character.id}
          href={`/${userId}/characters/${character.id}`}
          style={{ textDecoration: 'none' }}
        >
          <CharacterCard $theme={theme}>
            <CharacterTitle $theme={theme}>{character.name}</CharacterTitle>
            <CharacterContent $theme={theme}>
              {character.description
                ? character.description.substring(0, 150)
                : 'No description'}
              {character.description &&
                character.description.length > 150 &&
                '...'}
            </CharacterContent>
            <PrivacyBadge
              $isPublic={character.privacy === 'public'}
              $theme={theme}
            >
              {character.privacy === 'public' ? (
                <>
                  <Globe className="h-3 w-3" /> Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" /> Private
                </>
              )}
            </PrivacyBadge>
          </CharacterCard>
        </Link>
      ))}
    </Grid>
  )
}
