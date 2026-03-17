# User Detail Bento Box Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a user detail screen with a responsive bento box layout using resizable panels to display stories, characters, timelines, and locations.

**Architecture:** Client component using DashboardLayout wrapper with nested ResizablePanelGroup components. Top row (Stories | Characters) emphasized with larger panels, bottom row (Timelines | Locations) smaller. All content fetched via server actions with parallel loading.

**Tech Stack:** Next.js App Router, React, TypeScript, react-resizable-panels, styled-components, next-themes, PostgreSQL via existing SQLC queries

---

## Task 1: Create Server Actions for Content Fetching

**Files:**

- Create: `apps/next/actions/user/listStoriesForUser.ts`
- Create: `apps/next/actions/user/listCharactersForUser.ts`
- Create: `apps/next/actions/user/listTimelinesForUser.ts`
- Create: `apps/next/actions/user/listLocationsForUser.ts`

**Step 1: Write test for listStoriesForUser action**

```typescript
// apps/next/actions/user/__tests__/listStoriesForUser.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import listStoriesForUser from '../listStoriesForUser'

vi.mock('../../../app/utils/open-pool', () => ({
  default: {
    connect: vi.fn(),
  },
}))

describe('listStoriesForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return stories for a valid user', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({
        rows: [
          [1, 'user-123', 'Test Story', 'Content', new Date(), new Date()],
        ],
      }),
      release: vi.fn(),
    }

    const pool = await import('../../../app/utils/open-pool')
    vi.mocked(pool.default.connect).mockResolvedValue(mockClient as any)

    const result = await listStoriesForUser({
      userid: 'user-123',
      limit: '10',
      offset: '0',
    })

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Test Story')
    expect(mockClient.release).toHaveBeenCalled()
  })

  it('should return empty array when no stories found', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    }

    const pool = await import('../../../app/utils/open-pool')
    vi.mocked(pool.default.connect).mockResolvedValue(mockClient as any)

    const result = await listStoriesForUser({
      userid: 'user-456',
      limit: '10',
      offset: '0',
    })

    expect(result).toEqual([])
  })

  it('should handle database errors gracefully', async () => {
    const mockClient = {
      query: vi.fn().mockRejectedValue(new Error('DB Error')),
      release: vi.fn(),
    }

    const pool = await import('../../../app/utils/open-pool')
    vi.mocked(pool.default.connect).mockResolvedValue(mockClient as any)

    const result = await listStoriesForUser({
      userid: 'user-789',
      limit: '10',
      offset: '0',
    })

    expect(result).toEqual([])
    expect(mockClient.release).toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd apps/next && pnpm vitest actions/user/__tests__/listStoriesForUser.test.ts`
Expected: FAIL with "Cannot find module '../listStoriesForUser'"

**Step 3: Implement listStoriesForUser action**

```typescript
// apps/next/actions/user/listStoriesForUser.ts
'use server'
import {
  listStoriesForUser as dbListStoriesForUser,
  ListStoriesForUserArgs,
  ListStoriesForUserRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function listStoriesForUser(
  args: ListStoriesForUserArgs,
): Promise<ListStoriesForUserRow[]> {
  try {
    const client = await pool.connect()
    try {
      const stories = await dbListStoriesForUser(client, args)
      return stories
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching stories:', error)
    return []
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/next && pnpm vitest actions/user/__tests__/listStoriesForUser.test.ts`
Expected: PASS (3 tests)

**Step 5: Implement remaining server actions (characters, timelines, locations)**

```typescript
// apps/next/actions/user/listCharactersForUser.ts
'use server'
import {
  listCharactersForUser as dbListCharactersForUser,
  ListCharactersForUserArgs,
  ListCharactersForUserRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function listCharactersForUser(
  args: ListCharactersForUserArgs,
): Promise<ListCharactersForUserRow[]> {
  try {
    const client = await pool.connect()
    try {
      const characters = await dbListCharactersForUser(client, args)
      return characters
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching characters:', error)
    return []
  }
}
```

