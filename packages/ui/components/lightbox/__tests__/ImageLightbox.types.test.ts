import { describe, it, expect } from 'vitest'
import type { LightboxImage, ImageLightboxProps } from '../ImageLightbox.types'

describe('ImageLightbox Types', () => {
  describe('LightboxImage', () => {
    it('should accept valid image object', () => {
      const validImage: LightboxImage = {
        id: 1,
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
      }

      expect(validImage.id).toBe(1)
      expect(validImage.url).toBe('https://example.com/image.jpg')
      expect(validImage.alt).toBe('Test image')
    })
  })

  describe('ImageLightboxProps', () => {
    it('should accept valid props', () => {
      const validProps: ImageLightboxProps = {
        images: [
          { id: 1, url: '/img1.jpg', alt: 'Image 1' },
          { id: 2, url: '/img2.jpg', alt: 'Image 2' },
        ],
        isOpen: true,
        initialIndex: 0,
        onClose: () => {},
        onNavigate: () => {},
      }

      expect(validProps.images).toHaveLength(2)
      expect(validProps.isOpen).toBe(true)
      expect(validProps.initialIndex).toBe(0)
      expect(typeof validProps.onClose).toBe('function')
      expect(typeof validProps.onNavigate).toBe('function')
    })

    it('should accept props without optional onNavigate', () => {
      const propsWithoutNavigate: ImageLightboxProps = {
        images: [],
        isOpen: false,
        initialIndex: 0,
        onClose: () => {},
      }

      expect(propsWithoutNavigate.onNavigate).toBeUndefined()
    })
  })
})
