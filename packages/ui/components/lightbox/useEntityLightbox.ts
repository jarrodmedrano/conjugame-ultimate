import { useState } from 'react'
import type { EntityImage } from '../../../app/types/entity-image'
import type { LightboxImage } from './ImageLightbox.types'

export interface UseEntityLightboxProps {
  images?: EntityImage[]
  entityName: string
}

export interface UseEntityLightboxReturn {
  lightboxState: {
    isOpen: boolean
    currentIndex: number
  }
  handleImageClick: (index: number) => void
  handleLightboxClose: () => void
  lightboxImages: LightboxImage[]
  allImages: EntityImage[]
}

/**
 * Custom hook for managing lightbox state in entity detail components.
 * Handles opening, closing, and image mapping for the ImageLightbox component.
 *
 * @param images - Array of entity images
 * @param entityName - Name of the entity (for alt text)
 * @returns Lightbox state and handlers
 */
export function useEntityLightbox({
  images,
  entityName,
}: UseEntityLightboxProps): UseEntityLightboxReturn {
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    currentIndex: 0,
  })

  const allImages = images || []

  const handleImageClick = (index: number) => {
    setLightboxState({ isOpen: true, currentIndex: index })
  }

  const handleLightboxClose = () => {
    setLightboxState({ isOpen: false, currentIndex: 0 })
  }

  const lightboxImages = allImages.map((img) => ({
    id: img.id,
    url: img.cloudinaryUrl,
    alt: `${entityName} - Image ${img.displayOrder + 1}`,
  }))

  return {
    lightboxState,
    handleImageClick,
    handleLightboxClose,
    lightboxImages,
    allImages,
  }
}
