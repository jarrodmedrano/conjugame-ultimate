# Entity Detail Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build comprehensive entity detail pages with list views, detail views, editing, privacy controls, and relationship management for stories, characters, locations, and timelines.

**Architecture:** Next.js App Router with Server Components for data fetching, Client Components for interactivity. SQLC for type-safe database queries. Server Actions for mutations. Test-driven development with 80%+ coverage.

**Tech Stack:** Next.js 15, React 19, TypeScript, PostgreSQL, SQLC, Solito, Next-Themes, Styled Components

---

## Phase 1: Database Schema & Migrations

### Task 1.1: Add Privacy Column Migration

**Files:**

- Create: `apps/database/migration/000004_add_privacy_columns.up.sql`
- Create: `apps/database/migration/000004_add_privacy_columns.down.sql`

**Step 1: Write up migration**

```sql
-- Add privacy column to all entity tables
ALTER TABLE stories ADD COLUMN privacy VARCHAR(10) DEFAULT 'private' NOT NULL;
ALTER TABLE characters ADD COLUMN privacy VARCHAR(10) DEFAULT 'private' NOT NULL;
ALTER TABLE locations ADD COLUMN privacy VARCHAR(10) DEFAULT 'private' NOT NULL;
ALTER TABLE timelines ADD COLUMN privacy VARCHAR(10) DEFAULT 'private' NOT NULL;

-- Add indexes for filtering by privacy
CREATE INDEX idx_stories_privacy ON stories(privacy);
CREATE INDEX idx_characters_privacy ON characters(privacy);
CREATE INDEX idx_locations_privacy ON locations(privacy);
CREATE INDEX idx_timelines_privacy ON timelines(privacy);

-- Add constraints to ensure valid values
ALTER TABLE stories ADD CONSTRAINT check_stories_privacy
  CHECK (privacy IN ('public', 'private'));
ALTER TABLE characters ADD CONSTRAINT check_characters_privacy
  CHECK (privacy IN ('public', 'private'));
ALTER TABLE locations ADD CONSTRAINT check_locations_privacy
  CHECK (privacy IN ('public', 'private'));
ALTER TABLE timelines ADD CONSTRAINT check_timelines_privacy
  CHECK (privacy IN ('public', 'private'));
```

**Step 2: Write down migration**

```sql
-- Remove constraints
ALTER TABLE stories DROP CONSTRAINT IF EXISTS check_stories_privacy;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS check_characters_privacy;
ALTER TABLE locations DROP CONSTRAINT IF EXISTS check_locations_privacy;
ALTER TABLE timelines DROP CONSTRAINT IF EXISTS check_timelines_privacy;

-- Drop indexes
DROP INDEX IF EXISTS idx_stories_privacy;
DROP INDEX IF EXISTS idx_characters_privacy;
DROP INDEX IF EXISTS idx_locations_privacy;
DROP INDEX IF EXISTS idx_timelines_privacy;

-- Drop columns
ALTER TABLE stories DROP COLUMN IF EXISTS privacy;
ALTER TABLE characters DROP COLUMN IF EXISTS privacy;
ALTER TABLE locations DROP COLUMN IF EXISTS privacy;
ALTER TABLE timelines DROP COLUMN IF EXISTS privacy;
```

**Step 3: Update schema.sql**

Add privacy column to all entity tables in `apps/database/schemas/schema.sql`:

```sql
CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    privacy VARCHAR(10) DEFAULT 'private' NOT NULL CHECK (privacy IN ('public', 'private')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Repeat for characters, locations, timelines
```

**Step 4: Commit**

```bash
git add apps/database/migration/ apps/database/schemas/schema.sql
git commit -m "feat: add privacy column to entity tables"
```

---

### Task 1.2: Create Relationship Tables Migration

**Files:**

- Create: `apps/database/migration/000005_add_relationship_tables.up.sql`
- Create: `apps/database/migration/000005_add_relationship_tables.down.sql`

**Step 1: Write up migration**

```sql
-- Story-Character relationships
CREATE TABLE story_characters (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, character_id)
);

CREATE INDEX idx_story_characters_story_id ON story_characters(story_id);
CREATE INDEX idx_story_characters_character_id ON story_characters(character_id);

-- Story-Location relationships
CREATE TABLE story_locations (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, location_id)
);

CREATE INDEX idx_story_locations_story_id ON story_locations(story_id);
CREATE INDEX idx_story_locations_location_id ON story_locations(location_id);

-- Story-Timeline relationships
CREATE TABLE story_timelines (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  timeline_id INTEGER NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, timeline_id)
);

CREATE INDEX idx_story_timelines_story_id ON story_timelines(story_id);
CREATE INDEX idx_story_timelines_timeline_id ON story_timelines(timeline_id);
```

**Step 2: Write down migration**

```sql
DROP TABLE IF EXISTS story_timelines;
DROP TABLE IF EXISTS story_locations;
DROP TABLE IF EXISTS story_characters;
```

**Step 3: Update schema.sql**

Add relationship tables to `apps/database/schemas/schema.sql` after entity tables.

**Step 4: Commit**

```bash
git add apps/database/migration/ apps/database/schemas/schema.sql
git commit -m "feat: add relationship tables for entity connections"
```

