# Entity Detail Pages & Navigation Design

**Date:** 2026-01-30
**Status:** Approved
**Author:** Design Session with User

## Overview

Add comprehensive entity detail pages and navigation for all entity types (stories, characters, locations, timelines). Each entity gets its own list page and detail page with editing capabilities, relationship management, and privacy controls.

## URL Structure

Using shorter path without "user" prefix:

- `/{userId}/stories` - List all stories for user
- `/{userId}/stories/{storyId}` - Individual story detail
- `/{userId}/characters` - List all characters for user
- `/{userId}/characters/{characterId}` - Individual character detail
- `/{userId}/locations` - List all locations for user
- `/{userId}/locations/{locationId}` - Individual location detail
- `/{userId}/timelines` - List all timelines for user
- `/{userId}/timelines/{timelineId}` - Individual timeline detail

## Architecture

### Next.js App Router Structure

```
apps/next/app/
  [userId]/
    stories/
      page.tsx                    # List view (Server Component)
      [storyId]/
        page.tsx                  # Detail view (Server Component)
    characters/
      page.tsx
      [characterId]/
        page.tsx
    locations/
      page.tsx
      [locationId]/
        page.tsx
    timelines/
      page.tsx
      [timelineId]/
        page.tsx
```

### Component Organization

```
packages/app/features/
  stories/
    list-screen.tsx               # Stories list page (Client Component)
    detail-screen.tsx             # Story detail page (Client Component)
    components/
      StoryForm.tsx               # Edit form
      RelatedEntities.tsx         # Grid of related entities
      AddExistingModal.tsx        # Link existing entities
      CreateNewModal.tsx          # Create and link new entity
    hooks/
      useStoryEdit.ts             # Edit mode state management
      useUnsavedChanges.ts        # Unsaved changes detection
      useRelatedEntities.ts       # Fetch and manage relationships
  characters/
    [similar structure]
  locations/
    [similar structure]
  timelines/
    [similar structure]
```

## Feature Details

### 1. List Pages (`/{userId}/stories`)

**Display Components:**

- User context: Avatar, name, breadcrumb (Home > User Name > Stories)
- Search/filter bar
- Sort options (newest, oldest, A-Z, recently edited)
- Grid of entity cards
- Privacy indicator on each card (🔒 private, 🌐 public)

**Permissions-Based UI:**

- Own content: "Create New Story" button visible
- Others' content: Button hidden, read-only mode
- Public entities visible to all
- Private entities only visible to owner

**Card Interaction:**

- Click card → navigate to detail page
- Hover shows preview tooltip (first 100 chars of description)

**Updates to User Detail Page:**

- Make entity cards clickable (Link to detail page)
- Add "View All Stories →" link in section header
- Keep current grid layout and "New Story" button

### 2. Detail Pages (`/{userId}/stories/{storyId}`)

**Layout Structure:**

**Top Section: Entity Details**

- Header with entity name (editable in edit mode)
- Metadata: Created date, last modified, privacy status
- Action buttons (owner only):
  - "Edit" button (switches to edit mode)
  - Privacy toggle (🔒/🌐)
  - "Delete" button
  - "Back to Stories" breadcrumb link

**Main Content Area - View Mode:**

- Title (large, prominent)
- Description (rich text display)
- Content/body (markdown or rich text display)
- Custom fields based on entity type

**Main Content Area - Edit Mode:**

- All fields become editable forms
- Rich text editor for description/content
- Form validation (required fields, character limits)
- Action buttons:
  - "Save Changes" (primary button)
  - "Cancel" (secondary, discards changes)
  - Unsaved indicator if modified

**Toggle Button:**

- "Show Related Entities ▼" / "Hide Related Entities ▲"
- Positioned below main content
- Remembers state in localStorage per user

**Related Entities Grid (when visible):**

- Same resizable panel layout as user detail page
- 2x2 grid: Characters, Locations, Timelines, [other relevant type]
- Each panel shows related entities only
- "Add Existing" and "Create New" buttons in each panel header

### 3. Editing Flow

**Entering Edit Mode:**

1. User clicks "Edit" button
2. Page transitions to edit mode
3. All fields become form inputs
4. "Edit" button disappears
5. "Save" and "Cancel" buttons appear
6. Related entities grid is hidden (focus on editing)

**Saving Changes:**

1. User clicks "Save Changes"
2. Validate all fields
3. If valid: Save to database, show success toast, return to view mode
4. If invalid: Show inline error messages, stay in edit mode

**Canceling Edit:**

1. User clicks "Cancel"
2. If no changes: Return to view mode immediately
3. If changes detected: Show custom modal:
   - "You have unsaved changes"
   - "Save Changes" button (save and exit)
   - "Discard Changes" button (revert and exit)
   - "Keep Editing" button (stay in edit mode)

