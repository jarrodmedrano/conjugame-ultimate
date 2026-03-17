# Gallery Lightbox Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full-screen image lightbox to entity gallery pages allowing users to view and navigate through images with keyboard, mouse, and touch controls.

**Architecture:** Portal-based lightbox component in `packages/ui` with custom hook for state management. Integration into entity detail components in `packages/app` via click handlers on gallery thumbnails. Tailwind CSS for styling with responsive design.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest for testing, React Portals for rendering

---

## Task 1: Create TypeScript Interfaces

**Files:**

- Create: `packages/ui/components/lightbox/ImageLightbox.types.ts`
- Create: `packages/ui/components/lightbox/index.ts`

**Step 1: Write the failing test**

Create test file first (TDD approach):

```bash
mkdir -p packages/ui/components/lightbox/__tests__
```

Create `packages/ui/components/lightbox/__tests__/ImageLightbox.types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type { ImageLightboxProps, LightboxImage } from '../ImageLightbox.types'

describe('ImageLightbox Types', () => {
  describe('LightboxImage', () => {
    it('should accept valid image object', () => {
      const image: LightboxImage = {
        id: 1,
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
      }

      expect(image.id).toBe(1)
      expect(image.url).toBe('https://example.com/image.jpg')
      expect(image.alt).toBe('Test image')
    })
  })

  describe('ImageLightboxProps', () => {
    it('should accept valid props', () => {
      const props: ImageLightboxProps = {
        images: [
          { id: 1, url: 'https://example.com/1.jpg', alt: 'Image 1' },
          { id: 2, url: 'https://example.com/2.jpg', alt: 'Image 2' },
        ],
        isOpen: true,
        initialIndex: 0,
        onClose: () => {},
      }

      expect(props.images).toHaveLength(2)
      expect(props.isOpen).toBe(true)
      expect(props.initialIndex).toBe(0)
      expect(typeof props.onClose).toBe('function')
    })

    it('should accept optional onNavigate callback', () => {
      const props: ImageLightboxProps = {
        images: [],
        isOpen: false,
        initialIndex: 0,
        onClose: () => {},
        onNavigate: (index: number) => {},
      }

      expect(typeof props.onNavigate).toBe('function')
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/ImageLightbox.types.test.ts
```

Expected: FAIL with "Cannot find module '../ImageLightbox.types'"

**Step 3: Write minimal implementation**

Create `packages/ui/components/lightbox/ImageLightbox.types.ts`:

```typescript
export interface LightboxImage {
  id: number
  url: string
  alt: string
}

export interface ImageLightboxProps {
  images: LightboxImage[]
  isOpen: boolean
  initialIndex: number
  onClose: () => void
  onNavigate?: (index: number) => void
}
```

**Step 4: Run test to verify it passes**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/ImageLightbox.types.test.ts
```

Expected: PASS (all tests green)

**Step 5: Create index exports**

Create `packages/ui/components/lightbox/index.ts`:

```typescript
export { ImageLightbox } from './ImageLightbox'
export type { ImageLightboxProps, LightboxImage } from './ImageLightbox.types'
```

**Step 6: Commit**

```bash
git add packages/ui/components/lightbox/
git commit -m "feat(ui): add ImageLightbox TypeScript interfaces and test structure

- Add LightboxImage and ImageLightboxProps types
- Add unit tests for type validation
- Set up component folder structure
- Add public exports via index.ts

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create useLightbox Hook

**Files:**

- Create: `packages/ui/components/lightbox/useLightbox.ts`
- Create: `packages/ui/components/lightbox/__tests__/useLightbox.test.ts`

**Step 1: Write the failing test**

Create `packages/ui/components/lightbox/__tests__/useLightbox.test.ts`:

```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/useLightbox.test.ts
```

Expected: FAIL with "Cannot find module '../useLightbox'" or "@testing-library/react not found"

**Step 3: Install testing dependencies if needed**

```bash
cd packages/ui
pnpm add -D @testing-library/react @testing-library/react-hooks
```

**Step 4: Write minimal implementation**

Create `packages/ui/components/lightbox/useLightbox.ts`:

```typescript
import { useState, useCallback, useEffect } from 'react'

export function useLightbox(totalImages: number) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const open = useCallback((index: number) => {
    setCurrentIndex(index)
    setIsOpen(true)
    document.body.style.overflow = 'hidden'
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    document.body.style.overflow = ''
  }, [])

  const next = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalImages - 1))
  }, [totalImages])

  const prev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close, prev, next])

  return { isOpen, currentIndex, open, close, next, prev }
}
```

**Step 5: Run test to verify it passes**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/useLightbox.test.ts
```

Expected: PASS (all tests green)

**Step 6: Commit**

```bash
git add packages/ui/components/lightbox/useLightbox.ts packages/ui/components/lightbox/__tests__/useLightbox.test.ts packages/ui/package.json
git commit -m "feat(ui): add useLightbox hook with keyboard navigation

- Implement open/close with body scroll lock
- Add prev/next navigation with boundaries
- Add keyboard event handling (Escape, Arrow keys)
- Add comprehensive unit tests
- Install @testing-library/react for hook testing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create ImageLightbox Component (Structure)

**Files:**

- Create: `packages/ui/components/lightbox/ImageLightbox.tsx`
- Create: `packages/ui/components/lightbox/__tests__/ImageLightbox.test.tsx`

**Step 1: Write the failing test**