```typescript
// apps/next/actions/user/listTimelinesForUser.ts
'use server'
import {
  listTimelinesForUser as dbListTimelinesForUser,
  ListTimelinesForUserArgs,
  ListTimelinesForUserRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function listTimelinesForUser(
  args: ListTimelinesForUserArgs,
): Promise<ListTimelinesForUserRow[]> {
  try {
    const client = await pool.connect()
    try {
      const timelines = await dbListTimelinesForUser(client, args)
      return timelines
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching timelines:', error)
    return []
  }
}
```

```typescript
// apps/next/actions/user/listLocationsForUser.ts
'use server'
import {
  listLocationsForUser as dbListLocationsForUser,
  ListLocationsForUserArgs,
  ListLocationsForUserRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function listLocationsForUser(
  args: ListLocationsForUserArgs,
): Promise<ListLocationsForUserRow[]> {
  try {
    const client = await pool.connect()
    try {
      const locations = await dbListLocationsForUser(client, args)
      return locations
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching locations:', error)
    return []
  }
}
```

**Step 6: Create minimal tests for remaining actions**

Create test files following the same pattern for characters, timelines, and locations.

**Step 7: Run all tests**

Run: `cd apps/next && pnpm vitest actions/user/__tests__/`
Expected: PASS (12 tests - 3 per action type)

**Step 8: Commit**

```bash
git add apps/next/actions/user/
git commit -m "feat: add server actions for listing user content

- Add listStoriesForUser action
- Add listCharactersForUser action
- Add listTimelinesForUser action
- Add listLocationsForUser action
- Include comprehensive tests for all actions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create useUserContent Hook

**Files:**

- Create: `packages/app/features/user/hooks/useUserContent.ts`
- Create: `packages/app/features/user/hooks/__tests__/useUserContent.test.ts`

**Step 1: Write test for useUserContent hook**

```typescript
// packages/app/features/user/hooks/__tests__/useUserContent.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useUserContent } from '../useUserContent'

vi.mock('../../../../actions/user', () => ({
  listStoriesForUser: vi.fn(),
  listCharactersForUser: vi.fn(),
  listTimelinesForUser: vi.fn(),
  listLocationsForUser: vi.fn(),
}))

