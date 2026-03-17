'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@repo/ui/components/ui/button'
import type { ImageLightboxProps } from './ImageLightbox.types'

export function ImageLightbox({
  images,
  isOpen,
  initialIndex,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [mounted, setMounted] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  // Track if component is mounted (client-side only)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Sync with initialIndex when lightbox opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Navigation handlers
  const next = useCallback(() => {
    setCurrentIndex((prev) => {
      const newIndex = Math.min(prev + 1, images.length - 1)
      if (onNavigate) onNavigate(newIndex)
      return newIndex
    })
  }, [images.length, onNavigate])

  const prev = useCallback(() => {
    setCurrentIndex((prev) => {
      const newIndex = Math.max(prev - 1, 0)
      if (onNavigate) onNavigate(newIndex)
      return newIndex
    })
  }, [onNavigate])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, prev, next])

  // Handle image errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/placeholder-image.png'
    console.error('Failed to load image:', images[currentIndex]?.url)
  }

  // Handle swipe gestures
  useEffect(() => {
    if (!isOpen) return

    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX
      const swipeDistance = touchStartX - touchEndX
      const minSwipeDistance = 50

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0 && currentIndex < images.length - 1) {
          next()
        } else if (swipeDistance < 0 && currentIndex > 0) {
          prev()
        }
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isOpen, currentIndex, images.length, next, prev])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Empty gallery
  if (!images || images.length === 0) return null

  // Not open or not mounted (SSR safety)
  if (!mounted || !isOpen) return null

  const currentImage = images[currentIndex]
  const isFirstImage = currentIndex === 0
  const isLastImage = currentIndex === images.length - 1
  const isSingleImage = images.length === 1

  return createPortal(
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/90 duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 text-white hover:bg-white/20 focus:ring-white md:h-8 md:w-8"
        aria-label="Close lightbox"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </Button>

      {/* Previous button */}
      {!isSingleImage && (
        <Button
          onClick={prev}
          disabled={isFirstImage}
          variant="ghost"
          size="icon"
          className="absolute left-4 z-10 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 focus:ring-white disabled:cursor-not-allowed disabled:opacity-50 md:left-8 md:opacity-0 md:hover:opacity-100"
          aria-label="Previous image"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Button>
      )}

      {/* Image container */}
      <div className="relative mx-4 flex max-h-[90vh] max-w-[90vw] items-center justify-center">
        <img
          ref={imageRef}
          src={currentImage.url}
          alt={currentImage.alt}
          className="max-h-[90vh] max-w-[90vw] object-contain transition-opacity duration-150"
          style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
          onError={handleImageError}
        />
      </div>

      {/* Next button */}
      {!isSingleImage && (
        <Button
          onClick={next}
          disabled={isLastImage}
          variant="ghost"
          size="icon"
          className="absolute right-4 z-10 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 focus:ring-white disabled:cursor-not-allowed disabled:opacity-50 md:right-8 md:opacity-0 md:hover:opacity-100"
          aria-label="Next image"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      )}

      {/* Image counter */}
      {!isSingleImage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body,
  )
}