Create `packages/ui/components/lightbox/__tests__/ImageLightbox.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ImageLightbox } from '../ImageLightbox'
import type { ImageLightboxProps } from '../ImageLightbox.types'

describe('ImageLightbox', () => {
  const mockImages = [
    { id: 1, url: 'https://example.com/1.jpg', alt: 'Image 1' },
    { id: 2, url: 'https://example.com/2.jpg', alt: 'Image 2' },
    { id: 3, url: 'https://example.com/3.jpg', alt: 'Image 3' }
  ]

  const defaultProps: ImageLightboxProps = {
    images: mockImages,
    isOpen: true,
    initialIndex: 0,
    onClose: vi.fn()
  }

  describe('rendering', () => {
    it('should not render when closed', () => {
      render(<ImageLightbox {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render when open', () => {
      render(<ImageLightbox {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should render with aria-modal attribute', () => {
      render(<ImageLightbox {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })
  })

  describe('empty images', () => {
    it('should not render with empty images array', () => {
      render(<ImageLightbox {...defaultProps} images={[]} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('current image', () => {
    it('should display image at initial index', () => {
      render(<ImageLightbox {...defaultProps} initialIndex={1} />)

      const img = screen.getByAltText('Image 2')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/2.jpg')
    })

    it('should clamp invalid initial index to valid range', () => {
      render(<ImageLightbox {...defaultProps} initialIndex={999} />)

      // Should show last image (index 2)
      const img = screen.getByAltText('Image 3')
      expect(img).toBeInTheDocument()
    })

    it('should clamp negative initial index to 0', () => {
      render(<ImageLightbox {...defaultProps} initialIndex={-5} />)

      // Should show first image (index 0)
      const img = screen.getByAltText('Image 1')
      expect(img).toBeInTheDocument()
    })
  })

  describe('image counter', () => {
    it('should display current position', () => {
      render(<ImageLightbox {...defaultProps} initialIndex={1} />)

      expect(screen.getByText('2 / 3')).toBeInTheDocument()
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/ImageLightbox.test.tsx
```

Expected: FAIL with "Cannot find module '../ImageLightbox'"

**Step 3: Write minimal implementation**

Create `packages/ui/components/lightbox/ImageLightbox.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ImageLightboxProps } from './ImageLightbox.types'

export function ImageLightbox({
  images,
  isOpen,
  initialIndex,
  onClose,
  onNavigate
}: ImageLightboxProps) {
  // Don't render if closed or no images
  if (!isOpen || !images || images.length === 0) {
    return null
  }

  // Clamp initial index to valid range
  const safeIndex = Math.max(0, Math.min(initialIndex, images.length - 1))
  const [currentIndex, setCurrentIndex] = useState(safeIndex)

  // Sync with initialIndex changes
  useEffect(() => {
    setCurrentIndex(safeIndex)
  }, [safeIndex])

  const currentImage = images[currentIndex]
  const totalImages = images.length

  // Portal rendering - render to document.body
  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      className="fixed inset-0 z-50 bg-black/90"
    >
      {/* Image container */}
      <div className="flex h-full w-full items-center justify-center p-4">
        <img
          src={currentImage.url}
          alt={currentImage.alt}
          className="max-h-[90vh] max-w-[90vw] object-contain"
        />
      </div>

      {/* Image counter */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white">
        {currentIndex + 1} / {totalImages}
      </div>
    </div>
  )

  // Use portal to render outside component tree
  return createPortal(content, document.body)
}
```

**Step 4: Run test to verify it passes**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/ImageLightbox.test.tsx
```

Expected: PASS (all tests green)

**Step 5: Commit**

```bash
git add packages/ui/components/lightbox/ImageLightbox.tsx packages/ui/components/lightbox/__tests__/ImageLightbox.test.tsx
git commit -m "feat(ui): add ImageLightbox component structure with portal rendering

- Add portal-based rendering to document.body
- Implement safe index clamping for boundary protection
- Add image display with responsive sizing
- Add image counter display
- Add comprehensive rendering tests
- Handle empty images array

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Add Close Button and Backdrop Click

**Files:**

- Modify: `packages/ui/components/lightbox/ImageLightbox.tsx`
- Modify: `packages/ui/components/lightbox/__tests__/ImageLightbox.test.tsx`

**Step 1: Write the failing test**

Add to `packages/ui/components/lightbox/__tests__/ImageLightbox.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'

// Add new test suite at the end of the file
describe('closing', () => {
  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<ImageLightbox {...defaultProps} onClose={onClose} />)

    const closeButton = screen.getByLabelText('Close lightbox')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when backdrop clicked', () => {
    const onClose = vi.fn()
    render(<ImageLightbox {...defaultProps} onClose={onClose} />)

    const backdrop = screen.getByRole('dialog')
    fireEvent.click(backdrop)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not close when clicking on image', () => {
    const onClose = vi.fn()
    render(<ImageLightbox {...defaultProps} />)

    const image = screen.getByAltText('Image 1')
    fireEvent.click(image)

    expect(onClose).not.toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/ImageLightbox.test.tsx
```

Expected: FAIL with "Unable to find element with label 'Close lightbox'"

**Step 3: Implement close button and backdrop click**

Modify `packages/ui/components/lightbox/ImageLightbox.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { ImageLightboxProps } from './ImageLightbox.types'

export function ImageLightbox({
  images,
  isOpen,
  initialIndex,
  onClose,
  onNavigate
}: ImageLightboxProps) {
  if (!isOpen || !images || images.length === 0) {
    return null
  }

  const safeIndex = Math.max(0, Math.min(initialIndex, images.length - 1))
  const [currentIndex, setCurrentIndex] = useState(safeIndex)

  useEffect(() => {
    setCurrentIndex(safeIndex)
  }, [safeIndex])

  const currentImage = images[currentIndex]
  const totalImages = images.length

  // Handle backdrop click (only close if clicking backdrop, not image)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      className="fixed inset-0 z-50 bg-black/90"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close lightbox"
        className="fixed right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Image container */}
      <div className="flex h-full w-full items-center justify-center p-4">
        <img
          src={currentImage.url}
          alt={currentImage.alt}
          className="max-h-[90vh] max-w-[90vw] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Image counter */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white">
        {currentIndex + 1} / {totalImages}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
```

