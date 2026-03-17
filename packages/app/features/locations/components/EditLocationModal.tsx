'use client'

import { useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog'
import type { LocationFormData } from '../hooks/useLocationEdit'
import {
  FormWrapper,
  FormField,
  Label,
  Input,
  Textarea,
  ButtonGroup,
  Button,
} from './LocationForm.styles'
import { ImageUpload } from '../../../components/ImageUpload'
import type { EntityImage } from '../../../types/entity-image'
import { LocationAttributeEditor } from './LocationAttributeEditor'
import type { LocationAttribute } from '@repo/database'
import { useCallback } from 'react'

interface EditLocationModalProps {
  isOpen: boolean
  formData: LocationFormData
  onChange: (
    field: keyof LocationFormData,
    value: string | EntityImage[] | LocationAttribute[],
  ) => void
  onSave: () => void
  onCancel: () => void
  theme?: string
  isSaving?: boolean
  locationId?: number
  userId?: string
}

export function EditLocationModal({
  isOpen,
  formData,
  onChange,
  onSave,
  onCancel,
  theme,
  isSaving = false,
  locationId,
  userId,
}: EditLocationModalProps) {
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleAttributesChange = useCallback(
    (updated: LocationAttribute[]) => {
      onChange('attributes', updated)
    },
    [onChange],
  )

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 0)
    }
  }, [isOpen])

  const handleImageUpload = async (file: File, isPrimary: boolean) => {
    if (!locationId) {
      throw new Error('Location ID is required for image upload')
    }

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('entityType', 'location')
    uploadFormData.append('entityId', locationId.toString())
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
        data-testid="edit-location-modal"
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Edit Location</DialogTitle>
        </DialogHeader>

        <FormWrapper
          $theme={theme}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          style={{ border: 'none', padding: 0, background: 'transparent' }}
        >
          <FormField>
            <Label htmlFor="location-name" $theme={theme} $required>
              Name
            </Label>
            <Input
              ref={nameInputRef}
              id="location-name"
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Enter location name"
              $theme={theme}
              required
              data-testid="location-name-input"
            />
          </FormField>

          <FormField>
            <Label htmlFor="location-description" $theme={theme}>
              Description
            </Label>
            <Textarea
              id="location-description"
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Enter location description"
              $theme={theme}
              data-testid="location-description-input"
            />
          </FormField>

          <FormField>
            <Label htmlFor="location-images" $theme={theme}>
              Images (Optional)
            </Label>
            <ImageUpload
              existingImages={formData.images}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              onSetPrimary={handleSetPrimary}
              theme={theme}
              disabled={isSaving}
              entityType="location"
              entityId={locationId}
              entityName={formData.name}
              entityDescription={formData.description}
              userId={userId}
              onImageGenerated={handleImageGenerated}
            />
          </FormField>

          <FormField>
            <Label $theme={theme}>Attributes</Label>
            {locationId !== undefined && (
              <LocationAttributeEditor
                locationId={locationId}
                attributes={formData.attributes}
                onAttributesChange={handleAttributesChange}
                theme={theme}
                disabled={isSaving}
              />
            )}
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
