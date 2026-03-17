# Sidebar Entity Organization Design

**Date:** 2026-02-03
**Status:** Approved
**Type:** Feature Enhancement

## Overview

Reorganize the sidebar navigation from individual ComboBoxes per entity type to a hierarchical collapsible structure that shows the user's actual entities (Stories, Characters, Locations, Timelines) grouped by type with search functionality.

## Current State

- Sidebar shows a ComboBox for each entity type (Stories, Characters, Locations, Timelines)
- Each ComboBox only allows "Add New" action
- No visibility of existing user entities in sidebar
- Navigation requires going to dedicated pages to see entities

## Proposed Design

### User Interface

```
▼ Stories (12)
  [Search box]
  + Add New
  • The Great Adventure
  • Mystery Novel
  View all Stories →

▼ Characters (45)
  [Search box]
  + Add New
  • John Doe
  • Jane Smith
  View all Characters →
```

**Key Features:**

- Collapsible sections for each entity type
- Count badge showing total entities
- Search box within each section (when expanded)
- Maximum 10 items displayed per section
- "View all X →" link when count > 10
- "+ Add New" always visible at top of list
- Clickable entity items linking to detail pages

## Architecture

### Component Structure

```
Sidebar (existing wrapper)
└─ SidebarNav (modified)
   └─ For each entity type:
      └─ CollapsibleSection
         ├─ SectionHeader (clickable to expand/collapse)
         │  └─ Entity name + count badge
         ├─ SearchInput (when expanded)
         ├─ ItemList (max 10 items)
         │  ├─ + Add New (always first)
         │  └─ EntityItem × 10
         └─ MoreLink (if count > 10)
```

### Data Flow

1. Sidebar receives `userId` from auth context
2. `useSidebarNav` hook fetches user content via `useUserContent(userId)`
3. Hook transforms entity data into sections array
4. Each CollapsibleSection manages its own state:
   - `isExpanded`: boolean
   - `searchQuery`: string
   - Filtered items computed on-the-fly

### Component Interfaces

```typescript
interface CollapsibleSectionProps {
  title: string // "Stories", "Characters", etc.
  items: EntityItem[] // User's entities
  icon: LucideIcon // Section icon
  createHref: string // "/create/stories"
  moreHref: string // "/:user/stories"
  isCollapsed: boolean // Sidebar collapsed state
  theme?: string // For theming
}

interface EntityItem {
  id: string
  name: string
  slug: string
  href: string
}
```

## Behavior Specifications

### Default State

- All sections collapsed on initial load
- Click header to toggle expand/collapse
- Smooth animation (200ms ease-in-out)

### Expanded State

- Show search input at top
- Show "+ Add New" as first item
- Show up to 10 entity items
- Show "View all X →" if total count > 10

### Search Behavior

- Real-time client-side filtering
- Case-insensitive matching
- 300ms debounce to avoid excessive filtering
- Show "No matches found" when no results

### Collapsed Sidebar Mode

- When `isCollapsed=true`: Show icon only with tooltip
- Matches existing behavior for consistency

### Keyboard Navigation

- Tab through sections
- Enter to expand/collapse
- Arrow keys to navigate items within section

## Visual Design

### Section Header

- Flex row: Icon + Title + Count Badge + Chevron
- Padding: `py-2 px-3`
- Hover: `bg-accent`
- Chevron rotates on expand/collapse
- Border-bottom when expanded

### Search Input

- Small size with search icon
- Placeholder: "Search {entity type}..."
- Margin: `mt-2 mb-2`
- Debounced: 300ms

### Item List

- Gap: `gap-1`
- Max height: `max-h-96` with `overflow-y-auto`
- Each item:
  - Padding: `py-1.5 px-3`
  - Hover: `bg-accent/50`
  - Truncate text with ellipsis
  - Active state: `bg-accent`

### "+ Add New" Item

