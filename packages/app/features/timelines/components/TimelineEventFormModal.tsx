'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Textarea } from '@repo/ui/components/ui/textarea'
import type { TimelineEvent } from './TimelineEventsDisplay'

interface TimelineEventFormModalProps {
  isOpen: boolean
  event?: TimelineEvent | null
  onClose: () => void
  onSave: (data: {
    eventDate: string
    title: string
    description: string | null
    orderIndex: number
  }) => Promise<void>
  isSaving?: boolean
}

interface FormState {
  eventDate: string
  title: string
  description: string
}

function emptyForm(): FormState {
  return { eventDate: '', title: '', description: '' }
}

function formFromEvent(event: TimelineEvent): FormState {
  return {
    eventDate: event.eventDate,
    title: event.title,
    description: event.description ?? '',
  }
}

export function TimelineEventFormModal({
  isOpen,
  event,
  onClose,
  onSave,
  isSaving = false,
}: TimelineEventFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (isOpen) {
      setForm(event ? formFromEvent(event) : emptyForm())
    }
  }, [isOpen, event])

  const handleChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }))
      },
    [],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      await onSave({
        eventDate: form.eventDate.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        orderIndex: event?.orderIndex ?? 0,
      })
    },
    [form, event, onSave],
  )

  const isEdit = Boolean(event)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Event' : 'Add Event'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="event-date" className="text-sm font-medium">
              Date <span className="text-destructive">*</span>
            </label>
            <Input
              id="event-date"
              value={form.eventDate}
              onChange={handleChange('eventDate')}
              placeholder="e.g. January 1st, 2025 or Year 342 of the Third Age"
              required
              disabled={isSaving}
            />
            <p className="text-muted-foreground text-xs">
              Any date format works — including fictional dates.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="event-title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="event-title"
              value={form.title}
              onChange={handleChange('title')}
              placeholder="Event title"
              required
              disabled={isSaving}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="event-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="event-description"
              value={form.description}
              onChange={handleChange('description')}
              placeholder="Describe the event. Link to entities using [Label](/characters/slug) syntax."
              rows={5}
              disabled={isSaving}
            />
            <p className="text-muted-foreground text-xs">
              Use{' '}
              <code className="bg-muted rounded px-1 py-0.5">
                [Name](/characters/slug)
              </code>{' '}
              to link to characters, locations, or stories.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSaving || !form.eventDate.trim() || !form.title.trim()
              }
            >
              {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
