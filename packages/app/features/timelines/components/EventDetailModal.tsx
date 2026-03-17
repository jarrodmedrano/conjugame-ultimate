'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog'
import type { TimelineEvent } from './TimelineEventsDisplay'

interface EventDetailModalProps {
  event: TimelineEvent | null
  isOpen: boolean
  onClose: () => void
  userId?: string
}

// Renders description text, converting [label](url) markdown links to anchor tags.
// Relative URLs like /characters/slug are prefixed with userId automatically.
// Only internal (relative) URLs are rendered as links.
export function renderDescription(
  text: string,
  userId?: string,
): React.ReactNode[] {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (match) {
      const [, label, url] = match
      const isInternal = url.startsWith('/')
      if (isInternal) {
        const href =
          userId && !url.startsWith(`/${userId}/`) ? `/${userId}${url}` : url
        return (
          <a
            key={i}
            href={href}
            className="text-primary underline hover:opacity-80"
          >
            {label}
          </a>
        )
      }
      return <span key={i}>{label}</span>
    }
    return <span key={i}>{part}</span>
  })
}

export function EventDetailModal({
  event,
  isOpen,
  onClose,
  userId,
}: EventDetailModalProps) {
  if (!event) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <time className="bg-muted inline-block rounded border px-1.5 py-0.5 text-xs font-medium">
          {event.eventDate}
        </time>

        {event.description ? (
          <div className="text-muted-foreground mt-2 whitespace-pre-wrap text-sm leading-relaxed">
            {renderDescription(event.description, userId)}
          </div>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm">
            No description provided.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
