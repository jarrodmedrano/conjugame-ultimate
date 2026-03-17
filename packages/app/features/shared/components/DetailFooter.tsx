'use client'

import Link from 'next/link'
import { GitFork, Network } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'

interface DetailFooterProps {
  onToggleRelated?: () => void
  showRelated?: boolean
  relationshipMapHref?: string
}

export function DetailFooter({
  onToggleRelated,
  showRelated,
  relationshipMapHref,
}: DetailFooterProps) {
  if (!onToggleRelated && !relationshipMapHref) return null

  return (
    <div className="flex items-center gap-1">
      {onToggleRelated && (
        <Button onClick={onToggleRelated} variant="ghost" size="sm">
          <Network className="h-4 w-4" />
          {showRelated ? 'Hide Related' : 'Show Related'}
        </Button>
      )}

      {relationshipMapHref && (
        <Link href={relationshipMapHref}>
          <Button variant="ghost" size="sm" asChild>
            <GitFork className="h-4 w-4" />
            Family Tree
          </Button>
        </Link>
      )}
    </div>
  )
}