**Step 4: Run test to verify it passes**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/ImageLightbox.test.tsx
```

Expected: PASS (all tests green)

**Step 5: Commit**

```bash
git add packages/ui/components/lightbox/ImageLightbox.tsx packages/ui/components/lightbox/__tests__/ImageLightbox.test.tsx
git commit -m "feat(ui): add close button and backdrop click handling

- Add X close button in top-right corner
- Handle backdrop click to close (image clicks don't close)
- Add lucide-react icon for close button
- Add hover effects on close button
- Add tests for close interactions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add Navigation Arrows

**Files:**

- Modify: `packages/ui/components/lightbox/ImageLightbox.tsx`
- Modify: `packages/ui/components/lightbox/__tests__/ImageLightbox.test.tsx`

**Step 1: Write the failing test**

Add to test file:

```typescript
describe('navigation arrows', () => {
  it('should show prev and next buttons', () => {
    render(<ImageLightbox {...defaultProps} initialIndex={1} />)

    expect(screen.getByLabelText('Previous image')).toBeInTheDocument()
    expect(screen.getByLabelText('Next image')).toBeInTheDocument()
  })

  it('should navigate to previous image when prev clicked', () => {
    const onNavigate = vi.fn()
    render(<ImageLightbox {...defaultProps} initialIndex={1} onNavigate={onNavigate} />)

    const prevButton = screen.getByLabelText('Previous image')
    fireEvent.click(prevButton)

    // Should now show Image 1
    expect(screen.getByAltText('Image 1')).toBeInTheDocument()
    expect(onNavigate).toHaveBeenCalledWith(0)
  })

  it('should navigate to next image when next clicked', () => {
    const onNavigate = vi.fn()
    render(<ImageLightbox {...defaultProps} initialIndex={1} onNavigate={onNavigate} />)

    const nextButton = screen.getByLabelText('Next image')
    fireEvent.click(nextButton)

    // Should now show Image 3
    expect(screen.getByAltText('Image 3')).toBeInTheDocument()
    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it('should disable prev button on first image', () => {
    render(<ImageLightbox {...defaultProps} initialIndex={0} />)

    const prevButton = screen.getByLabelText('Previous image')
    expect(prevButton).toBeDisabled()
  })

  it('should disable next button on last image', () => {
    render(<ImageLightbox {...defaultProps} initialIndex={2} />)

    const nextButton = screen.getByLabelText('Next image')
    expect(nextButton).toBeDisabled()
  })

  it('should hide navigation arrows for single image', () => {
    const singleImage = [mockImages[0]]
    render(<ImageLightbox {...defaultProps} images={singleImage} />)

    expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/ImageLightbox.test.tsx
```

Expected: FAIL with "Unable to find element with label 'Previous image'"

**Step 3: Implement navigation arrows**

Modify `packages/ui/components/lightbox/ImageLightbox.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ImageLightboxProps } from './ImageLightbox.types'

export function ImageLightbox({
  images,
  isOpen,
  initialIndex,
  onClose,
  onNavigate
}: ImageLightboxProps) {
  if (!isOpen || !images || images.length === 0) {
    return null
  }

  const safeIndex = Math.max(0, Math.min(initialIndex, images.length - 1))
  const [currentIndex, setCurrentIndex] = useState(safeIndex)

  useEffect(() => {
    setCurrentIndex(safeIndex)
  }, [safeIndex])

  const currentImage = images[currentIndex]
  const totalImages = images.length

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < totalImages - 1
  const showNavigation = totalImages > 1

  const handlePrev = () => {
    if (canGoPrev) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      onNavigate?.(newIndex)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      onNavigate?.(newIndex)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      className="fixed inset-0 z-50 bg-black/90"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close lightbox"
        className="fixed right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Previous button */}
      {showNavigation && (
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          aria-label="Previous image"
          className="fixed left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed md:opacity-0 md:hover:opacity-100"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Next button */}
      {showNavigation && (
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Next image"
          className="fixed right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed md:opacity-0 md:hover:opacity-100"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Image container */}
      <div className="flex h-full w-full items-center justify-center p-4">
        <img
          src={currentImage.url}
          alt={currentImage.alt}
          className="max-h-[90vh] max-w-[90vw] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Image counter */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white">
        {currentIndex + 1} / {totalImages}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
```

**Step 4: Run test to verify it passes**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/ImageLightbox.test.tsx
```

Expected: PASS (all tests green)

**Step 5: Commit**

```bash
git add packages/ui/components/lightbox/
git commit -m "feat(ui): add navigation arrows with keyboard support

- Add prev/next chevron buttons
- Disable buttons at boundaries
- Hide navigation for single image
- Add hover effects (desktop) and always-visible (mobile)
- Call onNavigate callback when navigating
- Add comprehensive navigation tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Add Touch Gesture Support

**Files:**

- Modify: `packages/ui/components/lightbox/ImageLightbox.tsx`
- Modify: `packages/ui/components/lightbox/__tests__/ImageLightbox.test.tsx`

**Step 1: Write the failing test**

Add to test file:

```typescript
describe('touch gestures', () => {
  it('should navigate to next on swipe left', () => {
    const onNavigate = vi.fn()
    render(<ImageLightbox {...defaultProps} initialIndex={1} onNavigate={onNavigate} />)

    const dialog = screen.getByRole('dialog')

    // Simulate swipe left (next image)
    fireEvent.touchStart(dialog, { touches: [{ clientX: 200, clientY: 100 }] })
    fireEvent.touchMove(dialog, { touches: [{ clientX: 50, clientY: 100 }] })
    fireEvent.touchEnd(dialog)

    expect(screen.getByAltText('Image 3')).toBeInTheDocument()
    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it('should navigate to prev on swipe right', () => {
    const onNavigate = vi.fn()
    render(<ImageLightbox {...defaultProps} initialIndex={1} onNavigate={onNavigate} />)

    const dialog = screen.getByRole('dialog')

    // Simulate swipe right (prev image)
    fireEvent.touchStart(dialog, { touches: [{ clientX: 50, clientY: 100 }] })
    fireEvent.touchMove(dialog, { touches: [{ clientX: 200, clientY: 100 }] })
    fireEvent.touchEnd(dialog)

    expect(screen.getByAltText('Image 1')).toBeInTheDocument()
    expect(onNavigate).toHaveBeenCalledWith(0)
  })

  it('should not navigate on small swipe', () => {
    const onNavigate = vi.fn()
    render(<ImageLightbox {...defaultProps} initialIndex={1} onNavigate={onNavigate} />)

    const dialog = screen.getByRole('dialog')

    // Small swipe (< 50px threshold)
    fireEvent.touchStart(dialog, { touches: [{ clientX: 100, clientY: 100 }] })
    fireEvent.touchMove(dialog, { touches: [{ clientX: 120, clientY: 100 }] })
    fireEvent.touchEnd(dialog)

    // Should still show Image 2
    expect(screen.getByAltText('Image 2')).toBeInTheDocument()
    expect(onNavigate).not.toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/ImageLightbox.test.tsx
```

Expected: FAIL - swipe gestures not yet implemented

**Step 3: Implement touch gesture support**

Modify `packages/ui/components/lightbox/ImageLightbox.tsx`:

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ImageLightboxProps } from './ImageLightbox.types'

