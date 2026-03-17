# Sidebar Entity Sections Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace ComboBox-based sidebar navigation with hierarchical collapsible sections showing user entities (Stories, Characters, Locations, Timelines) with search and "View all" links.

**Architecture:** Bottom-up component creation (EntityList → SectionHeader → CollapsibleSection), then hook modification to fetch/transform data, finally integrate into SidebarNav. Each section manages its own expand/collapse and search state.

**Tech Stack:** React, TypeScript, styled-components, Next.js App Router, useUserContent hook, lucide-react icons

---

## Task 1: Create Shared TypeScript Types

**Files:**

- Create: `/Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections/packages/ui/components/dashboard/sidebar/types.ts`

**Step 1: Create types file**

```typescript
import type { LucideIcon } from 'lucide-react'

export interface EntityItem {
  id: string
  name: string
  slug: string
  href: string
}

export interface CollapsibleSectionProps {
  title: string
  items: EntityItem[]
  icon: LucideIcon
  createHref: string
  moreHref: string
  isCollapsed: boolean
  theme?: string
}

export interface SectionHeaderProps {
  title: string
  icon: LucideIcon
  count: number
  isExpanded: boolean
  isCollapsed: boolean
  theme?: string
  onClick: () => void
}

export interface EntityListProps {
  items: EntityItem[]
  createHref: string
  moreHref: string
  searchQuery: string
  totalCount: number
  theme?: string
}
```

**Step 2: Commit**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections
git add packages/ui/components/dashboard/sidebar/types.ts
git commit -m "feat(sidebar): add TypeScript types for collapsible sections

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create EntityList Component (Styles)

**Files:**

- Create: `/Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections/packages/ui/components/dashboard/sidebar/EntityList.styles.ts`

**Step 1: Create styles file**

```typescript
import styled from 'styled-components'

export const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 24rem;
  overflow-y: auto;
`

export const ListItem = styled.a`
  display: flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background-color: ${({ theme }) =>
      theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  }
`

export const AddNewItem = styled(ListItem)`
  font-weight: 500;
  color: ${({ theme }) => (theme === 'dark' ? '#60a5fa' : '#2563eb')};

  svg {
    margin-right: 0.5rem;
    width: 1rem;
    height: 1rem;
  }
`

export const ViewAllLink = styled(ListItem)`
  color: ${({ theme }) => (theme === 'dark' ? '#9ca3af' : '#6b7280')};
  font-size: 0.875rem;

  svg {
    margin-left: auto;
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    text-decoration: underline;
  }
`

export const EmptyState = styled.div`
  padding: 1rem 0.75rem;
  text-align: center;
  color: ${({ theme }) => (theme === 'dark' ? '#9ca3af' : '#6b7280')};
  font-size: 0.875rem;
`
```

**Step 2: Commit**

```bash
git add packages/ui/components/dashboard/sidebar/EntityList.styles.ts
git commit -m "feat(sidebar): add EntityList styled components

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create EntityList Component (Logic)

**Files:**

- Create: `/Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections/packages/ui/components/dashboard/sidebar/EntityList.tsx`

**Step 1: Create component file**

```typescript
'use client'

import { Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { EntityListProps } from './types'
import {
  ListWrapper,
  ListItem,
  AddNewItem,
  ViewAllLink,
  EmptyState,
} from './EntityList.styles'

export function EntityList({
  items,
  createHref,
  moreHref,
  searchQuery,
  totalCount,
  theme,
}: EntityListProps) {
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const displayItems = filteredItems.slice(0, 10)
  const showViewAll = totalCount > 10

  return (
    <ListWrapper>
      <AddNewItem as={Link} href={createHref} theme={theme}>
        <Plus />
        Add New
      </AddNewItem>

      {displayItems.length === 0 && searchQuery ? (
        <EmptyState theme={theme}>No matches found</EmptyState>
      ) : displayItems.length === 0 ? (
        <EmptyState theme={theme}>No items yet</EmptyState>
      ) : (
        displayItems.map((item) => (
          <ListItem key={item.id} as={Link} href={item.href} theme={theme}>
            {item.name}
          </ListItem>
        ))
      )}

      {showViewAll && !searchQuery && (
        <ViewAllLink as={Link} href={moreHref} theme={theme}>
          View all {totalCount}
          <ArrowRight />
        </ViewAllLink>
      )}
    </ListWrapper>
  )
}
```

