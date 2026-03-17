'use client'

import { useState, useCallback } from 'react'
import {
  ImageLightbox,
  useEntityLightbox,
  GallerySection,
} from '@repo/ui/components/lightbox'
import { DetailHeader, DetailFooter } from '../../shared/components'
import type { EntityImage } from '../../../types/entity-image'
import { DetailWrapper, Content } from '@repo/ui/components/detail'
import { TimelineEventsDisplay } from './TimelineEventsDisplay'
import { EventDetailModal } from './EventDetailModal'
import { TimelineEventFormModal } from './TimelineEventFormModal'
import type { TimelineEvent } from './TimelineEventsDisplay'

interface Timeline {
  id: number
  name: string
  description: string | null
  privacy: 'public' | 'private'
  userid: string
  createdAt: Date | null
  updatedAt: Date | null
}

interface TimelineDetailProps {
  timeline: Timeline
  userId: string
  isOwner: boolean
  images?: EntityImage[]
  events?: TimelineEvent[]
  relationshipMapHref?: string
  onEdit?: () => void
  onDelete?: () => void
  onTogglePrivacy?: () => void
  onToggleRelated?: () => void
  showRelated?: boolean
  theme?: string
  onCreateEvent?: (data: {
    eventDate: string
    title: string
    description: string | null
  }) => Promise<{ success: boolean; error?: string }>
  onUpdateEvent?: (data: {
    id: number
    eventDate: string
    title: string
    description: string | null
    orderIndex: number
  }) => Promise<{ success: boolean; error?: string }>
  onDeleteEvent?: (id: number) => Promise<{ success: boolean; error?: string }>
}

export function TimelineDetail({
  timeline,
  userId,
  isOwner,
  images,
  events = [],
  relationshipMapHref,
  onEdit,
  onDelete,
  onTogglePrivacy,
  onToggleRelated,
  showRelated,
  theme,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}: TimelineDetailProps) {
  const primaryImage = images?.find((img) => img.isPrimary)
  const galleryImages = images?.filter((img) => !img.isPrimary) || []

  const [readMoreEvent, setReadMoreEvent] = useState<TimelineEvent | null>(null)
  const [editingEvent, setEditingEvent] = useState<
    TimelineEvent | null | undefined
  >(undefined)
  const [isSavingEvent, setIsSavingEvent] = useState(false)

  const isFormOpen = editingEvent !== undefined

  const {
    lightboxState,
    handleImageClick,
    handleLightboxClose,
    lightboxImages,
    allImages,
  } = useEntityLightbox({
    images,
    entityName: timeline.name,
  })

  const handleReadMore = useCallback((event: TimelineEvent) => {
    setReadMoreEvent(event)
  }, [])

  const handleAddEvent = useCallback(() => {
    setEditingEvent(null)
  }, [])

  const handleEditEvent = useCallback((event: TimelineEvent) => {
    setEditingEvent(event)
  }, [])

  const handleCloseForm = useCallback(() => {
    setEditingEvent(undefined)
  }, [])

  const handleCloseReadMore = useCallback(() => {
    setReadMoreEvent(null)
  }, [])

  const handleSaveEvent = useCallback(
    async (data: {
      eventDate: string
      title: string
      description: string | null
      orderIndex: number
    }) => {
      setIsSavingEvent(true)
      try {
        if (editingEvent?.id) {
          await onUpdateEvent?.({
            id: editingEvent.id,
            ...data,
          })
        } else {
          await onCreateEvent?.(data)
        }
        setEditingEvent(undefined)
      } finally {
        setIsSavingEvent(false)
      }
    },
    [editingEvent, onCreateEvent, onUpdateEvent],
  )

  const handleDeleteEvent = useCallback(
    async (eventId: number) => {
      await onDeleteEvent?.(eventId)
    },
    [onDeleteEvent],
  )

  return (
    <DetailWrapper data-testid="timeline-detail">
      <div className="flex gap-6">
        {/* Main content area */}
        <div className="flex-1">
          <DetailHeader
            title={timeline.name}
            entityType="timeline"
            userId={userId}
            privacy={timeline.privacy}
            createdAt={timeline.createdAt}
            updatedAt={timeline.updatedAt}
            primaryImageUrl={primaryImage?.cloudinaryUrl}
            primaryImageAlt={timeline.name}
            isOwner={isOwner}
            theme={theme}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePrivacy={onTogglePrivacy}
          />
          <Content $theme={theme} data-testid="timeline-content">
            {timeline.description || 'No description provided'}
          </Content>

          <TimelineEventsDisplay
            events={events}
            isOwner={isOwner}
            theme={theme}
            userId={userId}
            onReadMore={handleReadMore}
            onAddEvent={handleAddEvent}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />

          <DetailFooter
            onToggleRelated={onToggleRelated}
            showRelated={showRelated}
            relationshipMapHref={relationshipMapHref}
          />
        </div>

        {/* Sidebar gallery */}
        <GallerySection
          images={galleryImages}
          onImageClick={(imageId) => {
            const imageIndex = allImages.findIndex((i) => i.id === imageId)
            if (imageIndex !== -1) {
              handleImageClick(imageIndex)
            }
          }}
        />
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        isOpen={lightboxState.isOpen}
        initialIndex={lightboxState.currentIndex}
        onClose={handleLightboxClose}
      />

      <EventDetailModal
        event={readMoreEvent}
        isOpen={readMoreEvent !== null}
        onClose={handleCloseReadMore}
        userId={userId}
      />

      <TimelineEventFormModal
        isOpen={isFormOpen}
        event={editingEvent}
        onClose={handleCloseForm}
        onSave={handleSaveEvent}
        isSaving={isSavingEvent}
      />
    </DetailWrapper>
  )
}
