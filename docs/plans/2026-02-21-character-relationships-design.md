# Character Relationships Design

**Date:** 2026-02-21
**Branch:** feat/relations
**Status:** Approved, ready for implementation

---

## Overview

Add character-to-character relationships to the story bible. Characters can be linked to other characters with both predefined family types (parent, sibling, spouse, etc.) and arbitrary custom labels (rival, mentor, ally, etc.). Relationships are auto-bidirectional — storing one row computes the inverse at query time.

---

## Features

- **List view** — Related characters appear in the existing Related Entities section on the character detail page, with a relationship label badge
- **Add relationship modal** — Pick a character + select relationship type (predefined or custom free-text)
- **Visual graph page** — `/[userId]/characters/[characterId]/relationships` shows all relationships as an interactive node graph (react-flow), not just family

---

## Section 1: Database

### New Table: `character_relationships`

```sql
CREATE TABLE character_relationships (
  id SERIAL PRIMARY KEY,
  character_id_a INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  character_id_b INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL,
  custom_label VARCHAR(100),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id_a, character_id_b, relationship_type),
  CHECK (character_id_a != character_id_b)
);

CREATE INDEX idx_char_rel_a ON character_relationships(character_id_a);
CREATE INDEX idx_char_rel_b ON character_relationships(character_id_b);
```

### Predefined `relationship_type` values

| Value          | Display              | Inverse display     |
| -------------- | -------------------- | ------------------- |
| `parent`       | Parent of            | Child of            |
| `child`        | Child of             | Parent of           |
| `sibling`      | Sibling of           | Sibling of          |
| `spouse`       | Spouse of            | Spouse of           |
| `grandparent`  | Grandparent of       | Grandchild of       |
| `grandchild`   | Grandchild of        | Grandparent of      |
| `aunt_uncle`   | Aunt/Uncle of        | Niece/Nephew of     |
| `niece_nephew` | Niece/Nephew of      | Aunt/Uncle of       |
| `cousin`       | Cousin of            | Cousin of           |
| `custom`       | (custom_label value) | (same custom_label) |

### Auto-bidirectional Logic

One row is stored per relationship. At query time:

- If `character_id_a = current_character` → show `relationship_type` label as-is
- If `character_id_b = current_character` → show inverse label (lookup table above)

### Migration file

`apps/database/migration/000009_add_character_relationships.up.sql`

---

## Section 2: Backend

### SQLC Queries

**File:** `apps/database/sqlc/character_relationships.sql`

- `GetCharacterRelationships(character_id)` — fetches all relationships for a character (both `character_id_a` and `character_id_b` directions), joins `characters` and `entity_images` for related character info
- `CreateCharacterRelationship(character_id_a, character_id_b, relationship_type, custom_label, created_by)` — inserts new relationship
- `DeleteCharacterRelationship(id, created_by)` — deletes by id (verifies ownership via created_by)
- `GetCharacterRelationship(id)` — fetch single relationship (for ownership check on delete)

### Server Actions

**Directory:** `apps/next/actions/character-relationships/`

| File                              | Responsibility                                                           |
| --------------------------------- | ------------------------------------------------------------------------ |
| `getCharacterRelationships.ts`    | Fetch relationships, compute inverse labels, return `RelatedCharacter[]` |
| `linkCharacterToCharacter.ts`     | Auth + rate limit + validate + insert row                                |
| `unlinkCharacterFromCharacter.ts` | Auth + rate limit + verify ownership + delete row                        |

### Shared Utility

**File:** `packages/app/features/characters/utils/relationshipInverse.ts`

```typescript
export const RELATIONSHIP_INVERSE: Record<string, string> = {
  parent: 'child',
  child: 'parent',
  sibling: 'sibling',
  spouse: 'spouse',
  grandparent: 'grandchild',
  grandchild: 'grandparent',
  aunt_uncle: 'niece_nephew',
  niece_nephew: 'aunt_uncle',
  cousin: 'cousin',
  custom: 'custom',
}

export const RELATIONSHIP_LABELS: Record<string, string> = {
  parent: 'Parent of',
  child: 'Child of',
  sibling: 'Sibling of',
  spouse: 'Spouse of',
  grandparent: 'Grandparent of',
  grandchild: 'Grandchild of',
  aunt_uncle: 'Aunt/Uncle of',
  niece_nephew: 'Niece/Nephew of',
  cousin: 'Cousin of',
}

export const FAMILY_TYPES = new Set([
  'parent',
  'child',
  'sibling',
  'spouse',
  'grandparent',
  'grandchild',
  'aunt_uncle',
  'niece_nephew',
  'cousin',
])
```

