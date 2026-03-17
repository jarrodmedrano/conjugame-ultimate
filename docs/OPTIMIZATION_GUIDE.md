# Optimization Guide - Entity Detail Pages

**Status:** Implementation complete, optimizations documented for future work
**Priority:** Medium (can be done post-merge)

This guide documents the remaining optimization opportunities identified during implementation.

## Task 31: Optimistic Updates

### What & Why

Optimistic updates provide instant UI feedback by updating the interface immediately, then rolling back if the server operation fails.

**Current:** Loading states with disabled buttons
**Proposed:** Instant UI updates with rollback capability

### Implementation Plan

#### 1. Privacy Toggle Optimistic Update

**File:** `packages/app/features/stories/detail-screen.tsx`

```typescript
const handleTogglePrivacy = useCallback(() => {
  // Current privacy state
  const currentPrivacy = story.privacy
  const newPrivacy = currentPrivacy === 'public' ? 'private' : 'public'

  // Optimistically update UI
  setOptimisticPrivacy(newPrivacy)

  // Call server
  togglePrivacy({ id: story.id, privacy: newPrivacy })
    .then(() => {
      // Success - toast notification
      toast({ title: `Story is now ${newPrivacy}` })
    })
    .catch((error) => {
      // Rollback on error
      setOptimisticPrivacy(currentPrivacy)
      toast({
        title: 'Failed to update privacy',
        description: error.message,
        variant: 'destructive',
      })
    })
}, [story])
```

**Benefits:**

- Instant visual feedback
- Better perceived performance
- Graceful error handling

#### 2. Link/Unlink Optimistic Updates

**File:** `packages/app/features/stories/components/RelatedEntitiesGrid.tsx`

```typescript
const handleLink = useCallback(
  (entityIds: number[]) => {
    // Optimistically add entities to UI
    setOptimisticCharacters([...characters, ...newEntities])

    // Call server
    linkEntity({ storyId, entityType: 'character', entityIds })
      .then(() => {
        router.refresh() // Sync with server state
      })
      .catch((error) => {
        // Rollback on error
        setOptimisticCharacters(characters)
        toast({ title: 'Failed to link entities', variant: 'destructive' })
      })
  },
  [characters, storyId, router],
)
```

**Benefits:**

- Modal closes immediately
- Entities appear instantly
- Better UX for slow connections

#### 3. Form Submission Optimistic Update

**File:** `packages/app/features/stories/hooks/useStoryEdit.ts`

```typescript
const saveChanges = useCallback(() => {
  // Show optimistic state
  setIsOptimisticallySaved(true)

  // Call server
  onSave(formData)
    .then(() => {
      // Success - exit edit mode
      setIsEditing(false)
    })
    .catch((error) => {
      // Rollback - stay in edit mode
      setIsOptimisticallySaved(false)
      toast({ title: 'Save failed', variant: 'destructive' })
    })
}, [formData, onSave])
```

### Implementation Checklist

- [ ] Add optimistic state to privacy toggle
- [ ] Implement rollback mechanism
- [ ] Add optimistic updates to link/unlink operations
- [ ] Test with slow network (throttling)
- [ ] Verify rollback works correctly on errors
- [ ] Update loading states to use optimistic patterns

### Testing Strategy

```bash
# Simulate slow network
# Chrome DevTools > Network > Throttling > Slow 3G

# Test scenarios:
1. Toggle privacy rapidly - should not flicker
2. Link entity then quickly navigate - should persist
3. Force server error - should rollback gracefully
4. Offline mode - should show appropriate error
```

---

## Task 32: Accessibility Audit

### Tools Required

