'use client'
import type { VerbRow } from '@repo/database'

interface VerbsGridProps {
  verbs: VerbRow[]
}

export function VerbsGrid({ verbs }: VerbsGridProps) {
  if (verbs.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">No verbs found.</p>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {verbs.map((verb) => (
        <div
          key={verb.id}
          className="hover:bg-accent rounded-lg border p-3 text-center transition-colors"
        >
          <p className="font-semibold">{verb.name}</p>
          {verb.infinitive && verb.infinitive !== verb.name && (
            <p className="text-muted-foreground text-sm">{verb.infinitive}</p>
          )}
          <p className="text-muted-foreground mt-1 text-xs capitalize">
            {verb.language}
          </p>
        </div>
      ))}
    </div>
  )
}