- Icon: Plus or BookPlus
- Color: Primary/accent
- Font weight: Medium
- Always first in list

### "View all X →" Link

- Muted text color
- Right arrow icon
- Hover: Underline
- Padding: `py-2 px-3`
- Only shown if count > 10

## Error Handling

### Loading States

- Show skeleton loaders for each section
- Shimmer effect on header + 3 placeholder items

### Error States

- Fetch error: Show error message with retry button
- Network timeout: "Unable to load {entities}. Retry?"

### Empty States

- No entities: "No {entity type} yet" + "Create your first {entity}"
- No search results: "No {entity type} match '{query}'" + Clear search button

### Edge Cases

1. Long entity names: Truncate with ellipsis, full name in tooltip
2. Exactly 10 items: Don't show "View all" link
3. Special characters in search: Escape regex properly
4. Rapid expand/collapse: Debounce to prevent animation glitches
5. Deleted entity: Optimistic update or refetch on focus
6. Concurrent updates: Handle stale data with cache invalidation

## Performance Optimizations

- **Memoization**: Memoize filtered item lists
- **Debounced search**: 300ms delay
- **Lazy loading**: Optional - only fetch on first expand
- **Virtual scrolling**: If lists exceed expected size

## Implementation Plan

### New Files

```
packages/ui/components/dashboard/sidebar/
├─ CollapsibleSection.tsx          # Main section component
├─ CollapsibleSection.styles.ts    # Section styles
├─ SectionHeader.tsx               # Header with expand/collapse
├─ SectionHeader.styles.ts         # Header styles
├─ EntityList.tsx                  # List of entity items
├─ EntityList.styles.ts            # List styles
└─ types.ts                        # Shared TypeScript types
```

### Modified Files

```
packages/ui/components/dashboard/sidebar/
├─ sidebar.tsx                     # Pass userId to SidebarNav
└─ sidebar-nav.tsx                 # Replace combobox with sections

packages/ui/components/hooks/
└─ use-sidebar-nav.tsx             # Fetch user content, transform data
```

### Implementation Steps

1. **Create new components** (bottom-up):

   - EntityList component
   - SectionHeader component
   - CollapsibleSection component

2. **Update useSidebarNav hook**:

   - Import and use `useUserContent` hook
   - Transform entity data into `EntityItem[]` format
   - Return sections array

3. **Update SidebarNav**:

   - Remove ComboBoxResponsive mapping
   - Render CollapsibleSection for each entity type

4. **Update Sidebar wrapper**:

   - Pass userId from auth context
   - Handle loading/error states

5. **Testing**:
   - Unit tests for each component
   - Integration test for full sidebar
   - E2E test for user flows
   - Visual regression tests

## Testing Strategy

### Unit Tests

- CollapsibleSection: expand/collapse, search filtering
- SectionHeader: click behavior, icon rotation
- EntityList: rendering items, truncation, links

### Integration Tests

- Full sidebar with mock data
- Loading states
- Error states
- Empty states

### E2E Tests

- Expand section and navigate to entity
- Search within section
- Click "Add New"
- Click "View all"
- Keyboard navigation

### Accessibility Tests

- Keyboard navigation works
- Screen reader announcements
- ARIA labels and roles
- Focus management

## Migration Strategy

- **Risk Level**: Low (UI-only change, no backend impact)
- **Rollback Plan**: Git revert if issues arise
- **Data Requirements**: Already available via `useUserContent` hook
- **Feature Flag**: Not required (small, isolated change)

## Success Criteria

- Users can see their entities directly in sidebar
- Quick navigation to entities without page load
- Search functionality works smoothly
- No performance degradation
- Maintains existing sidebar collapse behavior
- All tests passing
- No accessibility regressions

## Future Enhancements

- Drag and drop to reorder entities
- Pinned/favorite entities at top
- Recent entities section
- Lazy loading on scroll for large lists
- Bulk actions (multi-select)