**Navigation with Unsaved Changes:**

- Intercept route changes (Next.js router events)
- Show same modal as Cancel flow
- Prevent navigation until user chooses action

### 4. Relationship Management

**Add Existing Entity:**

1. Click "Add Existing" in Characters panel
2. Modal opens with searchable list of user's characters
3. Filter by already linked (disabled/grayed out)
4. Select character(s), click "Add"
5. Creates relationship, updates grid immediately

**Create New Entity:**

1. Click "Create New" in Characters panel
2. Modal with character creation form (minimal fields: name, description)
3. Click "Create and Link"
4. Creates character, links to current story, updates grid
5. Option to "Go to Character Detail" or "Stay Here"

**Unlinking Entities:**

- Each entity card in related grid has "×" remove button (owner only)
- Click "×" → confirmation dialog
- Removes relationship only (doesn't delete the entity)

### 5. Privacy & Permissions

**Privacy Model:**

- Add `privacy` field to all entities: `'public' | 'private'`
- Default to `'private'` for new entities
- Simple model (can add more granularity later)

**Privacy Toggle (Owner Only):**

- Icon button in header: 🔒 (private) or 🌐 (public)
- Click to toggle
- Shows confirmation: "Make this story public? Anyone can view it."
- Updates immediately, shows success toast

**Access Control Rules:**

| Action         | Own Entity | Public Entity  | Private Entity (Others) |
| -------------- | ---------- | -------------- | ----------------------- |
| View List      | ✅ All     | ✅ Public only | ❌ Hidden               |
| View Detail    | ✅ Yes     | ✅ Yes         | ❌ 404 error            |
| Edit           | ✅ Yes     | ❌ No          | ❌ No                   |
| Delete         | ✅ Yes     | ❌ No          | ❌ No                   |
| Change Privacy | ✅ Yes     | ❌ No          | ❌ No                   |
| Link/Unlink    | ✅ Yes     | ❌ No          | ❌ No                   |

**Privacy Indicators:**

- List pages: Small icon on each card (🔒 or 🌐)
- Detail pages: Badge in header next to entity name
- Color coding: gray for private, green for public

## Data Flow & API

### Server Actions

**Entity CRUD Operations** (for each entity type):

```
apps/next/actions/stories/
  getStoryById.ts          # Fetch single story
  listStoriesForUser.ts    # Already exists
  createStory.ts           # Create new story
  updateStory.ts           # Update existing story
  deleteStory.ts           # Delete story
  toggleStoryPrivacy.ts    # Toggle public/private
```

**Relationship Operations:**

```
apps/next/actions/relationships/
  linkEntitiesToStory.ts        # Link characters/locations to story
  unlinkEntityFromStory.ts      # Remove relationship
  getRelatedEntities.ts         # Get all related entities for a story
```

**Permission Checks:**

```
apps/next/actions/permissions/
  canUserViewEntity.ts     # Check if user can view entity
  canUserEditEntity.ts     # Check if user can edit entity
```

### Data Fetching Strategy

**List Pages (Server Components):**

```typescript
// app/[userId]/stories/page.tsx
async function StoriesListPage({ params }: { params: { userId: string } }) {
  const session = await auth()
  const stories = await listStoriesForUser({
    userId: params.userId,
    viewerId: session?.user?.id,
    includePrivate: session?.user?.id === params.userId
  })

  return <StoriesListScreen stories={stories} userId={params.userId} />
}
```

**Detail Pages (Server Components):**

```typescript
// app/[userId]/stories/[storyId]/page.tsx
async function StoryDetailPage({ params }) {
  const session = await auth()
  const story = await getStoryById({ id: params.storyId })

  const canView = await canUserViewEntity({
    entityId: params.storyId,
    viewerId: session?.user?.id,
    privacy: story.privacy,
    ownerId: story.userId
  })

  if (!canView) notFound()

  const relatedEntities = await getRelatedEntities({ storyId: params.storyId })

  return <StoryDetailScreen story={story} related={relatedEntities} />
}
```

**Client-Side Updates:**

- Use server actions from client components
- Optimistic updates for better UX
- Revalidate cache after mutations

## Database Schema Updates

### Add Privacy Field

```sql
-- Add privacy column to all entity tables
ALTER TABLE stories ADD COLUMN privacy VARCHAR(10) DEFAULT 'private';
ALTER TABLE characters ADD COLUMN privacy VARCHAR(10) DEFAULT 'private';
ALTER TABLE locations ADD COLUMN privacy VARCHAR(10) DEFAULT 'private';
ALTER TABLE timelines ADD COLUMN privacy VARCHAR(10) DEFAULT 'private';

-- Add index for filtering by privacy
CREATE INDEX idx_stories_privacy ON stories(privacy);
CREATE INDEX idx_characters_privacy ON characters(privacy);
CREATE INDEX idx_locations_privacy ON locations(privacy);
CREATE INDEX idx_timelines_privacy ON timelines(privacy);

-- Add constraint to ensure valid values
ALTER TABLE stories ADD CONSTRAINT check_stories_privacy
  CHECK (privacy IN ('public', 'private'));
ALTER TABLE characters ADD CONSTRAINT check_characters_privacy
  CHECK (privacy IN ('public', 'private'));
ALTER TABLE locations ADD CONSTRAINT check_locations_privacy
  CHECK (privacy IN ('public', 'private'));
ALTER TABLE timelines ADD CONSTRAINT check_timelines_privacy
  CHECK (privacy IN ('public', 'private'));
```

### Relationship Tables

```sql
-- Story-Character relationships
CREATE TABLE IF NOT EXISTS story_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(story_id, character_id)
);

-- Story-Location relationships
CREATE TABLE IF NOT EXISTS story_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(story_id, location_id)
);

-- Story-Timeline relationships
CREATE TABLE IF NOT EXISTS story_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(story_id, timeline_id)
);
```

### SQLC Queries

**Update existing queries:**

```sql
-- name: ListStoriesForUser :many
SELECT * FROM stories
WHERE userid = $1
  AND (privacy = 'public' OR userid = $2)
ORDER BY created_at DESC;

-- name: GetStoryById :one
SELECT * FROM stories WHERE id = $1;

-- name: UpdateStoryPrivacy :exec
UPDATE stories SET privacy = $2 WHERE id = $1;
```

**New relationship queries:**

```sql
-- name: LinkCharacterToStory :exec
INSERT INTO story_characters (story_id, character_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: UnlinkCharacterFromStory :exec
DELETE FROM story_characters
WHERE story_id = $1 AND character_id = $2;

-- name: GetCharactersForStory :many
SELECT c.* FROM characters c
JOIN story_characters sc ON c.id = sc.character_id
WHERE sc.story_id = $1;
```

## Testing Strategy (80% Coverage)

### Unit Tests

- Server actions (CRUD, permissions, relationships)
- Custom hooks (useEntityEdit, useRelatedEntities, useUnsavedChanges)
- Utility functions (privacy checks, validation)

### Integration Tests

- Entity list pages with different privacy scenarios
- Entity detail pages (view/edit modes)
- Relationship management (link/unlink)
- Privacy toggle functionality

### E2E Tests (Playwright)

1. **User journey 1**: View public story from another user
2. **User journey 2**: Create story → edit → link character → save
3. **User journey 3**: Edit story with unsaved changes → navigate away → modal appears
4. **User journey 4**: Toggle privacy → verify access control
5. **User journey 5**: Create new character from story detail → link relationship

## Implementation Phases

### Phase 1: Database & Server Actions (Foundation)

- Add privacy column migrations
- Create relationship tables
- Write SQLC queries
- Implement server actions (CRUD, permissions, relationships)
- Write unit tests for all server actions

### Phase 2: List Pages (Browse Experience)

- Create routing structure (`[userId]/stories/page.tsx`, etc.)
- Build list screen components
- Update ContentSection to be clickable + "View All" link
- Implement privacy filtering
- Write tests for list pages

### Phase 3: Detail Pages - View Mode (Read Experience)

- Create detail page routes
- Build detail screen components (view mode only)
- Implement related entities grid with toggle
- Add breadcrumbs and navigation
- Write tests for detail pages (read-only)

### Phase 4: Detail Pages - Edit Mode (Write Experience)

- Implement edit mode toggle
- Build edit forms with validation
- Add unsaved changes detection + modal
- Implement privacy toggle
- Write tests for editing flow

### Phase 5: Relationship Management (Connections)

- Build "Add Existing" modal with search
- Build "Create New" modal with forms
- Implement link/unlink functionality
- Write tests for relationship operations

### Phase 6: E2E Testing & Polish (Quality)

- Write all E2E tests
- Add loading states and error handling
- Implement optimistic updates
- Performance optimization
- Accessibility audit

## Future Enhancements

**Phase 7+** (Not in initial scope):

- More granular privacy (share via link, share with specific users)
- Bulk operations (delete multiple, change privacy for multiple)
- Entity templates
- Version history
- Comments/collaboration features
- Export/import functionality

## Success Criteria

- All entity types have list and detail pages
- Users can view, create, edit, and delete their own entities
- Public entities are viewable by all users
- Private entities are only viewable by owners
- Relationships can be created and managed between entities
- 80%+ test coverage across unit, integration, and E2E tests
- No console.log statements in production code
- All code follows immutability patterns
- Forms have proper validation and error handling
- Unsaved changes are protected with confirmation modal
