// packages/app/components/ImageUpload/ImageUpload.tsx
'use client'

import { useRef, useMemo, useState } from 'react'
import { Pin, X, Sparkles } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Spinner } from '@repo/ui/components/ui/spinner'
import { ImageGenerateForm } from '../ImageGenerateForm'
import type { ImageUploadProps, EntityImage } from '../../types/entity-image'

export function ImageUpload({
  existingImages,
  onUpload,
  onDelete,
  onSetPrimary,
  maxImages = 7,
  disabled = false,
  theme,
  entityType,
  entityId,
  entityName = '',
  entityDescription = '',
  userId,
  onImageGenerated,
}: ImageUploadProps) {
  const primaryInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingPrimary, setIsUploadingPrimary] = useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const [generateMode, setGenerateMode] = useState<
    'primary' | 'gallery' | null
  >(null)

  const canGenerate = Boolean(
    entityType && entityId && userId && onImageGenerated,
  )

  const handleGeneratePrimaryClick = () => {
    setGenerateMode('primary')
  }

  const handleGenerateGalleryClick = () => {
    setGenerateMode('gallery')
  }

  const handleGenerateCancel = () => {
    setGenerateMode(null)
  }

  const handleImageGenerated = (image: EntityImage) => {
    setGenerateMode(null)
    onImageGenerated?.(image)
  }

  const primaryImage = useMemo(
    () => existingImages.find((img) => img.isPrimary),
    [existingImages],
  )

  const galleryImages = useMemo(
    () =>
      existingImages
        .filter((img) => !img.isPrimary)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [existingImages],
  )

  const handlePrimaryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingPrimary(true)
    try {
      await onUpload(file, true)
    } finally {
      setIsUploadingPrimary(false)
      event.target.value = '' // Reset input
    }
  }

  const handlePrimaryClick = () => {
    primaryInputRef.current?.click()
  }

  const handleGalleryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files
    if (!files) return

    setIsUploadingGallery(true)
    try {
      for (let i = 0; i < files.length; i++) {
        await onUpload(files[i], false)
      }
    } finally {
      setIsUploadingGallery(false)
      event.target.value = '' // Reset input
    }
  }

  const handleGalleryClick = () => {
    galleryInputRef.current?.click()
  }

  const isGalleryFull = galleryImages.length >= 6

  return (
    <div className="space-y-6">
      {/* Primary Image Section */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Primary Image (Optional)</h3>

        {!primaryImage ? (
          <div className="flex w-full items-center justify-center">
            <div className="bg-neutral-secondary-medium dark:bg-neutral-secondary-dark border-default-strong dark:border-default-medium rounded-base flex h-64 w-full flex-col items-center justify-center border border-dashed">
              <div className="text-body flex flex-col items-center justify-center pb-6 pt-5">
                <svg
                  className="mb-4 h-8 w-8"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 5v9m-5 0H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2M8 9l4-5 4 5m1 8h.01"
                  />
                </svg>
                <p className="text-default dark:text-default-dark mb-2 text-sm">
                  Drop primary image or click below
                </p>
                <p className="text-muted dark:text-muted-dark mb-4 text-xs">
                  Max Size: <span className="font-semibold">2MB</span> (PNG, JPG
                  only)
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handlePrimaryClick}
                    disabled={disabled || isUploadingPrimary}
                    variant="default"
                    size="sm"
                  >
                    {isUploadingPrimary ? (
                      <>
                        <Spinner size="xs" variant="light" className="mr-2" />
                        Uploading...
                      </>
                    ) : (
                      'Browse file'
                    )}
                  </Button>
                  {canGenerate && (
                    <Button
                      type="button"
                      onClick={handleGeneratePrimaryClick}
                      disabled={disabled || isUploadingPrimary}
                      variant="outline"
                      size="sm"
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
                      Generate with AI
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <input
              ref={primaryInputRef}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={handlePrimaryUpload}
              disabled={disabled}
            />
          </div>
        ) : (
          <div className="border-default dark:border-default-dark rounded-base flex items-center gap-4 border p-4">
            <img
              src={primaryImage.cloudinaryUrl}
              alt="Primary"
              className="h-24 w-24 rounded object-cover"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handlePrimaryClick}
                disabled={disabled || isUploadingPrimary}
                variant="outline"
                size="sm"
              >
                {isUploadingPrimary ? (
                  <>
                    <Spinner size="xs" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Change'
                )}
              </Button>
              <Button
                type="button"
                onClick={() => onDelete(primaryImage.id)}
                disabled={disabled || isUploadingPrimary}
                variant="destructive"
                size="sm"
              >
                Remove
              </Button>
            </div>
            <input
              ref={primaryInputRef}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={handlePrimaryUpload}
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* AI generate form for primary image */}
      {generateMode === 'primary' && canGenerate && (
        <ImageGenerateForm
          entityType={entityType!}
          entityName={entityName}
          entityDescription={entityDescription}
          entityId={entityId!}
          isPrimary={true}
          onGenerated={handleImageGenerated}
          onCancel={handleGenerateCancel}
        />
      )}

      {/* Gallery Section */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">
          Gallery Images (Optional, up to 6)
        </h3>

        {/* Existing gallery images grid */}
        {galleryImages.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded border border-gray-200"
              >
                <img
                  src={img.cloudinaryUrl}
                  alt={`Gallery image ${img.displayOrder + 1}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    onClick={() => onSetPrimary(img.id)}
                    disabled={
                      disabled || isUploadingPrimary || isUploadingGallery
                    }
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    aria-label="Set as primary image"
                  >
                    <Pin className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onDelete(img.id)}
                    disabled={
                      disabled || isUploadingPrimary || isUploadingGallery
                    }
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gallery dropzone or full message */}
        {!isGalleryFull ? (
          <div className="flex w-full items-center justify-center">
            <div className="bg-neutral-secondary-medium dark:bg-neutral-secondary-dark border-default-strong dark:border-default-medium rounded-base flex h-48 w-full flex-col items-center justify-center border border-dashed">
              <div className="text-body flex flex-col items-center justify-center pb-6 pt-5">
                <svg
                  className="mb-4 h-8 w-8"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 5v9m-5 0H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2M8 9l4-5 4 5m1 8h.01"
                  />
                </svg>
                <p className="text-default dark:text-default-dark mb-2 text-sm">
                  Drop gallery images or click below
                </p>
                <p className="text-muted dark:text-muted-dark mb-4 text-xs">
                  ({galleryImages.length}/6 images)
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleGalleryClick}
                    disabled={disabled || isUploadingGallery}
                    variant="default"
                    size="sm"
                  >
                    {isUploadingGallery ? (
                      <>
                        <Spinner size="xs" variant="light" className="mr-2" />
                        Uploading...
                      </>
                    ) : (
                      'Browse files'
                    )}
                  </Button>
                  {canGenerate && (
                    <Button
                      type="button"
                      onClick={handleGenerateGalleryClick}
                      disabled={disabled || isUploadingGallery}
                      variant="outline"
                      size="sm"
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
                      Generate with AI
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={handleGalleryUpload}
              disabled={disabled}
              multiple
            />
          </div>
        ) : (
          <div className="text-muted dark:text-muted-dark rounded-base border-default dark:border-default-dark flex items-center justify-center border p-4 text-sm">
            Gallery full (6/6)
          </div>
        )}

        {/* AI generate form for gallery image */}
        {generateMode === 'gallery' && canGenerate && (
          <ImageGenerateForm
            entityType={entityType!}
            entityName={entityName}
            entityDescription={entityDescription}
            entityId={entityId!}
            isPrimary={false}
            onGenerated={handleImageGenerated}
            onCancel={handleGenerateCancel}
          />
        )}
      </div>
    </div>
  )
}