- [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- Keyboard (for manual testing)
- Screen reader (NVDA/JAWS/VoiceOver)

### Audit Checklist

#### 1. Automated Testing

```bash
# Install axe-core for automated testing
npm install --save-dev @axe-core/playwright

# Add to Playwright tests
import { injectAxe, checkA11y } from 'axe-playwright'

test('story detail page accessibility', async ({ page }) => {
  await page.goto('/user-123/stories/story-456')
  await injectAxe(page)
  await checkA11y(page)
})
```

#### 2. Keyboard Navigation

**Test all pages for:**

- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible (outline/ring)
- [ ] No keyboard traps
- [ ] Skip to content link works
- [ ] Modal escape key works
- [ ] Enter key submits forms
- [ ] Arrow keys work in lists/grids

**Known areas to check:**

- RelatedEntitiesGrid panels (resizable handles)
- Modal dialogs (close on Escape)
- Forms (Enter to submit, Tab to next field)
- Entity cards (Enter to navigate)

#### 3. ARIA Labels

**Files to audit:**

`StoryDetail.tsx`:

```typescript
// ✅ Already has aria-labels
<Button onClick={onEdit} aria-label="Edit story">Edit</Button>
<Button onClick={onTogglePrivacy} aria-label="Toggle privacy">...</Button>
<Button onClick={onDelete} aria-label="Delete story">Delete</Button>
```

`AddExistingModal.tsx`:

```typescript
// ✅ Already has aria-labels
<SearchInput aria-label="Search characters..." />
<Checkbox aria-label={`Link ${entity.name}`} />
```

**Check for missing:**

- [ ] All icon-only buttons have aria-labels
- [ ] All form inputs have labels or aria-labels
- [ ] All images have alt text
- [ ] All custom components have proper roles

#### 4. Color Contrast

**Test with WAVE or axe:**

- [ ] Text on backgrounds meets WCAG AA (4.5:1)
- [ ] Interactive elements meet WCAG AA (3:1)
- [ ] Focus indicators meet WCAG AA (3:1)

**Known areas:**

- Gray text on light backgrounds (check description text)
- Privacy badges (check icon colors)
- Toast notifications (check text contrast)

#### 5. Screen Reader Testing

**Test flow:**

1. Navigate to story detail page
2. Verify heading hierarchy (h1, h2, h3)
3. Navigate through interactive elements
4. Trigger modals and verify announcements
5. Submit forms and verify success/error messages

**macOS VoiceOver:**

```bash
# Enable VoiceOver
Cmd + F5

# Common commands
VO + Right Arrow  # Next element
VO + Left Arrow   # Previous element
VO + Space        # Activate element
```

#### 6. Semantic HTML

**Check for:**

- [ ] Proper heading hierarchy (no skipped levels)
- [ ] `<main>` for main content
- [ ] `<nav>` for navigation
- [ ] `<article>` for entity content
- [ ] `<button>` vs `<a>` used correctly
- [ ] `<form>` wraps form fields

#### 7. Common Issues to Fix

**Issue: Focus not visible**

```typescript
// Add focus-visible styles to Button component
const Button = styled.button`
  &:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
`
```

**Issue: Modal focus trap**

```typescript
// Use Radix UI's built-in focus management
<Dialog.Content onCloseAutoFocus={(e) => {
  // Return focus to trigger button
  e.preventDefault()
  triggerRef.current?.focus()
}}>
```

**Issue: Missing skip link**

```typescript
// Add to layout
<a href="#main-content" className="skip-to-content">
  Skip to main content
</a>
```

### Accessibility Testing Script

```bash
# Run automated tests
npm run test:a11y

# Manual testing checklist
1. Tab through entire page without mouse
2. Test with VoiceOver/NVDA
3. Check color contrast with WAVE
4. Verify all images have alt text
5. Test modals with Escape key
6. Verify form error announcements
```

---

## Task 33: Performance Optimization

### Audit Tools

- Chrome DevTools > Lighthouse
- Chrome DevTools > Coverage
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- Chrome DevTools > Performance

### 1. Bundle Size Analysis

#### Install Bundle Analyzer

```bash
npm install --save-dev @next/bundle-analyzer
```

#### Configure in next.config.js

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... existing config
})
```

#### Run Analysis

```bash
ANALYZE=true npm run build
```

#### What to Look For

- [ ] Duplicate dependencies
- [ ] Large third-party libraries
- [ ] Unused code in bundles
- [ ] Opportunities for code splitting

### 2. Code Splitting Strategy

#### Current State

- Server Components auto-split by route
- Client Components bundled per page

#### Opportunities

**Lazy load modals:**

```typescript
// Instead of:
import { AddExistingModal } from './AddExistingModal'

// Use:
import dynamic from 'next/dynamic'
const AddExistingModal = dynamic(() =>
  import('./AddExistingModal').then(mod => mod.AddExistingModal),
  { loading: () => <ModalSkeleton /> }
)
```

**Lazy load RelatedEntitiesGrid:**

```typescript
// Only load when user clicks "Show Related Entities"
const RelatedEntitiesGrid = dynamic(() =>
  import('./RelatedEntitiesGrid').then(mod => mod.RelatedEntitiesGrid)
)

// In component:
{showRelated && <RelatedEntitiesGrid {...props} />}
```

### 3. Image Optimization

#### Use Next.js Image Component

```typescript
// Instead of:
<img src="/avatar.png" alt="User avatar" />

// Use:
import Image from 'next/image'
<Image
  src="/avatar.png"
  alt="User avatar"
  width={40}
  height={40}
  loading="lazy"
/>
```

#### Optimize static images

```bash
# Use modern formats
# Convert PNG/JPG to WebP
npm install --save-dev imagemin imagemin-webp

