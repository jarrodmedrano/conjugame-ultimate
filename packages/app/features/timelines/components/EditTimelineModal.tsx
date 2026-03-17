'use client'

import { useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog'
import type { TimelineFormData } from '../hooks/useTimelineEdit'
import {
  FormWrapper,
  FormField,
  Label,
  Input,
  Textarea,
  ButtonGroup,
  Button,
} from './TimelineForm.styles'
import { ImageUpload } from '../../../components/ImageUpload'
import type { EntityImage } from '../../../types/entity-image'

interface EditTimelineModalProps {
  isOpen: boolean
  formData: TimelineFormData
  onChange: (
    field: keyof TimelineFormData,
    value: string | EntityImage[],
  ) => void
  onSave: () => void
  onCancel: () => void
  theme?: string
  isSaving?: boolean
  timelineId?: number
  userId?: string
}

export function EditTimelineModal({
  isOpen,
  formData,
  onChange,
  onSave,
  onCancel,
  theme,
  isSaving = false,
  timelineId,
  userId,
}: EditTimelineModalProps) {
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 0)
    }
  }, [isOpen])

  const handleImageUpload = async (file: File, isPrimary: boolean) => {
    if (!timelineId) {
      throw new Error('Timeline ID is required for image upload')
    }

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('entityType', 'timeline')
    uploadFormData.append('entityId', timelineId.toString())
    uploadFormData.append('isPrimary', isPrimary.toString())

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: uploadFormData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    const data = await response.json()

    // Update form data with new image
    onChange('images', [...formData.images, data.image])
  }

  const handleImageDelete = async (imageId: number) => {
    const response = await fetch(`/api/delete/image?id=${imageId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Delete failed')
    }

    // Update form data
    onChange(
      'images',
      formData.images.filter((img: EntityImage) => img.id !== imageId),
    )
  }

  const handleSetPrimary = async (imageId: number) => {
    // Update local state
    onChange(
      'images',
      formData.images.map((img: EntityImage) => ({
        ...img,
        isPrimary: img.id === imageId,
      })),
    )
  }

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange('name', event.target.value)
  }

  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    onChange('description', event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }

    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault()
      onSave()
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSave()
  }

  const handleImageGenerated = (image: EntityImage) => {
    onChange('images', [...formData.images, image])
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        data-testid="edit-timeline-modal"
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Edit Timeline</DialogTitle>
        </DialogHeader>

        <FormWrapper
          $theme={theme}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          style={{ border: 'none', padding: 0, background: 'transparent' }}
        >
          <FormField>
            <Label htmlFor="timeline-name" $theme={theme} $required>
              Name
            </Label>
            <Input
              ref={nameInputRef}
              id="timeline-name"
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Enter timeline name"
              $theme={theme}
              required
              data-testid="timeline-name-input"
            />
          </FormField>

          <FormField>
            <Label htmlFor="timeline-description" $theme={theme}>
              Description
            </Label>
            <Textarea
              id="timeline-description"
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Enter timeline description"
              $theme={theme}
              data-testid="timeline-description-input"
            />
          </FormField>

          <FormField>
            <Label htmlFor="timeline-images" $theme={theme}>
              Images (Optional)
            </Label>
            <ImageUpload
              existingImages={formData.images}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              onSetPrimary={handleSetPrimary}
              theme={theme}
              disabled={isSaving}
              entityType="timeline"
              entityId={timelineId}
              entityName={formData.name}
              entityDescription={formData.description}
              userId={userId}
              onImageGenerated={handleImageGenerated}
            />
          </FormField>

          <ButtonGroup>
            <Button
              type="button"
              $variant="secondary"
              $theme={theme}
              onClick={onCancel}
              data-testid="cancel-button"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              $variant="primary"
              $theme={theme}
              data-testid="save-button"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </ButtonGroup>
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