**Step 2: Commit**

```bash
git add packages/ui/components/dashboard/sidebar/EntityList.tsx
git commit -m "feat(sidebar): add EntityList component

Displays up to 10 entity items with Add New and View All links.
Filters items based on search query.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create SectionHeader Component (Styles)

**Files:**

- Create: `/Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections/packages/ui/components/dashboard/sidebar/SectionHeader.styles.ts`

**Step 1: Create styles file**

```typescript
import styled from 'styled-components'

export const HeaderWrapper = styled.button<{ $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: ${({ $isExpanded, theme }) =>
    $isExpanded
      ? theme === 'dark'
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : '1px solid rgba(0, 0, 0, 0.1)'
      : 'none'};

  &:hover {
    background-color: ${({ theme }) =>
      theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) =>
        theme === 'dark' ? '#60a5fa' : '#2563eb'};
    outline-offset: 2px;
  }
`

export const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-right: 0.75rem;

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`

export const Title = styled.span`
  font-weight: 600;
  font-size: 0.875rem;
`

export const CountBadge = styled.span`
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background-color: ${({ theme }) =>
    theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  color: ${({ theme }) => (theme === 'dark' ? '#9ca3af' : '#6b7280')};
  font-size: 0.75rem;
  font-weight: 500;
`

export const ChevronWrapper = styled.div<{ $isExpanded: boolean }>`
  margin-left: auto;
  display: flex;
  align-items: center;
  transform: ${({ $isExpanded }) =>
    $isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.2s ease;

  svg {
    width: 1rem;
    height: 1rem;
  }
`
```

**Step 2: Commit**

```bash
git add packages/ui/components/dashboard/sidebar/SectionHeader.styles.ts
git commit -m "feat(sidebar): add SectionHeader styled components

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create SectionHeader Component (Logic)

**Files:**

- Create: `/Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections/packages/ui/components/dashboard/sidebar/SectionHeader.tsx`

**Step 1: Create component file**

```typescript
'use client'

import { ChevronDown } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/ui/tooltip'
import type { SectionHeaderProps } from './types'
import {
  HeaderWrapper,
  IconWrapper,
  Title,
  CountBadge,
  ChevronWrapper,
} from './SectionHeader.styles'

export function SectionHeader({
  title,
  icon: Icon,
  count,
  isExpanded,
  isCollapsed,
  theme,
  onClick,
}: SectionHeaderProps) {
  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <HeaderWrapper
            onClick={onClick}
            $isExpanded={isExpanded}
            theme={theme}
            aria-label={`${title} (${count})`}
            aria-expanded={isExpanded}
          >
            <IconWrapper>
              <Icon />
            </IconWrapper>
          </HeaderWrapper>
        </TooltipTrigger>
        <TooltipContent side="right">
          {title} ({count})
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <HeaderWrapper
      onClick={onClick}
      $isExpanded={isExpanded}
      theme={theme}
      aria-label={`${title} section`}
      aria-expanded={isExpanded}
    >
      <IconWrapper>
        <Icon />
      </IconWrapper>
      <Title>{title}</Title>
      <CountBadge theme={theme}>{count}</CountBadge>
      <ChevronWrapper $isExpanded={isExpanded}>
        <ChevronDown />
      </ChevronWrapper>
    </HeaderWrapper>
  )
}
```

**Step 2: Commit**

```bash
git add packages/ui/components/dashboard/sidebar/SectionHeader.tsx
git commit -m "feat(sidebar): add SectionHeader component

Clickable header with icon, title, count badge, and chevron.
Supports collapsed sidebar mode with tooltip.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create CollapsibleSection Component (Styles)

**Files:**

- Create: `/Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections/packages/ui/components/dashboard/sidebar/CollapsibleSection.styles.ts`

**Step 1: Create styles file**

```typescript
import styled from 'styled-components'