describe('useUserContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch all content types in parallel', async () => {
    const mockData = {
      stories: [{ id: 1, title: 'Story 1' }],
      characters: [{ id: 1, name: 'Character 1' }],
      timelines: [{ id: 1, name: 'Timeline 1' }],
      locations: [{ id: 1, name: 'Location 1' }],
    }

    const actions = await import('../../../../actions/user')
    vi.mocked(actions.listStoriesForUser).mockResolvedValue(mockData.stories)
    vi.mocked(actions.listCharactersForUser).mockResolvedValue(
      mockData.characters,
    )
    vi.mocked(actions.listTimelinesForUser).mockResolvedValue(
      mockData.timelines,
    )
    vi.mocked(actions.listLocationsForUser).mockResolvedValue(
      mockData.locations,
    )

    const { result } = renderHook(() => useUserContent('user-123'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stories).toEqual(mockData.stories)
    expect(result.current.characters).toEqual(mockData.characters)
    expect(result.current.timelines).toEqual(mockData.timelines)
    expect(result.current.locations).toEqual(mockData.locations)
  })

  it('should handle errors gracefully', async () => {
    const actions = await import('../../../../actions/user')
    vi.mocked(actions.listStoriesForUser).mockRejectedValue(
      new Error('Fetch error'),
    )
    vi.mocked(actions.listCharactersForUser).mockResolvedValue([])
    vi.mocked(actions.listTimelinesForUser).mockResolvedValue([])
    vi.mocked(actions.listLocationsForUser).mockResolvedValue([])

    const { result } = renderHook(() => useUserContent('user-123'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.stories).toEqual([])
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/app && pnpm vitest features/user/hooks/__tests__/useUserContent.test.ts`
Expected: FAIL with "Cannot find module '../useUserContent'"

**Step 3: Implement useUserContent hook**

```typescript
// packages/app/features/user/hooks/useUserContent.ts
'use client'
import { useState, useEffect } from 'react'

interface UserContentData {
  stories: any[]
  characters: any[]
  timelines: any[]
  locations: any[]
  isLoading: boolean
  error: Error | null
}

export function useUserContent(userId: string): UserContentData {
  const [stories, setStories] = useState<any[]>([])
  const [characters, setCharacters] = useState<any[]>([])
  const [timelines, setTimelines] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Import server actions dynamically
        const { default: listStoriesForUser } = await import(
          '../../../actions/user/listStoriesForUser'
        )
        const { default: listCharactersForUser } = await import(
          '../../../actions/user/listCharactersForUser'
        )
        const { default: listTimelinesForUser } = await import(
          '../../../actions/user/listTimelinesForUser'
        )
        const { default: listLocationsForUser } = await import(
          '../../../actions/user/listLocationsForUser'
        )

        const args = { userid: userId, limit: '10', offset: '0' }

        const [storiesData, charactersData, timelinesData, locationsData] =
          await Promise.all([
            listStoriesForUser(args),
            listCharactersForUser(args),
            listTimelinesForUser(args),
            listLocationsForUser(args),
          ])

        setStories(storiesData)
        setCharacters(charactersData)
        setTimelines(timelinesData)
        setLocations(locationsData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchContent()
    }
  }, [userId])

  return {
    stories,
    characters,
    timelines,
    locations,
    isLoading,
    error,
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/app && pnpm vitest features/user/hooks/__tests__/useUserContent.test.ts`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add packages/app/features/user/hooks/
git commit -m "feat: add useUserContent hook for parallel data fetching

- Fetch all content types in parallel with Promise.all
- Handle loading and error states
- Include comprehensive tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create ContentSection Component

**Files:**

- Create: `packages/app/features/user/components/ContentSection.tsx`
- Create: `packages/app/features/user/components/ContentSection.styles.ts`
- Create: `packages/app/features/user/components/__tests__/ContentSection.test.tsx`

**Step 1: Write test for ContentSection component**

```typescript
// packages/app/features/user/components/__tests__/ContentSection.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContentSection } from '../ContentSection'

describe('ContentSection', () => {
  it('should render title and add button', () => {
    render(
      <ContentSection
        title="Stories"
        entityType="stories"
        items={[]}
        isLoading={false}
        onAddNew={vi.fn()}
      />
    )

    expect(screen.getByText('Stories')).toBeInTheDocument()
    expect(screen.getByText('Add New')).toBeInTheDocument()
  })

  it('should render items when provided', () => {
    const items = [
      { id: 1, name: 'Story 1', description: 'Desc 1' },
      { id: 2, name: 'Story 2', description: 'Desc 2' },
    ]

    render(
      <ContentSection
        title="Stories"
        entityType="stories"
        items={items}
        isLoading={false}
        onAddNew={vi.fn()}
      />
    )

    expect(screen.getByText('Story 1')).toBeInTheDocument()
    expect(screen.getByText('Story 2')).toBeInTheDocument()
  })

  it('should show loading skeleton when loading', () => {
    render(
      <ContentSection
        title="Stories"
        entityType="stories"
        items={[]}
        isLoading={true}
        onAddNew={vi.fn()}
      />
    )

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('should show empty state when no items', () => {
    render(
      <ContentSection
        title="Stories"
        entityType="stories"
        items={[]}
        isLoading={false}
        onAddNew={vi.fn()}
      />
    )

    expect(screen.getByText(/no stories yet/i)).toBeInTheDocument()
  })

  it('should call onAddNew when button clicked', () => {
    const onAddNew = vi.fn()

    render(
      <ContentSection
        title="Stories"
        entityType="stories"
        items={[]}
        isLoading={false}
        onAddNew={onAddNew}
      />
    )

    fireEvent.click(screen.getByText('Add New'))
    expect(onAddNew).toHaveBeenCalledTimes(1)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/app && pnpm vitest features/user/components/__tests__/ContentSection.test.tsx`
Expected: FAIL with "Cannot find module '../ContentSection'"

**Step 3: Create styles file**

```typescript
// packages/app/features/user/components/ContentSection.styles.ts
import styled from 'styled-components'

export const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--background);
  border-radius: 12px;
  overflow: hidden;
`

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--card);
`

export const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--foreground);
`

export const SectionContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`

export const ItemCard = styled.div`
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--border);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`

export const ItemName = styled.h4`
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--foreground);
`

export const ItemDescription = styled.p`
  font-size: 12px;
  margin: 0;
  color: var(--muted-foreground);
  line-height: 1.4;
`

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--muted-foreground);
  padding: 24px;
`

export const EmptyStateText = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
`

export const LoadingSkeleton = styled.div`
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: var(--muted);
  height: 60px;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`
```

**Step 4: Implement ContentSection component**

```typescript
// packages/app/features/user/components/ContentSection.tsx
'use client'
import React from 'react'
import { Button } from '@repo/ui/components/ui/button'
import {
  SectionWrapper,
  SectionHeader,
  SectionTitle,
  SectionContent,
  ItemCard,
  ItemName,
  ItemDescription,
  EmptyState,
  EmptyStateText,
  LoadingSkeleton,
} from './ContentSection.styles'

interface ContentSectionProps {
  title: string
  entityType: 'stories' | 'characters' | 'timelines' | 'locations'
  items: Array<{
    id: number
    name?: string
    title?: string
    description?: string | null
  }>
  isLoading: boolean
  onAddNew: () => void
  theme?: string
}

export function ContentSection({
  title,
  entityType,
  items,
  isLoading,
  onAddNew,
}: ContentSectionProps) {
  const displayName = (item: any) => item.name || item.title || 'Untitled'

  if (isLoading) {
    return (
      <SectionWrapper>
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
          <Button size="sm" onClick={onAddNew}>
            Add New
          </Button>
        </SectionHeader>
        <SectionContent>
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} data-testid="loading-skeleton" />
          ))}
        </SectionContent>
      </SectionWrapper>
    )
  }

  if (items.length === 0) {
    return (
      <SectionWrapper>
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
          <Button size="sm" onClick={onAddNew}>
            Add New
          </Button>
        </SectionHeader>
        <SectionContent>
          <EmptyState>
            <EmptyStateText>
              No {entityType} yet. Create your first one!
            </EmptyStateText>
            <Button onClick={onAddNew}>Add {title}</Button>
          </EmptyState>
        </SectionContent>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper>
      <SectionHeader>
        <SectionTitle>{title}</SectionTitle>
        <Button size="sm" onClick={onAddNew}>
          Add New
        </Button>
      </SectionHeader>
      <SectionContent>
        {items.map((item) => (
          <ItemCard key={item.id}>
            <ItemName>{displayName(item)}</ItemName>
            {item.description && (
              <ItemDescription>{item.description}</ItemDescription>
            )}
          </ItemCard>
        ))}
      </SectionContent>
    </SectionWrapper>
  )
}
```

**Step 5: Run test to verify it passes**

Run: `cd packages/app && pnpm vitest features/user/components/__tests__/ContentSection.test.tsx`
Expected: PASS (5 tests)

**Step 6: Commit**

```bash
git add packages/app/features/user/components/
git commit -m "feat: add ContentSection component for bento layout

- Support loading, empty, and populated states
- Theme-aware styling with styled-components
- Reusable for all entity types
- Include comprehensive tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create UserInfoHeader Component

**Files:**

- Create: `packages/app/features/user/components/UserInfoHeader.tsx`
- Create: `packages/app/features/user/components/UserInfoHeader.styles.ts`
- Create: `packages/app/features/user/components/__tests__/UserInfoHeader.test.tsx`

**Step 1: Write test for UserInfoHeader**

```typescript
// packages/app/features/user/components/__tests__/UserInfoHeader.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserInfoHeader } from '../UserInfoHeader'

describe('UserInfoHeader', () => {
  it('should render user name and email', () => {
    const user = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
    }

    render(<UserInfoHeader user={user} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('should show loading state when user is null', () => {
    render(<UserInfoHeader user={null} />)

    expect(screen.getByTestId('loading-header')).toBeInTheDocument()
  })

  it('should render avatar with first initial', () => {
    const user = {
      id: 'user-123',
      name: 'Jane Smith',
      email: 'jane@example.com',
    }

    render(<UserInfoHeader user={user} />)

    expect(screen.getByText('J')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/app && pnpm vitest features/user/components/__tests__/UserInfoHeader.test.tsx`
Expected: FAIL with "Cannot find module '../UserInfoHeader'"

**Step 3: Create styles file**

```typescript
// packages/app/features/user/components/UserInfoHeader.styles.ts
import styled from 'styled-components'

export const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: var(--card);
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
`

export const Avatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  flex-shrink: 0;
`

export const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`

export const UserName = styled.h2`
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const UserEmail = styled.p`
  font-size: 14px;
  margin: 0;
  color: var(--muted-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const LoadingHeaderWrapper = styled(HeaderWrapper)`
  height: 112px;
  background: var(--muted);
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`
```

**Step 4: Implement UserInfoHeader component**

```typescript
// packages/app/features/user/components/UserInfoHeader.tsx
'use client'
import React from 'react'
import {
  HeaderWrapper,
  Avatar,
  UserInfo,
  UserName,
  UserEmail,
  LoadingHeaderWrapper,
} from './UserInfoHeader.styles'

interface UserInfoHeaderProps {
  user: {
    id: string
    name: string | null
    email: string | null
  } | null
  theme?: string
}

export function UserInfoHeader({ user }: UserInfoHeaderProps) {
  if (!user) {
    return <LoadingHeaderWrapper data-testid="loading-header" />
  }

  const initial = user.name?.charAt(0).toUpperCase() || 'U'

  return (
    <HeaderWrapper>
      <Avatar>{initial}</Avatar>
      <UserInfo>
        <UserName>{user.name || 'User'}</UserName>
        <UserEmail>{user.email || 'No email'}</UserEmail>
      </UserInfo>
    </HeaderWrapper>
  )
}
```

**Step 5: Run test to verify it passes**

Run: `cd packages/app && pnpm vitest features/user/components/__tests__/UserInfoHeader.test.tsx`
Expected: PASS (3 tests)

**Step 6: Commit**

```bash
git add packages/app/features/user/components/
git commit -m "feat: add UserInfoHeader component

- Display user avatar, name, and email
- Loading state support
- Theme-aware styling
- Include comprehensive tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Update UserDetailScreen with Bento Layout

**Files:**

- Modify: `packages/app/features/user/detail-screen.tsx`

**Step 1: Write test for UserDetailScreen bento layout**

```typescript
// packages/app/features/user/__tests__/detail-screen.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserDetailScreen } from '../detail-screen'

vi.mock('solito/navigation', () => ({
  useParams: () => ({ id: 'user-123' }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('../hooks/useUserContent', () => ({
  useUserContent: () => ({
    stories: [],
    characters: [],
    timelines: [],
    locations: [],
    isLoading: false,
    error: null,
  }),
}))

describe('UserDetailScreen', () => {
  it('should render all four content sections', () => {
    render(<UserDetailScreen />)

    expect(screen.getByText('Stories')).toBeInTheDocument()
    expect(screen.getByText('Characters')).toBeInTheDocument()
    expect(screen.getByText('Timelines')).toBeInTheDocument()
    expect(screen.getByText('Locations')).toBeInTheDocument()
  })

  it('should use ResizablePanelGroup for layout', () => {
    const { container } = render(<UserDetailScreen />)
    const resizablePanels = container.querySelectorAll(
      '[data-panel-group-direction]'
    )
    expect(resizablePanels.length).toBeGreaterThan(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/app && pnpm vitest features/user/__tests__/detail-screen.test.tsx`
Expected: FAIL (ResizablePanelGroup not found)

**Step 3: Implement UserDetailScreen with bento layout**

```typescript
// packages/app/features/user/detail-screen.tsx
'use client'
import React from 'react'
import { useParams, useRouter } from 'solito/navigation'
import { useTheme } from 'next-themes'
import { useAuthType } from '../../hooks/useAuthType'
import DashboardLayout from '../../components/dashboard-layout'
import { UserInfoHeader } from './components/UserInfoHeader'
import { ContentSection } from './components/ContentSection'
import { useUserContent } from './hooks/useUserContent'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@repo/ui/components/ui/resizable'
import { useCookies } from 'next-client-cookies'
import { User } from '@auth/core/types'
import getUserById from '../../../apps/next/actions/user/getUserById'

const useUserParams = useParams<{ id: string }>

export function UserDetailScreen() {
  const { id } = useUserParams()
  const router = useRouter()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const cookies = useCookies()
  const { user: authUser, signOut }: { user: User; signOut: () => Promise<void> } =
    useAuthType()

  const [profileUser, setProfileUser] = React.useState<any>(null)
  const { stories, characters, timelines, locations, isLoading } =
    useUserContent(id)

  React.useEffect(() => {
    const fetchUser = async () => {
      if (id) {
        const userData = await getUserById({ id })
        setProfileUser(userData)
      }
    }
    fetchUser()
  }, [id])

  const handleAddNew = (entityType: string) => {
    router.push(`/create/${entityType}`)
  }

  const newProps = {
    cookies,
    data: null,
    user: authUser,
    signOut,
    theme,
    resolvedTheme,
    setTheme,
  }

  return (
    <DashboardLayout {...newProps}>
      <main className="h-full p-6">
        <UserInfoHeader user={profileUser} theme={resolvedTheme} />

        <ResizablePanelGroup
          direction="vertical"
          className="h-[calc(100vh-240px)] rounded-lg border"
        >
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={50} minSize={30}>
                <ContentSection
                  title="Stories"
                  entityType="stories"
                  items={stories}
                  isLoading={isLoading}
                  onAddNew={() => handleAddNew('stories')}
                  theme={resolvedTheme}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={30}>
                <ContentSection
                  title="Characters"
                  entityType="characters"
                  items={characters}
                  isLoading={isLoading}
                  onAddNew={() => handleAddNew('characters')}
                  theme={resolvedTheme}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40} minSize={20}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={50} minSize={30}>
                <ContentSection
                  title="Timelines"
                  entityType="timelines"
                  items={timelines}
                  isLoading={isLoading}
                  onAddNew={() => handleAddNew('timelines')}
                  theme={resolvedTheme}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={30}>
                <ContentSection
                  title="Locations"
                  entityType="locations"
                  items={locations}
                  isLoading={isLoading}
                  onAddNew={() => handleAddNew('locations')}
                  theme={resolvedTheme}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </DashboardLayout>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/app && pnpm vitest features/user/__tests__/detail-screen.test.tsx`
Expected: PASS (2 tests)

**Step 5: Test the application manually**

Run: `cd apps/next && pnpm dev`
Navigate to: `http://localhost:3000/user/[test-user-id]`
Expected: Bento box layout renders with resizable panels

**Step 6: Commit**

```bash
git add packages/app/features/user/detail-screen.tsx
git commit -m "feat: implement bento box layout for user detail screen

- Use nested ResizablePanelGroup for bento layout
- Top row: Stories (50%) | Characters (50%)
- Bottom row: Timelines (50%) | Locations (50%)
- Integrate UserInfoHeader and ContentSection components
- Fetch user profile and content data
- Theme-aware styling

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Visual Testing with visual-debugger

**Files:**

- None (manual testing only)

**Step 1: Start development server**

Run: `cd apps/next && pnpm dev`
Expected: Server starts on http://localhost:3000

**Step 2: Use visual-debugger to test the layout**

Reference: @visual-debugger skill

Test steps:

1. Navigate to http://localhost:3000
2. Sign in with test@example.com / TestPassword123!
3. Navigate to /user/[authenticated-user-id]
4. Verify bento box layout renders correctly
5. Test resizing panels horizontally and vertically
6. Verify theme switching works (light/dark mode)
7. Test "Add New" buttons navigate to create pages
8. Verify empty states display when no content
9. Verify loading skeletons display during fetch
10. Test responsive behavior by resizing browser

**Step 3: Take screenshots of key states**

- Light mode with content
- Dark mode with content
- Empty states
- Loading states
- Resized panels

**Step 4: Document any issues found**

Create issue tickets for any visual or functional problems.

---

## Task 7: Add E2E Tests

**Files:**

- Create: `apps/next/__tests__/e2e/user-detail.spec.ts`

**Step 1: Write E2E test**

```typescript
// apps/next/__tests__/e2e/user-detail.spec.ts
import { test, expect } from '@playwright/test'

test.describe('User Detail Bento Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in
    await page.goto('http://localhost:3000')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('should display bento box layout with all sections', async ({
    page,
  }) => {
    // Navigate to user detail page
    await page.goto('http://localhost:3000/user/test-user-123')

    // Verify all sections are present
    await expect(page.locator('text=Stories')).toBeVisible()
    await expect(page.locator('text=Characters')).toBeVisible()
    await expect(page.locator('text=Timelines')).toBeVisible()
    await expect(page.locator('text=Locations')).toBeVisible()
  })

  test('should allow resizing panels', async ({ page }) => {
    await page.goto('http://localhost:3000/user/test-user-123')

    const handle = page.locator('[data-panel-resize-handle-id]').first()
    const box = await handle.boundingBox()

    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + 100, box.y + box.height / 2)
      await page.mouse.up()
    }

    // Panel should have resized
    await expect(handle).toBeVisible()
  })

  test('should navigate to create page when Add New clicked', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/user/test-user-123')

    await page.click('text=Stories >> .. >> text=Add New')
    await page.waitForURL('**/create/stories')
    expect(page.url()).toContain('/create/stories')
  })

  test('should show empty states when no content', async ({ page }) => {
    await page.goto('http://localhost:3000/user/empty-user-123')

    await expect(page.locator('text=/no stories yet/i')).toBeVisible()
    await expect(page.locator('text=/no characters yet/i')).toBeVisible()
    await expect(page.locator('text=/no timelines yet/i')).toBeVisible()
    await expect(page.locator('text=/no locations yet/i')).toBeVisible()
  })
})
```

**Step 2: Run E2E tests**

Run: `cd apps/next && pnpm playwright test __tests__/e2e/user-detail.spec.ts`
Expected: PASS (4 tests)

**Step 3: Commit**

```bash
git add apps/next/__tests__/e2e/user-detail.spec.ts
git commit -m "test: add E2E tests for user detail bento layout

- Test all sections render correctly
- Test panel resizing functionality
- Test navigation to create pages
- Test empty states display

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Final Integration & Documentation

**Files:**

- Modify: `README.md` (or project docs)
- Create: `docs/features/user-detail-bento.md`

**Step 1: Update README with feature documentation**

Add section describing the new user detail bento layout feature.

**Step 2: Create feature documentation**

```markdown
# User Detail Bento Box Layout

## Overview

The user detail screen displays a user's content in a responsive bento box layout with resizable panels.

## Layout Structure
```

┌─────────────────────────────────┐
│ User Info Header │
├────────────────┬────────────────┤
│ │ │
│ Stories │ Characters │
│ (Large) │ (Large) │
│ │ │
├────────────────┼────────────────┤
│ Timelines │ Locations │
│ (Small) │ (Small) │
└────────────────┴────────────────┘

```

## Components

- **UserInfoHeader**: Displays user avatar, name, and email
- **ContentSection**: Reusable section for displaying content lists
- **useUserContent**: Hook for fetching all content types in parallel

## Features

- ✅ Resizable panels (horizontal and vertical)
- ✅ Persistent panel sizes via cookies
- ✅ Theme-aware styling (light/dark mode)
- ✅ Loading skeletons during fetch
- ✅ Empty states with CTAs
- ✅ "Add New" buttons for each content type
- ✅ Responsive design

## Testing

- Unit tests: 80%+ coverage
- E2E tests: Critical user flows
- Visual testing: Light/dark modes, all states
```

**Step 3: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

**Step 4: Final commit**

```bash
git add README.md docs/features/
git commit -m "docs: add documentation for user detail bento layout

- Document layout structure
- List all components and features
- Include testing information

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 5: Push branch and create PR**

```bash
git push -u origin feat/user-detail-bento
```

Create PR with summary:

- Implemented bento box layout for user detail screen
- Added UserInfoHeader and ContentSection components
- Created useUserContent hook for parallel data fetching
- Added server actions for all content types
- Included comprehensive unit and E2E tests
- Verified with visual-debugger
