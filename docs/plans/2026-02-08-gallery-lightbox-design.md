# Gallery Lightbox Feature Design

**Date:** 2026-02-08
**Feature:** Image Lightbox for Entity Gallery
**Status:** Design Approved

## Overview

Add a lightbox feature to entity detail pages (characters, locations, timelines) that allows users to view gallery images in a full-screen overlay with navigation controls.

## Requirements

- Click gallery thumbnail to open lightbox
- Full-screen overlay with semi-transparent backdrop
- Navigate between gallery images using arrows, keyboard, or swipe gestures
- Close via Escape key, close button, or backdrop click
- Primary image excluded from lightbox (remains separate)
- Mobile-friendly with touch gestures and pinch-to-zoom
- Accessible with keyboard navigation and screen reader support

## Design Decisions

### 1. Lightbox Pattern: Simple Overlay

- Full-screen overlay with close button and prev/next arrows
- Escape key or backdrop click to close
- Clean, distraction-free viewing experience
- Standard pattern users expect

### 2. Image Scope: Gallery Images Only

- Gallery thumbnails in sidebar open lightbox
- Primary image stays separate (serves as hero/avatar)
- Clear distinction between identity image and additional views

### 3. Keyboard Controls: Essential Only

- Escape to close
- Left/Right arrows to navigate prev/next
- Intuitive and standard across lightbox implementations

### 4. Mobile Support: Touch-Friendly with Swipe

- Swipe left/right to navigate
- Tap backdrop or close button to exit
- Pinch-to-zoom for viewing details
- Standard mobile interaction pattern

## Component Architecture

### File Structure

```
packages/ui/components/
  lightbox/
    ImageLightbox.tsx       # Main component (client-side)
    ImageLightbox.styles.ts # Styled components
    ImageLightbox.types.ts  # TypeScript interfaces
    useLightbox.ts          # Custom hook for state
    index.ts                # Public exports

packages/app/features/
  characters/
    components/
      CharacterDetail.tsx   # Integration point
  locations/
    components/
      LocationDetail.tsx    # Integration point
  timelines/
    components/
      TimelineDetail.tsx    # Integration point
```

### Component Separation

- **packages/ui**: Reusable ImageLightbox component (pure UI, no business logic)
- **packages/app**: Integration into entity detail components
- **apps/next**: No changes needed (enhancing existing pages)

### Technical Approach

- Client-side component (`'use client'`) for browser APIs
- Portal-based rendering using `createPortal` for proper z-index
- Self-contained state management via custom hook

## Component API

### ImageLightbox Props

```typescript
interface ImageLightboxProps {
  images: Array<{
    id: number
    url: string
    alt: string
  }>
  isOpen: boolean
  initialIndex: number
  onClose: () => void
  onNavigate?: (index: number) => void
}
```

### Usage Pattern

```typescript
// In CharacterDetail.tsx
const [lightboxState, setLightboxState] = useState({
  isOpen: false,
  currentIndex: 0
})

const handleImageClick = (index: number) => {
  setLightboxState({ isOpen: true, currentIndex: index })
}

<ImageLightbox
  images={galleryImages.map(img => ({
    id: img.id,
    url: img.cloudinaryUrl,
    alt: `Gallery image ${img.displayOrder + 1}`
  }))}
  isOpen={lightboxState.isOpen}
  initialIndex={lightboxState.currentIndex}
  onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
/>
```

## UI/UX Implementation

### Visual Design

- **Backdrop**: Semi-transparent black (`bg-black/90`) covering viewport
- **Image container**: Centered, max 90% viewport width/height for padding
- **Image**: `object-contain` to preserve aspect ratio
- **Controls**:
  - Close button (X) in top-right, white with hover effect
  - Prev/Next arrows on edges, hover-visible (desktop) or always visible (mobile)
  - Image counter at bottom center (e.g., "3 / 8")

### Interactions

**Opening:**

- Fade-in animation (200ms)
- Body scroll locked

**Closing:**

- Fade-out animation (200ms)
- Body scroll restored
- Triggers: Escape key, close button, backdrop click

**Navigation:**

- Crossfade transition (150ms) between images
- Buttons disabled at boundaries
- Arrow keys work without focus management

### Accessibility

- Focus trap (Tab cycles through close/prev/next only)
- ARIA labels on all buttons
- `role="dialog"` with `aria-modal="true"`
- Announce image changes to screen readers

## Mobile & Touch Support

### Touch Gestures

**Swipe Navigation:**

- Track `touchstart`, `touchmove`, `touchend` events
- Swipe left → next, swipe right → previous
- Minimum 50px swipe distance
- Visual feedback during swipe

**Pinch-to-Zoom:**

- CSS `touch-action: pan-x pan-y pinch-zoom`
- Native browser behavior (no custom JS)

### Responsive Design

**Mobile (< 768px):**

- Navigation arrows always visible
- Larger touch targets (48px minimum)
- Close button optimized for thumb reach
- Image counter always visible

**Desktop (≥ 768px):**

- Arrows appear on hover
- Smaller, less intrusive controls
- Pointer cursor on interactive elements

### Performance

- Passive event listeners for scroll/touch
- Debounced swipe detection
- Preload adjacent images

## Implementation Details

### Custom Hook (useLightbox.ts)

```typescript
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

### Edge Cases

1. **Empty gallery**: Component returns null if images array empty
2. **Single image**: Hide navigation arrows, show close only
3. **Rapid navigation**: Debounce to prevent skipping
4. **Browser back**: Close lightbox without browser navigation
5. **Image load errors**: Show placeholder, allow continued navigation
6. **Long alt text**: Truncate on mobile to prevent overlap

## Testing Strategy

### Unit Tests (useLightbox hook)

- Open/close state transitions
- Navigation boundaries
- Keyboard event handling
- Body scroll lock/unlock

### Integration Tests (ImageLightbox)

- Renders correct image
- Navigation buttons work
- Close button and backdrop click
- Keyboard navigation
- Focus trap behavior
- ARIA attributes

### E2E Tests (CharacterDetail)

- Click thumbnail opens lightbox
- Navigate through all images
- Close and reopen at different image
- Mobile swipe gestures
- Keyboard navigation

**Target Coverage:** 80%+ (per project requirements)

## Error Handling

```typescript
// Image loading error
<img
  src={currentImage.url}
  onError={(e) => {
    e.currentTarget.src = '/placeholder-image.png'
    console.error('Failed to load image:', currentImage.url)
  }}
/>

// Invalid index
const safeIndex = Math.max(0, Math.min(initialIndex, images.length - 1))

// Missing images
if (!images || images.length === 0) return null
```

## Performance Considerations

- Lazy load lightbox component (dynamic import)
- Preload adjacent images for smooth navigation
- CSS transforms for GPU-accelerated animations
- Cleanup event listeners on unmount

## Rollout Plan

1. Implement ImageLightbox component in `packages/ui`
2. Integrate into CharacterDetail first
3. Test thoroughly with real data
4. Copy integration pattern to LocationDetail and TimelineDetail
5. Document usage in component README

## Success Criteria

- [ ] Users can click gallery thumbnails to open lightbox
- [ ] Navigation works via arrows, keyboard, and swipe
- [ ] Lightbox closes via Escape, close button, or backdrop
- [ ] Mobile users can swipe and pinch-to-zoom
- [ ] Accessible via keyboard and screen readers
- [ ] 80%+ test coverage achieved
- [ ] No performance degradation (< 200ms open time)
- [ ] Works across all entity types (characters, locations, timelines)