### Updated Types

`RelatedEntities` gains a `characters` field:

```typescript
interface RelatedEntities {
  stories: RelatedEntityItem[]
  locations: RelatedEntityItem[]
  timelines: RelatedEntityItem[]
  characters: RelatedCharacterItem[] // NEW
}

interface RelatedCharacterItem extends RelatedEntityItem {
  relationshipId: number
  relationshipLabel: string // e.g. "Mother of", "Rival"
  isFamily: boolean
}
```

### Updated Server Actions (existing files)

- `getRelatedEntitiesForCharacter.ts` — populate `characters` array
- `linkEntityToCharacter.ts` — handle `entityType === 'character'` case, accept `relationshipType` + `customLabel` params
- `unlinkEntityFromCharacter.ts` — handle `entityType === 'character'` case

---

## Section 3: Character Detail Page

### Related Entities Grid

The existing `RelatedEntitiesGrid` gains a "Characters" section showing related characters as cards. Each card displays:

- Character avatar/primary image
- Character name
- Relationship label badge (e.g., "Mother of", "Rival")
- Click → navigate to related character's detail page

### Add Relationship Modal

`AddExistingModal` gets extended: when entity type is `character`, show a relationship type selector after picking the character:

```
[ Select character... ▼ ]
[ Relationship type... ▼ ]   ← predefined list + "Custom..." option
[ Custom label...     ]      ← text input, shown only when "Custom" selected
```

### UI Files Modified

- `packages/app/features/shared/EntityDetailScreen.tsx` — pass `characters` to grid + handle character entity type
- `packages/app/features/shared/components/RelatedEntitiesGrid.tsx` — render characters section
- `packages/app/features/shared/components/AddExistingModal.tsx` — relationship type selector for characters
- `packages/app/features/characters/detail-screen.tsx` — wire up new server actions + add `/relationships` page link

---

## Section 4: `/relationships` Visual Graph Page

### Route

`/[userId]/characters/[characterId]/relationships`

### Files

```
apps/next/app/[userId]/characters/[characterId]/relationships/
  page.tsx                    ← server component, fetches data

packages/app/features/characters/
  relationships-screen.tsx                    ← client screen
  components/
    CharacterRelationshipGraph.tsx            ← react-flow graph (client)
    RelationshipGraphNode.tsx                 ← custom node renderer
```

### Graph Behavior

- **Center node** = current character (highlighted/larger)
- **Connected nodes** = related characters, radially positioned
- **Edge labels** = relationship label (e.g., "Parent of", "Rival")
- **Edge colors** = family relationships (blue) vs custom relationships (gray)
- **Click node** → navigate to that character's `/relationships` page
- **Scope** = one level deep (direct relationships only, no recursive traversal in v1)

### Library

`@xyflow/react` (react-flow) — installed as new dependency in `packages/ui`

---

## Implementation Order

1. Database migration + SQLC queries
2. Server actions (`getCharacterRelationships`, `linkCharacterToCharacter`, `unlinkCharacterFromCharacter`)
3. Update `getRelatedEntitiesForCharacter` + `linkEntityToCharacter` + `unlinkEntityFromCharacter`
4. Relationship inverse utility
5. Character detail page — list view (RelatedEntitiesGrid + AddExistingModal)
6. `/relationships` graph page (react-flow)
7. Tests

---

## Security Checklist

All new API routes follow the mandatory security pattern:

- [ ] Rate limiting (`RateLimitConfigs.api`)
- [ ] Authentication (`requireAuth`)
- [ ] Authorization (`verifyOwnership` via `created_by`)
- [ ] Input validation (Zod schemas)
- [ ] Generic error messages (no internal details)