---

## Phase 2: SQLC Queries & Server Actions

### Task 2.1: Story CRUD Queries

**Files:**

- Create: `apps/database/queries/story.sql`
- Test: `apps/next/actions/stories/__tests__/getStoryById.test.ts`

**Step 1: Write failing test**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import pool from '../../../app/utils/open-pool'
import getStoryById from '../getStoryById'

describe('getStoryById', () => {
  let testUserId: string
  let testStoryId: number

  beforeEach(async () => {
    const client = await pool.connect()
    try {
      // Create test user
      const userResult = await client.query(
        `INSERT INTO users (id, email, name) VALUES ($1, $2, $3) RETURNING id`,
        ['test-user-1', 'test@example.com', 'Test User'],
      )
      testUserId = userResult.rows[0].id

      // Create test story
      const storyResult = await client.query(
        `INSERT INTO stories ("userId", title, content, privacy)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [testUserId, 'Test Story', 'Test content', 'private'],
      )
      testStoryId = storyResult.rows[0].id
    } finally {
      client.release()
    }
  })

  afterEach(async () => {
    const client = await pool.connect()
    try {
      await client.query('DELETE FROM stories WHERE id = $1', [testStoryId])
      await client.query('DELETE FROM users WHERE id = $1', [testUserId])
    } finally {
      client.release()
    }
  })

  it('should fetch story by id', async () => {
    const story = await getStoryById({ id: testStoryId })

    expect(story).toBeDefined()
    expect(story?.title).toBe('Test Story')
    expect(story?.content).toBe('Test content')
    expect(story?.privacy).toBe('private')
  })

  it('should return null for non-existent story', async () => {
    const story = await getStoryById({ id: 99999 })
    expect(story).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd apps/next && pnpm vitest actions/stories/__tests__/getStoryById.test.ts`
Expected: FAIL - "Cannot find module '../getStoryById'"

**Step 3: Write SQLC query**

```sql
-- name: GetStoryById :one
SELECT * FROM stories WHERE id = $1;

-- name: ListStoriesForUserWithPrivacy :many
SELECT * FROM stories
WHERE "userId" = $1
  AND (privacy = 'public' OR "userId" = $2)
ORDER BY created_at DESC;

-- name: CreateStory :one
INSERT INTO stories ("userId", title, content, privacy)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateStory :one
UPDATE stories
SET title = $2, content = $3, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateStoryPrivacy :one
UPDATE stories
SET privacy = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteStory :exec
DELETE FROM stories WHERE id = $1;
```

**Step 4: Generate TypeScript from SQLC**

Run: `cd apps/database && sqlc generate`
Expected: Creates `apps/database/sqlc/story_sql.ts` with types and functions

**Step 5: Write server action implementation**

Create `apps/next/actions/stories/getStoryById.ts`:

```typescript
'use server'
import {
  getStoryById as dbGetStoryById,
  GetStoryByIdArgs,
  GetStoryByIdRow,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getStoryById(
  args: GetStoryByIdArgs,
): Promise<GetStoryByIdRow | null> {
  try {
    const client = await pool.connect()
    try {
      const story = await dbGetStoryById(client, args)
      return story || null
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching story:', error)
    return null
  }
}
```

**Step 6: Run test to verify it passes**

Run: `cd apps/next && pnpm vitest actions/stories/__tests__/getStoryById.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/database/queries/story.sql apps/database/sqlc/ apps/next/actions/stories/
git commit -m "feat: add story CRUD queries and getStoryById action"
```

---

### Task 2.2: Story Relationship Queries

**Files:**

- Create: `apps/database/queries/relationships.sql`
- Create: `apps/next/actions/relationships/getRelatedEntities.ts`
- Test: `apps/next/actions/relationships/__tests__/getRelatedEntities.test.ts`

**Step 1: Write failing test**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import pool from '../../../app/utils/open-pool'
import getRelatedEntities from '../getRelatedEntities'

describe('getRelatedEntities', () => {
  let testUserId: string
  let testStoryId: number
  let testCharacterId: number

  beforeEach(async () => {
    const client = await pool.connect()
    try {
      const userResult = await client.query(
        `INSERT INTO users (id, email, name) VALUES ($1, $2, $3) RETURNING id`,
        ['test-user-2', 'test2@example.com', 'Test User 2'],
      )
      testUserId = userResult.rows[0].id

      const storyResult = await client.query(
        `INSERT INTO stories ("userId", title, content) VALUES ($1, $2, $3) RETURNING id`,
        [testUserId, 'Story with Relations', 'Content'],
      )
      testStoryId = storyResult.rows[0].id

      const charResult = await client.query(
        `INSERT INTO characters ("userId", name, description) VALUES ($1, $2, $3) RETURNING id`,
        [testUserId, 'Test Character', 'A character'],
      )
      testCharacterId = charResult.rows[0].id

      await client.query(
        `INSERT INTO story_characters (story_id, character_id) VALUES ($1, $2)`,
        [testStoryId, testCharacterId],
      )
    } finally {
      client.release()
    }
  })

  afterEach(async () => {
    const client = await pool.connect()
    try {
      await client.query('DELETE FROM story_characters WHERE story_id = $1', [
        testStoryId,
      ])
      await client.query('DELETE FROM stories WHERE id = $1', [testStoryId])
      await client.query('DELETE FROM characters WHERE id = $1', [
        testCharacterId,
      ])
      await client.query('DELETE FROM users WHERE id = $1', [testUserId])
    } finally {
      client.release()
    }
  })

  it('should fetch related entities for a story', async () => {
    const related = await getRelatedEntities({ storyId: testStoryId })

    expect(related.characters).toHaveLength(1)
    expect(related.characters[0].name).toBe('Test Character')
    expect(related.locations).toHaveLength(0)
    expect(related.timelines).toHaveLength(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd apps/next && pnpm vitest actions/relationships/__tests__/getRelatedEntities.test.ts`
Expected: FAIL

**Step 3: Write SQLC queries**

```sql
-- name: GetCharactersForStory :many
SELECT c.* FROM characters c
JOIN story_characters sc ON c.id = sc.character_id
WHERE sc.story_id = $1
ORDER BY c.name;

-- name: GetLocationsForStory :many
SELECT l.* FROM locations l
JOIN story_locations sl ON l.id = sl.location_id
WHERE sl.story_id = $1
ORDER BY l.name;

-- name: GetTimelinesForStory :many
SELECT t.* FROM timelines t
JOIN story_timelines st ON t.id = st.timeline_id
WHERE st.story_id = $1
ORDER BY t.name;

-- name: LinkCharacterToStory :exec
INSERT INTO story_characters (story_id, character_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: UnlinkCharacterFromStory :exec
DELETE FROM story_characters
WHERE story_id = $1 AND character_id = $2;

-- name: LinkLocationToStory :exec
INSERT INTO story_locations (story_id, location_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: UnlinkLocationFromStory :exec
DELETE FROM story_locations
WHERE story_id = $1 AND location_id = $2;

-- name: LinkTimelineToStory :exec
INSERT INTO story_timelines (story_id, timeline_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: UnlinkTimelineFromStory :exec
DELETE FROM story_timelines
WHERE story_id = $1 AND timeline_id = $2;
```

**Step 4: Generate TypeScript**

Run: `cd apps/database && sqlc generate`

**Step 5: Implement server action**

```typescript
'use server'
import {
  getCharactersForStory as dbGetCharactersForStory,
  getLocationsForStory as dbGetLocationsForStory,
  getTimelinesForStory as dbGetTimelinesForStory,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

interface RelatedEntities {
  characters: any[]
  locations: any[]
  timelines: any[]
}

export default async function getRelatedEntities({
  storyId,
}: {
  storyId: number
}): Promise<RelatedEntities> {
  try {
    const client = await pool.connect()
    try {
      const [characters, locations, timelines] = await Promise.all([
        dbGetCharactersForStory(client, { storyId }),
        dbGetLocationsForStory(client, { storyId }),
        dbGetTimelinesForStory(client, { storyId }),
      ])

      return {
        characters: characters || [],
        locations: locations || [],
        timelines: timelines || [],
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching related entities:', error)
    return { characters: [], locations: [], timelines: [] }
  }
}
```

**Step 6: Run test to verify it passes**

Run: `cd apps/next && pnpm vitest actions/relationships/__tests__/getRelatedEntities.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/database/queries/relationships.sql apps/database/sqlc/ apps/next/actions/relationships/
git commit -m "feat: add relationship queries and getRelatedEntities action"
```

---

### Task 2.3: Permission Check Actions

**Files:**

- Create: `apps/next/actions/permissions/canUserViewEntity.ts`
- Create: `apps/next/actions/permissions/canUserEditEntity.ts`
- Test: `apps/next/actions/permissions/__tests__/canUserViewEntity.test.ts`
- Test: `apps/next/actions/permissions/__tests__/canUserEditEntity.test.ts`

**Step 1: Write failing test for canUserViewEntity**

```typescript
import { describe, it, expect } from 'vitest'
import canUserViewEntity from '../canUserViewEntity'

describe('canUserViewEntity', () => {
  it('should allow owner to view own entity', () => {
    const result = canUserViewEntity({
      viewerId: 'user-1',
      ownerId: 'user-1',
      privacy: 'private',
    })
    expect(result).toBe(true)
  })

  it('should allow anyone to view public entity', () => {
    const result = canUserViewEntity({
      viewerId: 'user-2',
      ownerId: 'user-1',
      privacy: 'public',
    })
    expect(result).toBe(true)
  })

  it('should deny viewing private entity by non-owner', () => {
    const result = canUserViewEntity({
      viewerId: 'user-2',
      ownerId: 'user-1',
      privacy: 'private',
    })
    expect(result).toBe(false)
  })

  it('should deny unauthenticated users viewing private entities', () => {
    const result = canUserViewEntity({
      viewerId: undefined,
      ownerId: 'user-1',
      privacy: 'private',
    })
    expect(result).toBe(false)
  })

  it('should allow unauthenticated users viewing public entities', () => {
    const result = canUserViewEntity({
      viewerId: undefined,
      ownerId: 'user-1',
      privacy: 'public',
    })
    expect(result).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd apps/next && pnpm vitest actions/permissions/__tests__/canUserViewEntity.test.ts`
Expected: FAIL

**Step 3: Implement canUserViewEntity**

```typescript
'use server'

interface CanUserViewEntityArgs {
  viewerId?: string
  ownerId: string
  privacy: 'public' | 'private'
}

export default async function canUserViewEntity({
  viewerId,
  ownerId,
  privacy,
}: CanUserViewEntityArgs): Promise<boolean> {
  // Owner can always view
  if (viewerId === ownerId) {
    return true
  }

  // Public entities can be viewed by anyone
  if (privacy === 'public') {
    return true
  }

  // Private entities can only be viewed by owner
  return false
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/next && pnpm vitest actions/permissions/__tests__/canUserViewEntity.test.ts`
Expected: PASS

**Step 5: Write failing test for canUserEditEntity**

```typescript
import { describe, it, expect } from 'vitest'
import canUserEditEntity from '../canUserEditEntity'

describe('canUserEditEntity', () => {
  it('should allow owner to edit own entity', () => {
    const result = canUserEditEntity({
      userId: 'user-1',
      ownerId: 'user-1',
    })
    expect(result).toBe(true)
  })

  it('should deny non-owner editing', () => {
    const result = canUserEditEntity({
      userId: 'user-2',
      ownerId: 'user-1',
    })
    expect(result).toBe(false)
  })

  it('should deny unauthenticated users editing', () => {
    const result = canUserEditEntity({
      userId: undefined,
      ownerId: 'user-1',
    })
    expect(result).toBe(false)
  })
})
```

**Step 6: Run test to verify it fails**

Run: `cd apps/next && pnpm vitest actions/permissions/__tests__/canUserEditEntity.test.ts`
Expected: FAIL

**Step 7: Implement canUserEditEntity**

```typescript
'use server'

interface CanUserEditEntityArgs {
  userId?: string
  ownerId: string
}

export default async function canUserEditEntity({
  userId,
  ownerId,
}: CanUserEditEntityArgs): Promise<boolean> {
  // Only owner can edit
  return userId === ownerId
}
```

**Step 8: Run test to verify it passes**

Run: `cd apps/next && pnpm vitest actions/permissions/__tests__/canUserEditEntity.test.ts`
Expected: PASS

**Step 9: Commit**

```bash
git add apps/next/actions/permissions/
git commit -m "feat: add permission check actions for view and edit"
```

---

## Phase 3: Update User Detail Page (ContentSection)

### Task 3.1: Make ContentSection Cards Clickable

**Files:**

- Modify: `packages/app/features/user/components/ContentSection.tsx:65-82`
- Modify: `packages/app/features/user/components/ContentSection.styles.ts`
- Test: `packages/app/features/user/components/__tests__/ContentSection.test.tsx`

**Step 1: Write failing test**

Add to existing test file:

```typescript
it('should make item cards clickable with links', () => {
  const items = [
    { id: 1, title: 'Story 1', description: 'Desc 1', userid: 'user-1' }
  ]

  render(
    <ContentSection
      title="Stories"
      entityType="story"
      items={items}
      isLoading={false}
      onAddNew={() => {}}
      theme="light"
      userId="user-1"
    />
  )

  const card = screen.getByText('Story 1').closest('a')
  expect(card).toHaveAttribute('href', '/user-1/stories/1')
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/app && pnpm vitest features/user/components/__tests__/ContentSection.test.tsx`
Expected: FAIL

**Step 3: Update ContentSection interface**

```typescript
interface ContentSectionProps {
  title: string
  entityType: 'story' | 'character' | 'timeline' | 'location'
  items: ContentItem[]
  isLoading: boolean
  onAddNew: () => void
  theme?: string
  userId: string // Add userId prop
}
```

**Step 4: Update ContentSection to use Link**

```typescript
import Link from 'next/link'

// In renderItems function:
const renderItems = () => (
  <ItemsGrid>
    {items.map((item) => {
      const displayName = item.name || item.title || 'Untitled'
      const entityPath = entityType === 'timeline' ? 'timelines' : `${entityType}s`
      const href = `/${userId}/${entityPath}/${item.id}`

      return (
        <Link key={item.id} href={href} style={{ textDecoration: 'none' }}>
          <ItemCard $theme={theme}>
            <ItemTitle $theme={theme}>{displayName}</ItemTitle>
            {item.description && (
              <ItemDescription $theme={theme}>
                {item.description}
              </ItemDescription>
            )}
          </ItemCard>
        </Link>
      )
    })}
  </ItemsGrid>
)
```

**Step 5: Update ItemCard styles for hover**

```typescript
export const ItemCard = styled.div<{ $theme?: string }>`
  background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#ffffff')};
  border: 1px solid ${({ $theme }) =>
      $theme === 'dark' ? '#374151' : '#e5e7eb'};
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${({ $theme }) =>
      $theme === 'dark' ? '#60a5fa' : '#3b82f6'};
  }
`
```

**Step 6: Run test to verify it passes**

Run: `cd packages/app && pnpm vitest features/user/components/__tests__/ContentSection.test.tsx`
Expected: PASS

**Step 7: Update user detail screen to pass userId**

Modify `packages/app/features/user/detail-screen.tsx` to pass userId prop:

```typescript
<ContentSection
  title="Stories"
  entityType="story"
  items={stories}
  isLoading={isLoading}
  onAddNew={() => handleAddNew('stories')}
  theme={resolvedTheme}
  userId={id}  // Add userId
/>
```

**Step 8: Commit**

```bash
git add packages/app/features/user/
git commit -m "feat: make ContentSection cards clickable with entity links"
```

---

### Task 3.2: Add "View All" Link to ContentSection Header

**Files:**

- Modify: `packages/app/features/user/components/ContentSection.tsx:84-91`
- Test: `packages/app/features/user/components/__tests__/ContentSection.test.tsx`

**Step 1: Write failing test**

```typescript
it('should display "View All" link in section header', () => {
  render(
    <ContentSection
      title="Stories"
      entityType="story"
      items={[{ id: 1, title: 'Story 1' }]}
      isLoading={false}
      onAddNew={() => {}}
      theme="light"
      userId="user-1"
    />
  )

  const viewAllLink = screen.getByText(/view all stories/i)
  expect(viewAllLink).toHaveAttribute('href', '/user-1/stories')
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/app && pnpm vitest features/user/components/__tests__/ContentSection.test.tsx`
Expected: FAIL

**Step 3: Update SectionHeader component**

```typescript
import Link from 'next/link'

// Update return statement:
return (
  <SectionWrapper>
    <SectionHeader className="p-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <SectionTitle $theme={theme}>{title}</SectionTitle>
        <Link
          href={`/${userId}/${entityType === 'timeline' ? 'timelines' : `${entityType}s`}`}
          style={{
            fontSize: '14px',
            color: theme === 'dark' ? '#60a5fa' : '#3b82f6',
            textDecoration: 'none'
          }}
        >
          View All →
        </Link>
      </div>
      <Button onClick={onAddNew} size="sm">
        New {entityLabel}
      </Button>
    </SectionHeader>
    {/* rest of component */}
  </SectionWrapper>
)
```

**Step 4: Run test to verify it passes**

Run: `cd packages/app && pnpm vitest features/user/components/__tests__/ContentSection.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/app/features/user/components/
git commit -m "feat: add View All link to ContentSection header"
```

---

## Phase 4: Stories List Page

### Task 4.1: Create Stories List Screen Component

**Files:**

- Create: `packages/app/features/stories/list-screen.tsx`
- Create: `packages/app/features/stories/components/StoriesGrid.tsx`
- Create: `packages/app/features/stories/components/StoriesGrid.styles.ts`
- Test: `packages/app/features/stories/__tests__/list-screen.test.tsx`

**Step 1: Write failing test**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StoriesListScreen } from '../list-screen'

describe('StoriesListScreen', () => {
  const mockStories = [
    {
      id: 1,
      title: 'Story 1',
      content: 'Content 1',
      privacy: 'public',
      userid: 'user-1',
      created_at: new Date()
    }
  ]

  it('should render stories grid', () => {
    render(
      <StoriesListScreen
        stories={mockStories}
        userId="user-1"
        isOwner={true}
      />
    )

    expect(screen.getByText('Story 1')).toBeInTheDocument()
  })

  it('should show create button for owner', () => {
    render(
      <StoriesListScreen
        stories={mockStories}
        userId="user-1"
        isOwner={true}
      />
    )

    expect(screen.getByText(/new story/i)).toBeInTheDocument()
  })

  it('should hide create button for non-owner', () => {
    render(
      <StoriesListScreen
        stories={mockStories}
        userId="user-1"
        isOwner={false}
      />
    )

    expect(screen.queryByText(/new story/i)).not.toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/app && pnpm vitest features/stories/__tests__/list-screen.test.tsx`
Expected: FAIL

**Step 3: Create StoriesGrid styles**

```typescript
import styled from 'styled-components'

export const GridWrapper = styled.div`
  padding: 24px;
`

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`

export const Title = styled.h1<{ $theme?: string }>`
  font-size: 32px;
  font-weight: 700;
  color: ${({ $theme }) => ($theme === 'dark' ? '#f9fafb' : '#111827')};
`

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`

export const StoryCard = styled.div<{ $theme?: string }>`
  background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#ffffff')};
  border: 1px solid ${({ $theme }) =>
      $theme === 'dark' ? '#374151' : '#e5e7eb'};
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`

export const StoryTitle = styled.h2<{ $theme?: string }>`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${({ $theme }) => ($theme === 'dark' ? '#f9fafb' : '#111827')};
`

export const StoryContent = styled.p<{ $theme?: string }>`
  font-size: 14px;
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
  line-height: 1.5;
`

export const PrivacyBadge = styled.span<{
  $isPublic: boolean
  $theme?: string
}>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-top: 12px;
  background: ${({ $isPublic, $theme }) =>
    $isPublic
      ? $theme === 'dark'
        ? '#065f46'
        : '#d1fae5'
      : $theme === 'dark'
      ? '#374151'
      : '#f3f4f6'};
  color: ${({ $isPublic, $theme }) =>
    $isPublic
      ? $theme === 'dark'
        ? '#34d399'
        : '#059669'
      : $theme === 'dark'
      ? '#9ca3af'
      : '#6b7280'};
`
```

**Step 4: Create StoriesGrid component**

```typescript
'use client'

import Link from 'next/link'
import {
  Grid,
  StoryCard,
  StoryTitle,
  StoryContent,
  PrivacyBadge,
} from './StoriesGrid.styles'

interface Story {
  id: number
  title: string
  content: string
  privacy: 'public' | 'private'
  userid: string
  created_at: Date
}

interface StoriesGridProps {
  stories: Story[]
  userId: string
  theme?: string
}

export function StoriesGrid({ stories, userId, theme }: StoriesGridProps) {
  return (
    <Grid>
      {stories.map((story) => (
        <Link
          key={story.id}
          href={`/${userId}/stories/${story.id}`}
          style={{ textDecoration: 'none' }}
        >
          <StoryCard $theme={theme}>
            <StoryTitle $theme={theme}>{story.title}</StoryTitle>
            <StoryContent $theme={theme}>
              {story.content.substring(0, 150)}
              {story.content.length > 150 && '...'}
            </StoryContent>
            <PrivacyBadge $isPublic={story.privacy === 'public'} $theme={theme}>
              {story.privacy === 'public' ? '🌐 Public' : '🔒 Private'}
            </PrivacyBadge>
          </StoryCard>
        </Link>
      ))}
    </Grid>
  )
}
```

**Step 5: Create StoriesListScreen**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/components/ui/button'
import { StoriesGrid } from './components/StoriesGrid'
import { GridWrapper, Header, Title } from './components/StoriesGrid.styles'

interface Story {
  id: number
  title: string
  content: string
  privacy: 'public' | 'private'
  userid: string
  created_at: Date
}

interface StoriesListScreenProps {
  stories: Story[]
  userId: string
  isOwner: boolean
  theme?: string
}

export function StoriesListScreen({
  stories,
  userId,
  isOwner,
  theme,
}: StoriesListScreenProps) {
  const router = useRouter()

  return (
    <GridWrapper>
      <Header>
        <Title $theme={theme}>Stories</Title>
        {isOwner && (
          <Button onClick={() => router.push('/create/stories')}>
            New Story
          </Button>
        )}
      </Header>
      <StoriesGrid stories={stories} userId={userId} theme={theme} />
    </GridWrapper>
  )
}
```

**Step 6: Run test to verify it passes**

Run: `cd packages/app && pnpm vitest features/stories/__tests__/list-screen.test.tsx`
Expected: PASS

**Step 7: Commit**

```bash
git add packages/app/features/stories/
git commit -m "feat: create stories list screen component"
```

---

### Task 4.2: Create Stories List Page Route

**Files:**

- Create: `apps/next/app/[userId]/stories/page.tsx`

**Step 1: Create Next.js page (Server Component)**

```typescript
import { notFound } from 'next/navigation'
import { auth } from '../../../auth'
import { StoriesListScreen } from '@app/features/stories/list-screen'
import listStoriesForUser from '../../../actions/user/listStoriesForUser'

interface PageProps {
  params: Promise<{ userId: string }>
}

export default async function StoriesListPage({ params }: PageProps) {
  const { userId } = await params
  const session = await auth()

  // Fetch stories with privacy filtering
  const stories = await listStoriesForUser({
    userid: userId,
    viewerid: session?.user?.id || null,
  })

  if (!stories) {
    notFound()
  }

  const isOwner = session?.user?.id === userId

  return (
    <StoriesListScreen
      stories={stories}
      userId={userId}
      isOwner={isOwner}
    />
  )
}
```

**Step 2: Update listStoriesForUser action to support privacy**

Modify `apps/next/actions/user/listStoriesForUser.ts`:

```typescript
'use server'
import {
  listStoriesForUserWithPrivacy as dbListStories,
  ListStoriesForUserWithPrivacyArgs,
} from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function listStoriesForUser(args: {
  userid: string
  viewerid?: string | null
}) {
  try {
    const client = await pool.connect()
    try {
      const stories = await dbListStories(client, {
        userid: args.userid,
        viewerid: args.viewerid || args.userid,
      })
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

**Step 3: Test manually**

Run: `cd apps/next && pnpm dev`
Navigate to: `http://localhost:3000/{userId}/stories`
Expected: Stories list page renders

**Step 4: Commit**

```bash
git add apps/next/app/[userId]/stories/ apps/next/actions/user/listStoriesForUser.ts
git commit -m "feat: create stories list page route with privacy filtering"
```

---

## Phase 5: Story Detail Page (View Mode)

### Task 5.1: Create Story Detail Screen Component (View Mode)

**Files:**

- Create: `packages/app/features/stories/detail-screen.tsx`
- Create: `packages/app/features/stories/components/StoryDetail.tsx`
- Create: `packages/app/features/stories/components/StoryDetail.styles.ts`
- Test: `packages/app/features/stories/__tests__/detail-screen.test.tsx`

**Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StoryDetailScreen } from '../detail-screen'

describe('StoryDetailScreen', () => {
  const mockStory = {
    id: 1,
    title: 'Test Story',
    content: 'Story content here',
    privacy: 'private' as const,
    userid: 'user-1',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-02'),
  }

  it('should render story details in view mode', () => {
    render(
      <StoryDetailScreen
        story={mockStory}
        relatedEntities={{ characters: [], locations: [], timelines: [] }}
        isOwner={false}
        isEditMode={false}
      />
    )

    expect(screen.getByText('Test Story')).toBeInTheDocument()
    expect(screen.getByText('Story content here')).toBeInTheDocument()
  })

  it('should show edit button for owner', () => {
    render(
      <StoryDetailScreen
        story={mockStory}
        relatedEntities={{ characters: [], locations: [], timelines: [] }}
        isOwner={true}
        isEditMode={false}
      />
    )

    expect(screen.getByText(/edit/i)).toBeInTheDocument()
  })

  it('should hide edit button for non-owner', () => {
    render(
      <StoryDetailScreen
        story={mockStory}
        relatedEntities={{ characters: [], locations: [], timelines: [] }}
        isOwner={false}
        isEditMode={false}
      />
    )

    expect(screen.queryByText(/edit/i)).not.toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/app && pnpm vitest features/stories/__tests__/detail-screen.test.tsx`
Expected: FAIL

**Step 3: Create StoryDetail styles**

```typescript
import styled from 'styled-components'

export const DetailWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
`

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 20px;
`

export const TitleSection = styled.div`
  flex: 1;
`

export const Title = styled.h1<{ $theme?: string }>`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
  color: ${({ $theme }) => ($theme === 'dark' ? '#f9fafb' : '#111827')};
`

export const Metadata = styled.div<{ $theme?: string }>`
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: ${({ $theme }) => ($theme === 'dark' ? '#9ca3af' : '#6b7280')};
`

export const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`

export const Content = styled.div<{ $theme?: string }>`
  font-size: 16px;
  line-height: 1.8;
  color: ${({ $theme }) => ($theme === 'dark' ? '#e5e7eb' : '#374151')};
  white-space: pre-wrap;
  margin-bottom: 32px;
`

export const ToggleButton = styled.button<{ $theme?: string }>`
  width: 100%;
  padding: 16px;
  background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#f9fafb')};
  border: 1px solid ${({ $theme }) =>
      $theme === 'dark' ? '#374151' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: ${({ $theme }) => ($theme === 'dark' ? '#f9fafb' : '#111827')};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#f3f4f6')};
  }
`
```

**Step 4: Create StoryDetail component**

```typescript
'use client'

import { Button } from '@repo/ui/components/ui/button'
import {
  DetailWrapper,
  Header,
  TitleSection,
  Title,
  Metadata,
  ActionButtons,
  Content,
} from './StoryDetail.styles'

interface Story {
  id: number
  title: string
  content: string
  privacy: 'public' | 'private'
  userid: string
  created_at: Date
  updated_at: Date
}

interface StoryDetailProps {
  story: Story
  isOwner: boolean
  onEdit?: () => void
  onDelete?: () => void
  onTogglePrivacy?: () => void
  theme?: string
}

export function StoryDetail({
  story,
  isOwner,
  onEdit,
  onDelete,
  onTogglePrivacy,
  theme,
}: StoryDetailProps) {
  return (
    <DetailWrapper>
      <Header>
        <TitleSection>
          <Title $theme={theme}>{story.title}</Title>
          <Metadata $theme={theme}>
            <span>Created: {new Date(story.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Updated: {new Date(story.updated_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>{story.privacy === 'public' ? '🌐 Public' : '🔒 Private'}</span>
          </Metadata>
        </TitleSection>
        {isOwner && (
          <ActionButtons>
            <Button onClick={onEdit} variant="default">
              Edit
            </Button>
            <Button onClick={onTogglePrivacy} variant="outline">
              {story.privacy === 'public' ? '🔒 Make Private' : '🌐 Make Public'}
            </Button>
            <Button onClick={onDelete} variant="destructive">
              Delete
            </Button>
          </ActionButtons>
        )}
      </Header>
      <Content $theme={theme}>{story.content}</Content>
    </DetailWrapper>
  )
}
```

**Step 5: Create StoryDetailScreen**

```typescript
'use client'

import { useState } from 'react'
import { StoryDetail } from './components/StoryDetail'
import { ToggleButton } from './components/StoryDetail.styles'

interface Story {
  id: number
  title: string
  content: string
  privacy: 'public' | 'private'
  userid: string
  created_at: Date
  updated_at: Date
}

interface RelatedEntities {
  characters: any[]
  locations: any[]
  timelines: any[]
}

interface StoryDetailScreenProps {
  story: Story
  relatedEntities: RelatedEntities
  isOwner: boolean
  isEditMode: boolean
  theme?: string
}

export function StoryDetailScreen({
  story,
  relatedEntities,
  isOwner,
  isEditMode,
  theme,
}: StoryDetailScreenProps) {
  const [showRelated, setShowRelated] = useState(false)

  return (
    <div>
      <StoryDetail
        story={story}
        isOwner={isOwner}
        onEdit={() => console.log('Edit')}
        onDelete={() => console.log('Delete')}
        onTogglePrivacy={() => console.log('Toggle privacy')}
        theme={theme}
      />

      <ToggleButton $theme={theme} onClick={() => setShowRelated(!showRelated)}>
        {showRelated ? 'Hide Related Entities ▲' : 'Show Related Entities ▼'}
      </ToggleButton>

      {showRelated && (
        <div style={{ marginTop: '24px' }}>
          <p>Related entities grid will go here</p>
        </div>
      )}
    </div>
  )
}
```

**Step 6: Run test to verify it passes**

Run: `cd packages/app && pnpm vitest features/stories/__tests__/detail-screen.test.tsx`
Expected: PASS

**Step 7: Commit**

```bash
git add packages/app/features/stories/
git commit -m "feat: create story detail screen component (view mode)"
```

---

### Task 5.2: Create Story Detail Page Route

**Files:**

- Create: `apps/next/app/[userId]/stories/[storyId]/page.tsx`

**Step 1: Create Next.js page**

```typescript
import { notFound } from 'next/navigation'
import { auth } from '../../../../auth'
import { StoryDetailScreen } from '@app/features/stories/detail-screen'
import getStoryById from '../../../../actions/stories/getStoryById'
import getRelatedEntities from '../../../../actions/relationships/getRelatedEntities'
import canUserViewEntity from '../../../../actions/permissions/canUserViewEntity'

interface PageProps {
  params: Promise<{ userId: string; storyId: string }>
}

export default async function StoryDetailPage({ params }: PageProps) {
  const { userId, storyId } = await params
  const session = await auth()

  // Fetch story
  const story = await getStoryById({ id: parseInt(storyId) })

  if (!story) {
    notFound()
  }

  // Check permissions
  const canView = await canUserViewEntity({
    viewerId: session?.user?.id,
    ownerId: story.userid,
    privacy: story.privacy as 'public' | 'private',
  })

  if (!canView) {
    notFound()
  }

  // Fetch related entities
  const relatedEntities = await getRelatedEntities({
    storyId: parseInt(storyId)
  })

  const isOwner = session?.user?.id === story.userid

  return (
    <StoryDetailScreen
      story={story}
      relatedEntities={relatedEntities}
      isOwner={isOwner}
      isEditMode={false}
    />
  )
}
```

**Step 2: Test manually**

Run: `cd apps/next && pnpm dev`
Navigate to: `http://localhost:3000/{userId}/stories/{storyId}`
Expected: Story detail page renders

**Step 3: Commit**

```bash
git add apps/next/app/[userId]/stories/[storyId]/
git commit -m "feat: create story detail page route with permissions"
```

---

## Remaining Phases (Summary)

Due to plan length, here are the remaining phases to implement:

**Phase 6: Edit Mode Implementation**

- Task 6.1: Create useStoryEdit hook
- Task 6.2: Create StoryForm component
- Task 6.3: Add unsaved changes detection (useUnsavedChanges hook)
- Task 6.4: Create UnsavedChangesModal component
- Task 6.5: Integrate edit mode into StoryDetailScreen

**Phase 7: Related Entities Grid**

- Task 7.1: Create RelatedEntitiesGrid component
- Task 7.2: Create AddExistingModal component
- Task 7.3: Create CreateNewModal component
- Task 7.4: Implement link/unlink actions

**Phase 8: Character, Location, Timeline Entities**

- Task 8.1: Duplicate story structure for characters
- Task 8.2: Duplicate story structure for locations
- Task 8.3: Duplicate story structure for timelines

**Phase 9: E2E Testing**

- Task 9.1: User journey - View public story
- Task 9.2: User journey - Create and edit story
- Task 9.3: User journey - Unsaved changes modal
- Task 9.4: User journey - Toggle privacy
- Task 9.5: User journey - Create and link entities

**Phase 10: Polish & Optimization**

- Task 10.1: Loading states
- Task 10.2: Error boundaries
- Task 10.3: Optimistic updates
- Task 10.4: Accessibility audit
- Task 10.5: Performance optimization

---

## Testing Commands

```bash
# Run all tests
pnpm test

# Run specific test file
cd packages/app && pnpm vitest features/stories/__tests__/detail-screen.test.tsx

# Run tests in watch mode
pnpm vitest --watch

# Run E2E tests
cd apps/next && pnpm playwright test
```

## Build Commands

```bash
# Build all packages
pnpm build

# Run development server
cd apps/next && pnpm dev
```

## Git Workflow

- Commit after each completed task
- Use conventional commit format: `feat:`, `fix:`, `test:`, `refactor:`
- Include co-author in commits: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
- Push to remote after completing each phase

---

**Implementation Notes:**

1. **TDD Required:** Write test first, see it fail, implement, see it pass
2. **YAGNI:** Only implement what's in the spec, no extra features
3. **DRY:** Extract shared logic to hooks and utilities
4. **Frequent Commits:** Commit after each task completion
5. **80% Coverage:** Maintain test coverage above 80%
6. **No console.log:** Remove all console statements before committing
7. **Immutability:** Always create new objects, never mutate existing