export const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

export const ContentWrapper = styled.div<{ $isExpanded: boolean }>`
  max-height: ${({ $isExpanded }) => ($isExpanded ? '32rem' : '0')};
  overflow: hidden;
  transition: max-height 0.2s ease-in-out;
`

export const SearchWrapper = styled.div`
  padding: 0.5rem 0.75rem;
`

export const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid ${({ theme }) =>
      theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
  background-color: ${({ theme }) =>
    theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.9)'};
  color: inherit;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => (theme === 'dark' ? '#9ca3af' : '#6b7280')};
  }

  &:focus {
    border-color: ${({ theme }) => (theme === 'dark' ? '#60a5fa' : '#2563eb')};
  }
`
```

**Step 2: Commit**

```bash
git add packages/ui/components/dashboard/sidebar/CollapsibleSection.styles.ts
git commit -m "feat(sidebar): add CollapsibleSection styled components

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Create CollapsibleSection Component (Logic)

**Files:**

- Create: `/Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections/packages/ui/components/dashboard/sidebar/CollapsibleSection.tsx`

**Step 1: Create component file**

```typescript
'use client'

import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { SectionHeader } from './SectionHeader'
import { EntityList } from './EntityList'
import type { CollapsibleSectionProps } from './types'
import {
  SectionWrapper,
  ContentWrapper,
  SearchWrapper,
  SearchInput,
} from './CollapsibleSection.styles'

export function CollapsibleSection({
  title,
  items,
  icon,
  createHref,
  moreHref,
  isCollapsed,
  theme,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
    },
    [],
  )

  return (
    <SectionWrapper>
      <SectionHeader
        title={title}
        icon={icon}
        count={items.length}
        isExpanded={isExpanded}
        isCollapsed={isCollapsed}
        theme={theme}
        onClick={handleToggle}
      />

      {!isCollapsed && (
        <ContentWrapper $isExpanded={isExpanded}>
          <SearchWrapper>
            <SearchInput
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={handleSearchChange}
              theme={theme}
              aria-label={`Search ${title}`}
            />
          </SearchWrapper>
          <EntityList
            items={items}
            createHref={createHref}
            moreHref={moreHref}
            searchQuery={searchQuery}
            totalCount={items.length}
            theme={theme}
          />
        </ContentWrapper>
      )}
    </SectionWrapper>
  )
}
```

**Step 2: Commit**

```bash
git add packages/ui/components/dashboard/sidebar/CollapsibleSection.tsx
git commit -m "feat(sidebar): add CollapsibleSection component

Manages expand/collapse and search state.
Orchestrates SectionHeader and EntityList.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Update useSidebarNav Hook

**Files:**

- Modify: `/Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections/packages/ui/components/hooks/use-sidebar-nav.tsx`

**Step 1: Read current implementation**

```bash
cat packages/ui/components/hooks/use-sidebar-nav.tsx
```

**Step 2: Replace with new implementation**

```typescript
'use client'

import { useMemo } from 'react'
import { BookOpen, Users, MapPin, Clock } from 'lucide-react'
import { useUserContent } from '@repo/app/features/user/hooks/useUserContent'
import type { EntityItem } from '../dashboard/sidebar/types'

interface Section {
  title: string
  icon: typeof BookOpen
  items: EntityItem[]
  createHref: string
  moreHref: string
}

export const useSidebarNav = (userId: string) => {
  const { stories, characters, locations, timelines, isLoading, error } =
    useUserContent(userId)

  const sections: Section[] = useMemo(() => {
    return [
      {
        title: 'Stories',
        icon: BookOpen,
        items: stories.map((story) => ({
          id: story.id,
          name: story.title || 'Untitled',
          slug: story.slug || '',
          href: `/${userId}/stories/${story.slug}`,
        })),
        createHref: '/create/stories',
        moreHref: `/${userId}/stories`,
      },
      {
        title: 'Characters',
        icon: Users,
        items: characters.map((character) => ({
          id: character.id,
          name: character.name || 'Unnamed',
          slug: character.slug || '',
          href: `/${userId}/characters/${character.slug}`,
        })),
        createHref: '/create/characters',
        moreHref: `/${userId}/characters`,
      },
      {
        title: 'Locations',
        icon: MapPin,
        items: locations.map((location) => ({
          id: location.id,
          name: location.name || 'Unnamed',
          slug: location.slug || '',
          href: `/${userId}/locations/${location.slug}`,
        })),
        createHref: '/create/locations',
        moreHref: `/${userId}/locations`,
      },
      {
        title: 'Timelines',
        icon: Clock,
        items: timelines.map((timeline) => ({
          id: timeline.id,
          name: timeline.name || 'Unnamed',
          slug: timeline.slug || '',
          href: `/${userId}/timelines/${timeline.slug}`,
        })),
        createHref: '/create/timelines',
        moreHref: `/${userId}/timelines`,
      },
    ]
  }, [stories, characters, locations, timelines, userId])

  return {
    sections,
    isLoading,
    error,
  }
}
```

