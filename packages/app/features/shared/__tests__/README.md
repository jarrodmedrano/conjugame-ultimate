# EntityDetailScreen Test Suite

## Overview

Comprehensive test coverage for the `EntityDetailScreen` wrapper component and refactored detail screens.

## Test Files

### 1. EntityDetailScreen.test.tsx

**Location:** `packages/app/features/shared/__tests__/EntityDetailScreen.test.tsx`

Tests the generic wrapper component that powers all entity detail screens.

**Coverage:**

- ✅ Entity prop passing (both `entity` and `[entityType]` keys)
- ✅ Modal state management (edit, unsaved changes, add existing, create new)
- ✅ Entity operations (link, unlink, create)
- ✅ Related entities grid rendering
- ✅ Theme integration
- ✅ All four entity types (story, character, location, timeline)
- ✅ Immutability verification
- ✅ Error handling and toast notifications

**Test Suites:**

1. Rendering
2. Edit Mode
3. Related Entities
4. Entity Operations
5. Unsaved Changes Handling
6. Theme Integration
7. Entity Type Variations
8. Immutability

### 2. CharacterDetailScreen.test.tsx

**Location:** `packages/app/features/characters/detail-screen.test.tsx`

Tests the Character-specific wrapper configuration.

**Coverage:**

- ✅ EntityDetailScreen configuration
- ✅ Character-specific field mapping
- ✅ Custom save handler (name → name, description → description)
- ✅ useCharacterEdit hook integration
- ✅ Privacy field type casting
- ✅ Callback forwarding

**Test Suites:**

1. Configuration
2. Custom Save Handler
3. Entity ID Getter
4. DetailComponent Rendering
5. Callback Forwarding
6. Hook Integration

### 3. StoryDetailScreen.test.tsx

**Location:** `packages/app/features/stories/detail-screen.test.tsx`

Tests the Story-specific wrapper with unique field mapping.

**Coverage:**

- ✅ Story-specific field mapping (name → title, content → content)
- ✅ Date field mapping (createdAt → created_at, updatedAt → updated_at)
- ✅ Custom save handler with title/content fields
- ✅ useStoryEdit hook integration
- ✅ Fallback entity access (entity || story)
- ✅ Empty related entities handling

**Test Suites:**

1. Configuration
2. Custom Save Handler - Field Mapping
3. DetailComponent Rendering - Date Field Mapping
4. RelatedEntities Structure
5. Hook Integration

## Running Tests

### All Tests

```bash
pnpm test
```

### Specific File

```bash
pnpm test EntityDetailScreen
pnpm test CharacterDetailScreen
pnpm test StoryDetailScreen
```

### Watch Mode

```bash
pnpm test:watch
```

### Coverage Report

```bash
pnpm test:coverage
```

## Key Testing Patterns

### 1. Mock Strategy

- Mock child components to isolate wrapper logic
- Spy on prop passing to verify configuration
- Mock hooks to control component state

### 2. Entity Prop Testing

Tests verify that entities are passed with BOTH keys:

```typescript
{
  entity: mockEntity,        // Generic key
  [entityType]: mockEntity,  // Specific key (story, character, etc.)
}
```

This dual-key approach ensures compatibility with both:

- The wrapper's generic handling
- The individual hooks' specific expectations

### 3. Field Mapping Validation

Each entity type test validates correct field mapping:

**Character/Location/Timeline:**

- formData.name → update.name
- formData.description → update.description

**Story (special case):**

- formData.name → update.title
- formData.content → update.content
- createdAt → created_at
- updatedAt → updated_at

### 4. Error Scenarios

All tests include error handling verification:

- Missing onUpdate callback
- Failed update (returns null)
- Missing required entity data

### 5. Immutability

Tests ensure no prop mutation:

```typescript
const original = { ...mockEntity }
render(<Component entity={mockEntity} />)
expect(mockEntity).toEqual(original)
```

## Test Coverage Goals

- **EntityDetailScreen:** 90%+ coverage
- **Individual Screens:** 85%+ coverage (simpler wrappers)
- **Integration:** All entity types tested
- **Edge Cases:** Error states, missing data, type variations

## Adding Tests for New Entity Types

When adding a new entity type (e.g., "event"):

1. Create `event/detail-screen.test.tsx`
2. Copy structure from `CharacterDetailScreen.test.tsx`
3. Update field mappings if different from name/description
4. Add entity type to `EntityDetailScreen.test.tsx` variations
5. Verify hook integration with `useEventEdit`

## Known Testing Limitations

See test file headers for notes about:

- React version conflicts in monorepo
- SSR import issues with @testing-library/react
- Vite SSR workarounds

These issues don't affect runtime behavior, only test execution in some environments.

## Integration with E2E Tests

These unit tests focus on component logic and prop passing. For full integration testing including:

- User interactions
- Visual rendering
- Cross-component data flow
- Router navigation

Refer to the E2E test suite using Playwright's visual-debugger.
