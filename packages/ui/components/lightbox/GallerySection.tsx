'use client'

import type { EntityImage } from '../../../app/types/entity-image'

export interface GallerySectionProps {
  images: EntityImage[]
  onImageClick: (imageId: number) => void
  testId?: string
}

/**
 * Reusable gallery section component for entity detail pages.
 * Renders a grid of gallery thumbnails with click handlers for lightbox integration.
 */
export function GallerySection({
  images,
  onImageClick,
  testId = 'gallery-grid',
}: GallerySectionProps) {
  if (images.length === 0) {
    return null
  }

  return (
    <aside className="w-64">
      <h3 className="text-default dark:text-default-dark mb-3 text-sm font-semibold">
        Gallery
      </h3>
      <div className="grid grid-cols-2 gap-2" data-testid={testId}>
        {images.map((img) => (
          <img
            key={img.id}
            src={img.cloudinaryUrl}
            alt={`Gallery image ${img.displayOrder + 1}`}
            className="aspect-square w-full cursor-pointer rounded object-cover transition-opacity hover:opacity-80"
            data-testid="gallery-thumbnail"
            onClick={() => onImageClick(img.id)}
          />
        ))}
      </div>
    </aside>
  )
}
