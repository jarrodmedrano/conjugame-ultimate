'use client'
import type { VerbRow } from '@repo/database'

interface VerbsGridProps {
  verbs: VerbRow[]
}

export function VerbsGrid({ verbs }: VerbsGridProps) {
  if (verbs.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No verbs found.</p>
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {verbs.map((verb) => (
        <div
          key={verb.id}
          className="border rounded-lg p-3 text-center hover:bg-accent transition-colors"
        >
          <p className="font-semibold">{verb.name}</p>
          {verb.infinitive && verb.infinitive !== verb.name && (
            <p className="text-sm text-muted-foreground">{verb.infinitive}</p>
          )}
          <p className="text-xs text-muted-foreground capitalize mt-1">{verb.language}</p>
        </div>
      ))}
    </div>
  )
}
