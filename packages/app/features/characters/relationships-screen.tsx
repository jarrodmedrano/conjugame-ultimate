'use client'

import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Button } from '@repo/ui/components/ui/button'
import { Breadcrumb } from '@repo/ui/components/ui/breadcrumb'
import {
  CharacterRelationshipGraph,
  type GraphCharacter,
  type GraphRelationship,
} from './components/CharacterRelationshipGraph'

interface CharacterRelationshipsScreenProps {
  character: GraphCharacter
  relationships: GraphRelationship[]
  userId: string
}

export function CharacterRelationshipsScreen({
  character,
  relationships,
  userId,
}: CharacterRelationshipsScreenProps) {
  const { resolvedTheme: theme } = useTheme()

  const backHref = `/${userId}/characters/${character.slug ?? character.id}`

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb
        items={[
          { label: 'My Profile', href: `/${userId}` },
          { label: 'Characters', href: `/${userId}/characters` },
          { label: character.name, href: backHref },
          { label: 'Relationships' },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold">{character.name}</h1>
        <p className="text-muted-foreground text-sm">Relationships</p>
      </div>

      {relationships.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">
            No relationships found for this character.
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Add relationships from the character detail page.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={backHref}>Go to character details</Link>
          </Button>
        </div>
      ) : (
        <CharacterRelationshipGraph
          character={character}
          relationships={relationships}
          userId={userId}
          theme={theme}
        />
      )}
    </div>
  )
}
