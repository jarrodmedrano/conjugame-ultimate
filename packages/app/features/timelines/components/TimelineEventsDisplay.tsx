'use client'

import { useCallback } from 'react'
import { Calendar, Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { renderDescription } from './EventDetailModal'

export interface TimelineEvent {
  id: number
  timelineId: number
  eventDate: string
  title: string
  description: string | null
  orderIndex: number
}

interface TimelineEventsDisplayProps {
  events: TimelineEvent[]
  isOwner: boolean
  theme?: string
  userId?: string
  onReadMore: (event: TimelineEvent) => void
  onAddEvent?: () => void
  onEditEvent?: (event: TimelineEvent) => void
  onDeleteEvent?: (eventId: number) => void
}

function stripMarkdown(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

function descriptionPreview(
  text: string,
  max: number,
  userId?: string,
): React.ReactNode {
  const plain = stripMarkdown(text)
  if (plain.length <= max) return renderDescription(text, userId)
  return `${plain.substring(0, max)}...`
}

export function TimelineEventsDisplay({
  events,
  isOwner,
  theme,
  userId,
  onReadMore,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}: TimelineEventsDisplayProps) {
  const handleReadMore = useCallback(
    (event: TimelineEvent) => () => onReadMore(event),
    [onReadMore],
  )

  const handleEdit = useCallback(
    (event: TimelineEvent) => (e: React.MouseEvent) => {
      e.stopPropagation()
      onEditEvent?.(event)
    },
    [onEditEvent],
  )

  const handleDelete = useCallback(
    (eventId: number) => (e: React.MouseEvent) => {
      e.stopPropagation()
      onDeleteEvent?.(eventId)
    },
    [onDeleteEvent],
  )

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Events</h2>
        {isOwner && (
          <Button variant="outline" size="sm" onClick={onAddEvent}>
            <Plus className="mr-1 h-4 w-4" />
            Add Event
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm">No events yet.</p>
      ) : (
        <ol className="items-start sm:flex sm:flex-wrap">
          {events.map((event, index) => (
            <li
              key={event.id}
              className="relative mb-8 sm:mb-0 sm:min-w-[200px] sm:max-w-[280px] sm:flex-1"
            >
              <div className="flex items-center">
                <div className="bg-primary/10 ring-background z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-0 sm:ring-8">
                  <Calendar
                    className="text-primary h-3 w-3"
                    aria-hidden="true"
                  />
                </div>
                {index < events.length - 1 && (
                  <div className="bg-border hidden h-px w-full sm:flex" />
                )}
              </div>

              <div className="mt-3 sm:pe-8">
                <time className="bg-muted inline-block rounded border px-1.5 py-0.5 text-xs font-medium">
                  {event.eventDate}
                </time>
                <h3 className="my-2 text-base font-semibold">{event.title}</h3>
                {event.description && (
                  <div className="text-muted-foreground mb-3 text-sm">
                    {descriptionPreview(event.description, 120, userId)}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReadMore(event)}
                  >
                    Read more
                  </Button>

                  {isOwner && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleEdit(event)}
                        aria-label={`Edit ${event.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={handleDelete(event.id)}
                        aria-label={`Delete ${event.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
