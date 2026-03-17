# Public Entity Grid Design

**Date:** 2026-03-15
**Feature:** Paginated public entity grid on `/stories` (and future entity pages)

## Goal

Replace placeholder picsum images in the parallax masonry grid with real paginated public stories. Design generically so characters, locations, and timelines can use the same pattern.

## URL Structure

- `GET /api/[entityType]?limit=20&offset=0` — public entities, no auth required
- `GET /api/user/[userId]/[entityType]` — user's own entities, auth required (existing)

Entity types: `stories`, `characters`, `locations`, `timelines`

## Data Layer

### New SQL queries (one per entity type, same pattern)

```sql
-- listPublicStories(limit, offset)
SELECT s.id, s.title, s.content, s.slug, s."userId", s.created_at,
       ei.url AS cover_image_url
FROM stories s
LEFT JOIN entity_images ei
  ON ei.entity_id = s.id
  AND ei.entity_type = 'story'
  AND ei.is_featured = true
WHERE s.privacy = 'public'
ORDER BY s.created_at DESC
LIMIT $1 OFFSET $2
```

Same pattern for characters, locations, timelines — swap table name and `entity_type` value.

### New API route

`apps/next/app/api/[entityType]/route.ts`

- Rate limited with `RateLimitConfigs.expensive`
- No auth required
- Validates: `limit` (1–50, default 20), `offset` (>= 0, default 0)
- Delegates to entity-specific query function based on `entityType` param
- Returns: `{ items: EntityGridItem[], total: number, hasMore: boolean }`

```typescript
interface EntityGridItem {
  id: number
  title: string
  content: string
  slug: string | null
  userId: string
  coverImageUrl: string | null
  href: string
}
```

## Component Architecture

### 1. `usePublicEntities` hook

`packages/app/features/shared/hooks/usePublicEntities.ts`

- Generic hook: `usePublicEntities(entityType: string)`
- Manages: `items`, `isLoading`, `hasMore`, `offset`
- Uses `IntersectionObserver` on a sentinel element to trigger next page fetch
- On API failure: stops loading, keeps existing items (no error loop)
- Appends pages immutably

### 2. Updated `MasonryGrid`

`packages/ui/components/flowbite/masonry.tsx`

Change from `images: string[]` to `items: EntityGridItem[]`.

Each card:

- Renders `cover_image_url` via Next.js `Image` if available
- Falls back to deterministic CSS gradient from `id % gradientPalette.length`
- Shows title overlay at bottom
- Wraps in `<Link href={item.href}>`

### 3. Updated `GalleryPage`

`packages/ui/components/pages/stories.tsx`

- Remove `generateRandomImageUrls` and all placeholder code
- Add `'use client'` directive
- Call `usePublicEntities('stories')`
- Render `MasonryGrid` with real items
- Render sentinel `<div ref={sentinelRef}>` below grid for IntersectionObserver
- Show skeleton cards during initial load
- Show "No public stories yet" when empty

## Data Flow

```
GalleryPage (client component)
  → usePublicEntities('stories')
    → GET /api/stories?limit=20&offset=0
      → listPublicStories(20, 0) [SQL]
      ← { items, total, hasMore }
    ← renders MasonryGrid (first page)
  → IntersectionObserver fires on sentinel
    → GET /api/stories?limit=20&offset=20
    ← appends to items array
```

## Error Handling

| Scenario                    | Behavior                                                   |
| --------------------------- | ---------------------------------------------------------- |
| API error                   | Keep existing items, stop loading, no retry loop           |
| Empty results               | Show "No public stories yet" message                       |
| Image load error            | Gradient fallback (already default; image overlays on top) |
| Invalid entityType in route | Return 400                                                 |

## Gradient Fallback

Deterministic palette — `id % palette.length` ensures same entity always gets same gradient. No flicker on re-render.

```typescript
const GRADIENT_PALETTE = [
  'from-violet-600 to-indigo-600',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
]
```

## Files to Create/Modify

| File                                                      | Action                                             |
| --------------------------------------------------------- | -------------------------------------------------- |
| `apps/database/sqlc/account_sql.ts`                       | Add `listPublicStories` (and other entities later) |
| `apps/next/app/api/[entityType]/route.ts`                 | Create generic public entity API route             |
| `packages/app/features/shared/hooks/usePublicEntities.ts` | Create infinite scroll hook                        |
| `packages/ui/components/flowbite/masonry.tsx`             | Update to accept `EntityGridItem[]`                |
| `packages/ui/components/pages/stories.tsx`                | Replace placeholder with real data                 |
