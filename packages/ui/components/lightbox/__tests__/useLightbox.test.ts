import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLightbox } from '../useLightbox'

describe('useLightbox', () => {
  beforeEach(() => {
    // Reset body overflow before each test
    document.body.style.overflow = ''
  })

  afterEach(() => {
    // Cleanup after each test
    document.body.style.overflow = ''
  })

  describe('initial state', () => {
    it('should start closed', () => {
      const { result } = renderHook(() => useLightbox(5))

      expect(result.current.isOpen).toBe(false)
      expect(result.current.currentIndex).toBe(0)
    })
  })

  describe('open', () => {
    it('should open at specified index', () => {
      const { result } = renderHook(() => useLightbox(5))

      act(() => {
        result.current.open(2)
      })

      expect(result.current.isOpen).toBe(true)
      expect(result.current.currentIndex).toBe(2)
    })

    it('should lock body scroll', () => {
      const { result } = renderHook(() => useLightbox(5))

      act(() => {
        result.current.open(0)
      })

      expect(document.body.style.overflow).toBe('hidden')
    })
  })

  describe('close', () => {
    it('should close lightbox', () => {
      const { result } = renderHook(() => useLightbox(5))

      act(() => {
        result.current.open(0)
      })
      act(() => {
        result.current.close()
      })

      expect(result.current.isOpen).toBe(false)
    })

    it('should restore body scroll', () => {
      const { result } = renderHook(() => useLightbox(5))

      act(() => {
        result.current.open(0)
      })
      act(() => {
        result.current.close()
      })

      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('navigation', () => {
    it('should navigate to next image', () => {
      const { result } = renderHook(() => useLightbox(5))

      act(() => {
        result.current.open(2)
      })
      act(() => {
        result.current.next()
      })

      expect(result.current.currentIndex).toBe(3)
    })

    it('should not go beyond last image', () => {
      const { result } = renderHook(() => useLightbox(5))

      act(() => {
        result.current.open(4)
      })
      act(() => {
        result.current.next()
      })

      expect(result.current.currentIndex).toBe(4)
    })

    it('should navigate to previous image', () => {
      const { result } = renderHook(() => useLightbox(5))

      act(() => {
        result.current.open(2)
      })
      act(() => {
        result.current.prev()
      })

      expect(result.current.currentIndex).toBe(1)
    })

    it('should not go below first image', () => {
      const { result } = renderHook(() => useLightbox(5))

      act(() => {
        result.current.open(0)
      })
      act(() => {
        result.current.prev()
      })

      expect(result.current.currentIndex).toBe(0)
    })
  })

  describe('keyboard events', () => {
    it('should close on Escape key', () => {
      const { result } = renderHook(() => useLightbox(5))

      act(() => {
        result.current.open(0)
      })

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' })
        window.dispatchEvent(event)
      })

      expect(result.current.isOpen).toBe(false)
    })

    it('should navigate on ArrowLeft', () => {
      const { result } = renderHook(() => useLightbox(5))

      act(() => {
        result.current.open(2)
      })

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
        window.dispatchEvent(event)
      })

      expect(result.current.currentIndex).toBe(1)
    })

    it('should navigate on ArrowRight', () => {
      const { result } = renderHook(() => useLightbox(5))

      act(() => {
        result.current.open(2)
      })

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
        window.dispatchEvent(event)
      })

      expect(result.current.currentIndex).toBe(3)
    })

    it('should not listen to keyboard when closed', () => {
      const { result } = renderHook(() => useLightbox(5))

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
        window.dispatchEvent(event)
      })

      expect(result.current.currentIndex).toBe(0)
    })
  })
})