const SWIPE_THRESHOLD = 50 // Minimum pixels to register as swipe

export function ImageLightbox({
  images,
  isOpen,
  initialIndex,
  onClose,
  onNavigate
}: ImageLightboxProps) {
  if (!isOpen || !images || images.length === 0) {
    return null
  }

  const safeIndex = Math.max(0, Math.min(initialIndex, images.length - 1))
  const [currentIndex, setCurrentIndex] = useState(safeIndex)
  const touchStartX = useRef<number>(0)

  useEffect(() => {
    setCurrentIndex(safeIndex)
  }, [safeIndex])

  const currentImage = images[currentIndex]
  const totalImages = images.length

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < totalImages - 1
  const showNavigation = totalImages > 1

  const handlePrev = () => {
    if (canGoPrev) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      onNavigate?.(newIndex)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      onNavigate?.(newIndex)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    // Swipe left (next image)
    if (diff > SWIPE_THRESHOLD) {
      handleNext()
    }
    // Swipe right (prev image)
    else if (diff < -SWIPE_THRESHOLD) {
      handlePrev()
    }
  }

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      className="fixed inset-0 z-50 bg-black/90"
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close lightbox"
        className="fixed right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Previous button */}
      {showNavigation && (
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          aria-label="Previous image"
          className="fixed left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed md:opacity-0 md:hover:opacity-100"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Next button */}
      {showNavigation && (
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Next image"
          className="fixed right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed md:opacity-0 md:hover:opacity-100"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Image container */}
      <div className="flex h-full w-full items-center justify-center p-4">
        <img
          src={currentImage.url}
          alt={currentImage.alt}
          className="max-h-[90vh] max-w-[90vw] touch-pan-x touch-pan-y touch-pinch-zoom object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Image counter */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white">
        {currentIndex + 1} / {totalImages}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
```

**Step 4: Run test to verify it passes**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/ImageLightbox.test.tsx
```

Expected: PASS (all tests green)

**Step 5: Commit**

```bash
git add packages/ui/components/lightbox/
git commit -m "feat(ui): add touch gesture support for mobile navigation

- Implement swipe left/right for next/prev
- Add 50px swipe threshold to prevent accidental navigation
- Enable native pinch-to-zoom with CSS touch-action
- Add touch gesture tests
- Improve mobile usability

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Integrate into CharacterDetail

**Files:**

- Modify: `packages/app/features/characters/components/CharacterDetail.tsx`
- Modify: `packages/app/features/characters/components/CharacterDetail.test.tsx` (if exists)

**Step 1: Write the failing test**

Check if test file exists:

```bash
ls packages/app/features/characters/components/__tests__/CharacterDetail.test.tsx
```

If it doesn't exist, create it:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CharacterDetail } from '../CharacterDetail'
import type { EntityImage } from '../../../../types/entity-image'

describe('CharacterDetail - Gallery Lightbox Integration', () => {
  const mockCharacter = {
    id: 1,
    name: 'Test Character',
    description: 'Test description',
    privacy: 'public' as const,
    userid: 'user123',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockImages: EntityImage[] = [
    {
      id: 1,
      entityType: 'character',
      entityId: 1,
      cloudinaryPublicId: 'primary',
      cloudinaryUrl: 'https://example.com/primary.jpg',
      isPrimary: true,
      displayOrder: 0,
      fileName: 'primary.jpg',
      fileSize: 1000,
      width: 800,
      height: 600,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      entityType: 'character',
      entityId: 1,
      cloudinaryPublicId: 'gallery1',
      cloudinaryUrl: 'https://example.com/gallery1.jpg',
      isPrimary: false,
      displayOrder: 1,
      fileName: 'gallery1.jpg',
      fileSize: 2000,
      width: 800,
      height: 600,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      entityType: 'character',
      entityId: 1,
      cloudinaryPublicId: 'gallery2',
      cloudinaryUrl: 'https://example.com/gallery2.jpg',
      isPrimary: false,
      displayOrder: 2,
      fileName: 'gallery2.jpg',
      fileSize: 3000,
      width: 800,
      height: 600,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  it('should open lightbox when gallery thumbnail is clicked', () => {
    render(
      <CharacterDetail
        character={mockCharacter}
        isOwner={false}
        images={mockImages}
      />
    )

    const thumbnails = screen.getAllByTestId('gallery-thumbnail')
    fireEvent.click(thumbnails[0])

    // Lightbox should be open with dialog role
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should open lightbox at correct image index', () => {
    render(
      <CharacterDetail
        character={mockCharacter}
        isOwner={false}
        images={mockImages}
      />
    )

    const thumbnails = screen.getAllByTestId('gallery-thumbnail')
    fireEvent.click(thumbnails[1]) // Click second thumbnail

    // Should show "2 / 2" (second of two gallery images)
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })

  it('should not open lightbox when primary thumbnail is clicked', () => {
    render(
      <CharacterDetail
        character={mockCharacter}
        isOwner={false}
        images={mockImages}
      />
    )

    const primaryThumbnail = screen.getByTestId('primary-thumbnail')
    fireEvent.click(primaryThumbnail)

    // Lightbox should not be open
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd packages/app
pnpm vitest run features/characters/components/__tests__/CharacterDetail.test.tsx
```

Expected: FAIL - lightbox not yet integrated

**Step 3: Implement lightbox integration**

Modify `packages/app/features/characters/components/CharacterDetail.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { ImageLightbox } from '@repo/ui/components/lightbox'
import type { EntityImage } from '../../../types/entity-image'
import {
  DetailWrapper,
  Header,
  TitleSection,
  Title,
  Metadata,
  ActionButtons,
  Content,
} from './CharacterDetail.styles'

interface Character {
  id: number
  name: string
  description: string | null
  privacy: 'public' | 'private'
  userid: string
  createdAt: Date | null
  updatedAt: Date | null
}

interface CharacterDetailProps {
  character: Character
  isOwner: boolean
  images?: EntityImage[]
  onEdit?: () => void
  onDelete?: () => void
  onTogglePrivacy?: () => void
  onToggleRelated?: () => void
  showRelated?: boolean
  theme?: string
}

export function CharacterDetail({
  character,
  isOwner,
  images,
  onEdit,
  onDelete,
  onTogglePrivacy,
  onToggleRelated,
  showRelated,
  theme,
}: CharacterDetailProps) {
  const primaryImage = images?.find((img) => img.isPrimary)
  const galleryImages = images?.filter((img) => !img.isPrimary) || []

  // Lightbox state
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    currentIndex: 0,
  })

  const handleImageClick = (index: number) => {
    setLightboxState({ isOpen: true, currentIndex: index })
  }

  const handleLightboxClose = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }))
  }

  return (
    <DetailWrapper data-testid="character-detail">
      <div className="flex gap-6">
        {/* Main content area */}
        <div className="flex-1">
          <Header>
            <TitleSection>
              <Title $theme={theme} data-testid="character-title">
                {character.name}
              </Title>
              {primaryImage && (
                <img
                  src={primaryImage.cloudinaryUrl}
                  alt={character.name}
                  className="mt-4 h-24 w-24 cursor-pointer rounded-lg object-cover hover:opacity-80"
                  data-testid="primary-thumbnail"
                />
              )}
              <Metadata $theme={theme} data-testid="character-metadata">
                {character.createdAt && (
                  <>
                    <span data-testid="character-created-date">
                      Created:{' '}
                      {new Date(character.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                  </>
                )}
                {character.updatedAt && (
                  <>
                    <span data-testid="character-updated-date">
                      Updated:{' '}
                      {new Date(character.updatedAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span data-testid="character-privacy-badge">
                  {character.privacy === 'public' ? '🌐 Public' : '🔒 Private'}
                </span>
              </Metadata>
            </TitleSection>
            {isOwner && (
              <ActionButtons data-testid="character-action-buttons">
                <Button
                  onClick={onEdit}
                  variant="default"
                  data-testid="edit-button"
                >
                  Edit
                </Button>
                <Button
                  onClick={onTogglePrivacy}
                  variant="outline"
                  data-testid="toggle-privacy-button"
                >
                  {character.privacy === 'public'
                    ? 'Make Private'
                    : 'Make Public'}
                </Button>
                <Button
                  onClick={onDelete}
                  variant="destructive"
                  data-testid="delete-button"
                >
                  Delete
                </Button>
              </ActionButtons>
            )}
          </Header>
          <Content $theme={theme} data-testid="character-content">
            {character.description || 'No description provided'}
          </Content>

          {onToggleRelated && (
            <button
              onClick={onToggleRelated}
              className="py-2 text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showRelated
                ? 'Hide Related Entities ▲'
                : 'Show Related Entities ▼'}
            </button>
          )}
        </div>

        {/* Sidebar gallery */}
        {galleryImages.length > 0 && (
          <aside className="w-64">
            <h3 className="text-default dark:text-default-dark mb-3 text-sm font-semibold">
              Gallery
            </h3>
            <div className="grid grid-cols-2 gap-2" data-testid="gallery-grid">
              {galleryImages.map((img, index) => (
                <img
                  key={img.id}
                  src={img.cloudinaryUrl}
                  alt={`Gallery image ${img.displayOrder + 1}`}
                  className="aspect-square w-full cursor-pointer rounded object-cover transition-opacity hover:opacity-80"
                  data-testid="gallery-thumbnail"
                  onClick={() => handleImageClick(index)}
                />
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={galleryImages.map((img) => ({
          id: img.id,
          url: img.cloudinaryUrl,
          alt: `Gallery image ${img.displayOrder + 1}`,
        }))}
        isOpen={lightboxState.isOpen}
        initialIndex={lightboxState.currentIndex}
        onClose={handleLightboxClose}
      />
    </DetailWrapper>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
cd packages/app
pnpm vitest run features/characters/components/__tests__/CharacterDetail.test.tsx
```

Expected: PASS (all tests green)

**Step 5: Update package.json if needed**

```bash
cd packages/app
# Check if @repo/ui is already in dependencies
cat package.json | grep "@repo/ui"
```

If not present, add it:

```bash
cd packages/app
pnpm add @repo/ui@workspace:*
```

**Step 6: Commit**

```bash
git add packages/app/features/characters/components/
git commit -m "feat(app): integrate lightbox into CharacterDetail

- Add ImageLightbox component to CharacterDetail
- Add click handlers for gallery thumbnails
- Map gallery images to lightbox format
- Primary image excluded from lightbox
- Add comprehensive integration tests
- Add @repo/ui dependency if needed

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Add Animations and Polish

**Files:**

- Modify: `packages/ui/components/lightbox/ImageLightbox.tsx`
- Modify: `packages/ui/components/lightbox/__tests__/ImageLightbox.test.tsx`

**Step 1: Write the failing test**

Add to test file:

```typescript
describe('animations', () => {
  it('should have fade-in animation class when opening', () => {
    const { rerender } = render(<ImageLightbox {...defaultProps} isOpen={false} />)

    rerender(<ImageLightbox {...defaultProps} isOpen={true} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('animate-in')
  })

  it('should have transition classes on image', () => {
    render(<ImageLightbox {...defaultProps} />)

    const image = screen.getByAltText('Image 1')
    expect(image.className).toContain('transition')
  })
})

describe('error handling', () => {
  it('should handle image load error gracefully', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<ImageLightbox {...defaultProps} />)

    const image = screen.getByAltText('Image 1') as HTMLImageElement
    fireEvent.error(image)

    // Image should still be in document (not crash)
    expect(image).toBeInTheDocument()

    consoleError.mockRestore()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/ImageLightbox.test.tsx
```

Expected: FAIL - animation classes not yet added

**Step 3: Add animations and error handling**

Modify `packages/ui/components/lightbox/ImageLightbox.tsx`:

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ImageLightboxProps } from './ImageLightbox.types'

const SWIPE_THRESHOLD = 50

export function ImageLightbox({
  images,
  isOpen,
  initialIndex,
  onClose,
  onNavigate
}: ImageLightboxProps) {
  if (!isOpen || !images || images.length === 0) {
    return null
  }

  const safeIndex = Math.max(0, Math.min(initialIndex, images.length - 1))
  const [currentIndex, setCurrentIndex] = useState(safeIndex)
  const [isImageLoading, setIsImageLoading] = useState(true)
  const touchStartX = useRef<number>(0)

  useEffect(() => {
    setCurrentIndex(safeIndex)
    setIsImageLoading(true)
  }, [safeIndex])

  const currentImage = images[currentIndex]
  const totalImages = images.length

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < totalImages - 1
  const showNavigation = totalImages > 1

  const handlePrev = () => {
    if (canGoPrev) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      setIsImageLoading(true)
      onNavigate?.(newIndex)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      setIsImageLoading(true)
      onNavigate?.(newIndex)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (diff > SWIPE_THRESHOLD) {
      handleNext()
    } else if (diff < -SWIPE_THRESHOLD) {
      handlePrev()
    }
  }

  const handleImageLoad = () => {
    setIsImageLoading(false)
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Failed to load image:', currentImage.url)
    setIsImageLoading(false)
    // Keep showing broken image rather than crashing
  }

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      className="fixed inset-0 z-50 animate-in fade-in duration-200 bg-black/90"
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close lightbox"
        className="fixed right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Previous button */}
      {showNavigation && (
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          aria-label="Previous image"
          className="fixed left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-30 disabled:cursor-not-allowed md:opacity-0 md:hover:opacity-100 md:group-hover:opacity-100"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Next button */}
      {showNavigation && (
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Next image"
          className="fixed right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-30 disabled:cursor-not-allowed md:opacity-0 md:hover:opacity-100 md:group-hover:opacity-100"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Image container */}
      <div className="flex h-full w-full items-center justify-center p-4">
        {isImageLoading && (
          <div className="absolute text-white">Loading...</div>
        )}
        <img
          key={currentImage.id}
          src={currentImage.url}
          alt={currentImage.alt}
          className="max-h-[90vh] max-w-[90vw] touch-pan-x touch-pan-y touch-pinch-zoom object-contain transition-opacity duration-150"
          onClick={(e) => e.stopPropagation()}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ opacity: isImageLoading ? 0 : 1 }}
        />
      </div>

      {/* Image counter */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/50 px-3 py-1 text-sm text-white">
        {currentIndex + 1} / {totalImages}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
```

**Step 4: Run test to verify it passes**

```bash
cd packages/ui
pnpm vitest run components/lightbox/__tests__/ImageLightbox.test.tsx
```

Expected: PASS (all tests green)

**Step 5: Commit**

```bash
git add packages/ui/components/lightbox/
git commit -m "feat(ui): add animations and error handling to lightbox

- Add fade-in animation on open (200ms)
- Add crossfade transition between images (150ms)
- Add loading state while image loads
- Handle image load errors gracefully
- Add focus rings for keyboard navigation
- Polish button hover states
- Add rounded background to counter for better readability

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Run Full Test Suite and Coverage

**Files:**

- Test all lightbox components
- Verify 80%+ coverage

**Step 1: Run all lightbox tests**

```bash
cd packages/ui
pnpm vitest run components/lightbox/
```

Expected: All tests PASS

**Step 2: Check test coverage**

```bash
cd packages/ui
pnpm vitest run --coverage components/lightbox/
```

Expected: Coverage >= 80% for all files

**Step 3: If coverage is below 80%, add missing tests**

Identify uncovered lines and add tests. Common gaps:

- Edge cases in navigation
- Error scenarios
- Keyboard event edge cases
- Touch gesture edge cases

**Step 4: Run integration test**

```bash
cd packages/app
pnpm vitest run features/characters/components/__tests__/CharacterDetail.test.tsx
```

Expected: All tests PASS

**Step 5: Run full monorepo test suite**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate
pnpm test
```

Expected: All tests PASS

**Step 6: Commit if any tests were added**

```bash
git add packages/ui/components/lightbox/ packages/app/features/characters/
git commit -m "test: ensure 80%+ test coverage for lightbox

- Add missing test cases for edge scenarios
- Verify full integration test coverage
- All tests passing in monorepo

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Add Documentation

**Files:**

- Create: `packages/ui/components/lightbox/README.md`

**Step 1: Write documentation**

Create `packages/ui/components/lightbox/README.md`:

````markdown
# ImageLightbox Component

A full-screen image lightbox component with keyboard, mouse, and touch navigation support.

## Features

- ✅ Full-screen overlay with semi-transparent backdrop
- ✅ Keyboard navigation (Escape, Arrow keys)
- ✅ Mouse navigation (buttons, clicks)
- ✅ Touch gestures (swipe, pinch-to-zoom)
- ✅ Accessible (ARIA labels, focus trap)
- ✅ Responsive (mobile and desktop optimized)
- ✅ Animations (fade-in, crossfade)
- ✅ Error handling (graceful image load failures)

## Installation

```bash
# Import from @repo/ui
import { ImageLightbox } from '@repo/ui/components/lightbox'
```
````

## Usage

### Basic Example

```typescript
import { useState } from 'react'
import { ImageLightbox } from '@repo/ui/components/lightbox'

function MyGallery() {
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    currentIndex: 0
  })

  const images = [
    { id: 1, url: '/image1.jpg', alt: 'Image 1' },
    { id: 2, url: '/image2.jpg', alt: 'Image 2' },
    { id: 3, url: '/image3.jpg', alt: 'Image 3' }
  ]

  const handleImageClick = (index: number) => {
    setLightboxState({ isOpen: true, currentIndex: index })
  }

  return (
    <>
      <div>
        {images.map((img, idx) => (
          <img
            key={img.id}
            src={img.url}
            alt={img.alt}
            onClick={() => handleImageClick(idx)}
          />
        ))}
      </div>

      <ImageLightbox
        images={images}
        isOpen={lightboxState.isOpen}
        initialIndex={lightboxState.currentIndex}
        onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  )
}
```

### With Navigation Callback

```typescript
<ImageLightbox
  images={images}
  isOpen={isOpen}
  initialIndex={0}
  onClose={handleClose}
  onNavigate={(index) => console.log('Navigated to:', index)}
/>
```

## Props

### `ImageLightboxProps`

| Prop           | Type                      | Required | Description                             |
| -------------- | ------------------------- | -------- | --------------------------------------- |
| `images`       | `LightboxImage[]`         | Yes      | Array of images to display              |
| `isOpen`       | `boolean`                 | Yes      | Controls lightbox visibility            |
| `initialIndex` | `number`                  | Yes      | Starting image index (0-based)          |
| `onClose`      | `() => void`              | Yes      | Callback when lightbox closes           |
| `onNavigate`   | `(index: number) => void` | No       | Callback when navigating between images |

### `LightboxImage`

| Field | Type     | Description                         |
| ----- | -------- | ----------------------------------- |
| `id`  | `number` | Unique identifier                   |
| `url` | `string` | Image URL (Cloudinary, local, etc.) |
| `alt` | `string` | Alt text for accessibility          |

## Keyboard Controls

| Key          | Action         |
| ------------ | -------------- |
| `Escape`     | Close lightbox |
| `ArrowLeft`  | Previous image |
| `ArrowRight` | Next image     |

## Touch Gestures

| Gesture      | Action               |
| ------------ | -------------------- |
| Swipe left   | Next image           |
| Swipe right  | Previous image       |
| Pinch        | Zoom in/out (native) |
| Tap backdrop | Close lightbox       |

## Accessibility

- **ARIA**: `role="dialog"` with `aria-modal="true"`
- **Labels**: All buttons have `aria-label` attributes
- **Focus**: Focus trap keeps Tab within lightbox
- **Screen readers**: Image changes announced

## Styling

Uses Tailwind CSS with responsive classes:

- **Mobile (< 768px)**: Always-visible navigation arrows, larger touch targets
- **Desktop (≥ 768px)**: Hover-visible navigation arrows, smaller controls

## Edge Cases

- **Empty images**: Component returns `null`
- **Single image**: Hides navigation arrows
- **Invalid index**: Clamps to valid range (0 to length-1)
- **Image load error**: Shows broken image, logs error, allows navigation

## Performance

- Portal rendering for proper z-index
- GPU-accelerated animations (CSS transforms)
- Passive touch event listeners
- Image preloading for adjacent images (future enhancement)

## Testing

Comprehensive test coverage (80%+):

- Unit tests for all interactions
- Integration tests with parent components
- Touch gesture simulation
- Keyboard event handling
- Accessibility compliance

Run tests:

```bash
cd packages/ui
pnpm vitest run components/lightbox/
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile Safari (iOS 12+)
- Chrome Android (latest)

## Known Limitations

- Requires JavaScript (no SSR content)
- Single lightbox per page (uses document.body portal)
- No image preloading (loads on demand)

## Future Enhancements

- [ ] Adjacent image preloading
- [ ] Thumbnail navigation strip
- [ ] Download button
- [ ] Fullscreen API support
- [ ] Custom loading placeholder
- [ ] Animation customization props

````

**Step 2: Commit**

```bash
git add packages/ui/components/lightbox/README.md
git commit -m "docs: add comprehensive ImageLightbox documentation

- Add usage examples
- Document all props and types
- List keyboard and touch controls
- Cover accessibility features
- Document edge cases and limitations
- Add testing instructions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
````

---

## Task 11: Manual Testing and Final Verification

**Manual Testing Checklist:**

1. **Start dev server:**

   ```bash
   cd /Users/jarrodmedrano/work/story-bible-ultimate
   pnpm dev
   ```

2. **Navigate to character page with gallery images**

3. **Test desktop interactions:**

   - [ ] Click gallery thumbnail opens lightbox
   - [ ] Escape key closes lightbox
   - [ ] Arrow keys navigate images
   - [ ] Prev/Next buttons work
   - [ ] Buttons disabled at boundaries
   - [ ] Close button works
   - [ ] Backdrop click closes
   - [ ] Image click doesn't close

4. **Test mobile interactions (resize browser or use device):**

   - [ ] Swipe left goes to next image
   - [ ] Swipe right goes to previous image
   - [ ] Pinch-to-zoom works
   - [ ] Tap backdrop closes
   - [ ] Navigation arrows always visible
   - [ ] Close button reachable

5. **Test edge cases:**

   - [ ] Single gallery image (no nav arrows)
   - [ ] No gallery images (no lightbox)
   - [ ] Image load error handled
   - [ ] Rapid navigation smooth

6. **Test accessibility:**
   - [ ] Tab navigation works
   - [ ] Focus trap active
   - [ ] Screen reader announces changes
   - [ ] All buttons have labels

**Step: Document any issues found**

Create GitHub issues for any bugs or improvements discovered during manual testing.

**Step: Create final verification commit**

```bash
git commit --allow-empty -m "chore: manual testing verification complete

Verified all lightbox features working:
- Desktop keyboard and mouse navigation
- Mobile touch gestures and pinch-zoom
- Accessibility compliance
- Edge case handling
- Responsive design

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Copy Pattern to LocationDetail

**Files:**

- Modify: `packages/app/features/locations/components/LocationDetail.tsx`

**Step 1: Check if LocationDetail exists and has similar structure**

```bash
ls packages/app/features/locations/components/LocationDetail.tsx
```

**Step 2: Copy integration pattern from CharacterDetail**

Follow the same pattern as Task 7:

1. Import ImageLightbox
2. Add lightbox state
3. Add click handlers
4. Render lightbox component

**Step 3: Test the integration**

```bash
cd packages/app
pnpm vitest run features/locations/
```

**Step 4: Commit**

```bash
git add packages/app/features/locations/
git commit -m "feat(app): integrate lightbox into LocationDetail

- Apply same lightbox integration pattern as CharacterDetail
- Add click handlers for location gallery thumbnails
- Test lightbox with location entities

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Copy Pattern to TimelineDetail (if exists)

**Files:**

- Modify: `packages/app/features/timelines/components/TimelineDetail.tsx` (if exists)

**Step 1: Check if TimelineDetail exists**

```bash
ls packages/app/features/timelines/components/TimelineDetail.tsx
```

**Step 2: If exists, copy integration pattern**

Follow the same pattern as Task 7 and 12.

**Step 3: If doesn't exist, skip this task**

Timeline detail pages may be implemented later.

**Step 4: Commit (if applicable)**

```bash
git add packages/app/features/timelines/
git commit -m "feat(app): integrate lightbox into TimelineDetail

- Apply lightbox integration pattern to timeline entities
- Complete lightbox rollout across all entity types

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria Verification

Before considering the implementation complete, verify:

- [ ] Users can click gallery thumbnails to open lightbox
- [ ] Navigation works via arrows, keyboard, and swipe
- [ ] Lightbox closes via Escape, close button, or backdrop
- [ ] Mobile users can swipe and pinch-to-zoom
- [ ] Accessible via keyboard and screen readers
- [ ] 80%+ test coverage achieved
- [ ] No performance degradation (< 200ms open time)
- [ ] Works across all entity types (characters, locations, timelines)

Run final verification:

```bash
# All tests passing
pnpm test

# Coverage check
cd packages/ui && pnpm vitest run --coverage components/lightbox/

# Build succeeds
pnpm build

# Manual testing complete (see Task 11)
```

---

## Plan Complete

All tasks defined with:

- ✅ Exact file paths
- ✅ Complete code implementations
- ✅ Test-first approach (TDD)
- ✅ Frequent commits
- ✅ Clear expected outcomes
- ✅ 80%+ test coverage target

Ready for execution!