**Step 3: Commit**

```bash
git add packages/ui/components/hooks/use-sidebar-nav.tsx
git commit -m "feat(sidebar): update useSidebarNav to fetch and transform entities

Uses useUserContent hook to fetch user entities.
Transforms data into section format with EntityItem arrays.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Update SidebarNav Component

**Files:**

- Modify: `/Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections/packages/ui/components/dashboard/sidebar-nav.tsx`

**Step 1: Read current implementation**

```bash
cat packages/ui/components/dashboard/sidebar-nav.tsx
```

**Step 2: Replace with new implementation**

```typescript
'use client'

import { cn } from '@repo/ui/lib/utils'
import { CollapsibleSection } from './sidebar/CollapsibleSection'
import { useSidebarNav } from '../hooks/use-sidebar-nav'

export interface NavProps {
  isCollapsed: boolean
  userId: string
  theme?: string
}

export function SidebarNav({ isCollapsed, userId, theme }: NavProps) {
  const { sections, isLoading, error } = useSidebarNav(userId)

  if (isLoading) {
    return (
      <div
        data-collapsed={isCollapsed}
        className={cn(
          'group flex min-w-[50px] flex-col gap-4 py-2 transition-all duration-300 ease-in-out',
        )}
      >
        <div className="px-2 text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        data-collapsed={isCollapsed}
        className={cn(
          'group flex min-w-[50px] flex-col gap-4 py-2 transition-all duration-300 ease-in-out',
        )}
      >
        <div className="px-2 text-sm text-red-500">Error loading entities</div>
      </div>
    )
  }

  return (
    <div
      data-collapsed={isCollapsed}
      className={cn(
        'group flex min-w-[50px] flex-col gap-4 py-2 transition-all duration-300 ease-in-out',
      )}
    >
      <nav className="grid gap-1 px-2 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2">
        {sections.map((section) => (
          <CollapsibleSection
            key={section.title}
            title={section.title}
            items={section.items}
            icon={section.icon}
            createHref={section.createHref}
            moreHref={section.moreHref}
            isCollapsed={isCollapsed}
            theme={theme}
          />
        ))}
      </nav>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add packages/ui/components/dashboard/sidebar-nav.tsx
git commit -m "feat(sidebar): update SidebarNav to use CollapsibleSection

Replaces ComboBox with CollapsibleSection components.
Handles loading and error states.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Update Sidebar Component

**Files:**

- Modify: `/Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections/packages/ui/components/dashboard/sidebar/sidebar.tsx`

**Step 1: Read current implementation**

```bash
cat packages/ui/components/dashboard/sidebar/sidebar.tsx
```

**Step 2: Replace with new implementation**

```typescript
import { ReactNode } from 'react'
import { SidebarNav } from '../sidebar-nav'

export const Sidebar = ({
  isCollapsed,
  userId,
  theme,
}: {
  defaultLayout?: number[]
  defaultCollapsed?: boolean
  navCollapsedSize?: number
  isCollapsed: boolean
  children?: ReactNode
  userId: string
  theme?: string
}) => {
  return <SidebarNav userId={userId} isCollapsed={isCollapsed} theme={theme} />
}
```

**Step 3: Commit**

```bash
git add packages/ui/components/dashboard/sidebar/sidebar.tsx
git commit -m "feat(sidebar): update Sidebar to accept userId and theme

Passes userId and theme to SidebarNav.
Removes unused sitemap logic.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update DashboardLayout to Pass userId

**Files:**

- Modify: `/Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections/apps/next/app/[userId]/layout.tsx`

**Step 1: Update Sidebar component call at line 137-141**

Find this code:

```typescript
<Sidebar
  defaultLayout={layout}
  isCollapsed={isCollapsed}
  data={null}
/>
```

Replace with:

```typescript
<Sidebar
  defaultLayout={layout}
  isCollapsed={isCollapsed}
  userId={user.id}
  theme={resolvedTheme}
/>
```

**Step 2: Commit**

```bash
git add apps/next/app/[userId]/layout.tsx
git commit -m "feat(sidebar): pass userId and theme to Sidebar

Enables sidebar to fetch and display user entities.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Create Index Export

**Files:**

- Create: `/Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections/packages/ui/components/dashboard/sidebar/index.ts`

**Step 1: Create index file**

```typescript
export { Sidebar } from './sidebar'
export { CollapsibleSection } from './CollapsibleSection'
export { SectionHeader } from './SectionHeader'
export { EntityList } from './EntityList'
export * from './types'
```

**Step 2: Commit**

```bash
git add packages/ui/components/dashboard/sidebar/index.ts
git commit -m "feat(sidebar): add index exports

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Manual Testing

**Step 1: Start development server**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate/.worktrees/feat/sidebar-entity-sections
pnpm dev
```

**Step 2: Test checklist**

Manual testing checklist:

- [ ] Navigate to `http://localhost:3000/[your-userId]`
- [ ] Verify sidebar shows 4 sections: Stories, Characters, Locations, Timelines
- [ ] Click section header to expand/collapse
- [ ] Verify smooth animation on expand/collapse
- [ ] Verify count badge shows correct number
- [ ] Type in search box, verify filtering works
- [ ] Verify "Add New" link navigates to create page
- [ ] Verify entity links navigate to detail pages
- [ ] Verify "View all X →" link appears when count > 10
- [ ] Collapse sidebar, verify icon-only view with tooltips
- [ ] Test keyboard navigation (Tab, Enter)
- [ ] Test with empty entities (no items yet)
- [ ] Test dark/light theme switching

**Step 3: Document any issues found**

Create a markdown file with any bugs discovered during testing.

---

## Task 14: Final Review and Cleanup

**Step 1: Review all changes**

```bash
git status
git diff main --name-only
```

**Step 2: Check for console.log statements**

```bash
grep -r "console.log" packages/ui/components/dashboard/sidebar/ packages/ui/components/hooks/use-sidebar-nav.tsx
```

Remove any console.log statements found.

**Step 3: Run TypeScript check**

```bash
pnpm run type-check
```

Fix any TypeScript errors.

**Step 4: Format code**

```bash
pnpm run format
```

**Step 5: Final commit**

```bash
git add .
git commit -m "chore(sidebar): final cleanup and formatting

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

- [ ] Sidebar displays collapsible sections for each entity type
- [ ] Each section shows count badge with total entities
- [ ] Expand/collapse animation is smooth (200ms)
- [ ] Search functionality filters entities in real-time
- [ ] "Add New" link works for each entity type
- [ ] Entity links navigate to correct detail pages
- [ ] "View all X →" link appears when count > 10
- [ ] Collapsed sidebar shows icon with tooltip
- [ ] Dark/light theme switching works correctly
- [ ] No TypeScript errors
- [ ] No console.log statements in code
- [ ] All code follows project style guide

---

## Rollback Plan

If issues arise:

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate
git worktree remove .worktrees/feat/sidebar-entity-sections
git branch -D feat/sidebar-entity-sections
```

---

## Next Steps

After implementation:

1. Create pull request to main branch
2. Request code review
3. Address feedback
4. Merge to main