# Add to build process
npx imagemin images/* --out-dir=public/optimized --plugin=webp
```

### 4. Database Query Optimization

#### Add Indexes

```sql
-- For frequently queried columns
CREATE INDEX idx_stories_user_privacy ON stories(userid, privacy);
CREATE INDEX idx_characters_user_privacy ON characters(userid, privacy);

-- For relationship queries
CREATE INDEX idx_story_characters_story ON story_characters(story_id);
CREATE INDEX idx_story_characters_char ON story_characters(character_id);
```

#### Optimize Related Entities Query

```typescript
// Current: Multiple queries
const characters = await getCharactersForStory(storyId)
const locations = await getLocationsForStory(storyId)
const timelines = await getTimelinesForStory(storyId)

// Optimized: Single query with joins
const relatedEntities = await getRelatedEntitiesOptimized(storyId)
```

### 5. React Performance

#### Verify Memoization

```typescript
// Check all useCallback dependencies are minimal
const handleClick = useCallback(() => {
  doSomething(id) // Only depends on id
}, [id]) // ✅ Correct

// Not:
}, [id, largeObject, anotherFunction]) // ❌ Too many deps
```

#### Check for Unnecessary Re-renders

```bash
# Install React DevTools Profiler
# Record interaction and check flamegraph

# Look for:
1. Components rendering more than necessary
2. Expensive computations not memoized
3. Large prop objects causing re-renders
```

### 6. Lighthouse Audit

#### Run Lighthouse

```bash
# Production build
npm run build
npm run start

# Open Chrome DevTools > Lighthouse
# Run audit for:
- Performance
- Accessibility
- Best Practices
- SEO
```

#### Target Scores

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

#### Common Issues to Fix

**Issue: Large JavaScript bundles**

- Solution: Code splitting, tree shaking
- Metric: Total Blocking Time (TBT)

**Issue: Render-blocking resources**

- Solution: Defer non-critical CSS/JS
- Metric: First Contentful Paint (FCP)

**Issue: Large images**

- Solution: Next.js Image component, WebP format
- Metric: Largest Contentful Paint (LCP)

### 7. Performance Testing Checklist

```bash
# 1. Bundle size
ANALYZE=true npm run build
# Check for bundles > 200KB

# 2. Lighthouse
npm run build && npm run start
# Run Lighthouse audit

# 3. Coverage
# Chrome DevTools > Coverage > Reload
# Check for unused code > 30%

# 4. Network waterfall
# Chrome DevTools > Network > Reload
# Check for sequential requests that could be parallel

# 5. Memory leaks
# Chrome DevTools > Memory > Take heap snapshot
# Navigate around, take another snapshot
# Compare - should not grow significantly
```

### 8. Quick Wins

**1. Preload critical fonts:**

```typescript
// In layout.tsx
<link
  rel="preload"
  href="/fonts/inter-var.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

**2. Use React.memo for expensive components:**

```typescript
export const ExpensiveComponent = React.memo(
  ({ data }) => {
    // Expensive rendering
  },
  (prevProps, nextProps) => {
    // Custom comparison
    return prevProps.data.id === nextProps.data.id
  },
)
```

**3. Debounce search inputs:**

```typescript
import { useDebouncedValue } from '@repo/ui/hooks/use-debounced-value'

const [search, setSearch] = useState('')
const debouncedSearch = useDebouncedValue(search, 300)

// Only search when debouncedSearch changes
useEffect(() => {
  performSearch(debouncedSearch)
}, [debouncedSearch])
```

---

## Priority Matrix

| Task                      | Impact | Effort | Priority | When          |
| ------------------------- | ------ | ------ | -------- | ------------- |
| Optimistic privacy toggle | High   | Low    | High     | Next sprint   |
| Keyboard navigation audit | High   | Medium | High     | Before launch |
| Bundle size optimization  | Medium | High   | Medium   | Post-launch   |
| Database indexes          | High   | Low    | High     | Next sprint   |
| Lazy load modals          | Low    | Low    | Low      | When needed   |
| Image optimization        | Low    | Medium | Low      | When needed   |

---

## Measurement & Monitoring

### Before Implementation

```bash
# Baseline metrics
npm run build
# Note: Bundle sizes, build time

# Lighthouse score
# Run and save report

# Database query time
# Add logging to server actions
console.time('getStoryById')
const story = await getStoryById(id)
console.timeEnd('getStoryById')
```

### After Implementation

```bash
# Compare metrics
npm run build
# Compare bundle sizes

# Lighthouse score
# Should see improvement in target areas

# Database query time
# Should be < 100ms for most queries
```

### Continuous Monitoring

```bash
# Add to CI/CD pipeline
- Lighthouse CI
- Bundle size tracking
- Test performance benchmarks
```

---

## Summary

These optimizations will improve the user experience but are **not blockers for launch**. The current implementation already provides:

✅ Good loading states
✅ Error boundaries
✅ Reasonable performance
✅ Basic accessibility

Optimizations can be done incrementally post-launch based on user feedback and analytics.
