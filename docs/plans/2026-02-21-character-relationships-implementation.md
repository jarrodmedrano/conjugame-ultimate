# Character Relationships Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add character-to-character relationships (family tree + arbitrary types) with a list view on the character detail page and a visual `/relationships` graph page.

**Architecture:** Single `character_relationships` table stores one row per relationship; inverse labels are computed at query time. A new SQLC-pattern TypeScript file provides DB functions. The existing `EntityDetailScreen` + `RelatedEntitiesGrid` machinery is extended to handle character-to-character linking. A new `/relationships` route renders an `@xyflow/react` node graph.

**Tech Stack:** PostgreSQL, TypeScript, Next.js App Router, `@xyflow/react`, Tailwind CSS, Zod, styled-components

---

## Key Files Reference

- DB migrations: `apps/database/migration/`
- SQLC functions: `apps/database/sqlc/` (TypeScript, not generated — follow existing pattern in `relationships_sql.ts`)
- DB exports: `apps/database/index.ts`
- Server actions: `apps/next/actions/`
- Feature components: `packages/app/features/characters/`
- Shared screen logic: `packages/app/features/shared/EntityDetailScreen.tsx`
- Shared types: `packages/app/features/shared/EntityDetailScreen.types.ts`
- Related grid: `packages/app/features/stories/components/RelatedEntitiesGrid.tsx`
- Add modal: `packages/app/features/stories/components/AddExistingModal.tsx`
- Character detail page: `apps/next/app/[userId]/characters/[characterId]/page.tsx`
- Character detail screen: `packages/app/features/characters/detail-screen.tsx`

---

## Task 1: Database Migration

**Files:**

- Create: `apps/database/migration/000010_add_character_relationships.up.sql`
- Create: `apps/database/migration/000010_add_character_relationships.down.sql`

**Step 1: Create the up migration**

```sql
-- apps/database/migration/000010_add_character_relationships.up.sql
CREATE TABLE character_relationships (
  id SERIAL PRIMARY KEY,
  character_id_a INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  character_id_b INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL,
  custom_label VARCHAR(100),
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id_a, character_id_b, relationship_type),
  CHECK (character_id_a != character_id_b)
);

CREATE INDEX idx_char_rel_a ON character_relationships(character_id_a);
CREATE INDEX idx_char_rel_b ON character_relationships(character_id_b);
CREATE INDEX idx_char_rel_created_by ON character_relationships(created_by);
```

**Step 2: Create the down migration**

```sql
-- apps/database/migration/000010_add_character_relationships.down.sql
DROP TABLE IF EXISTS character_relationships;
```

**Step 3: Run the migration against your local database**

```bash
# The project uses golang-migrate or similar. Check the package.json scripts
# or run manually:
psql $DATABASE_URL -f apps/database/migration/000010_add_character_relationships.up.sql
```

Expected: Table `character_relationships` exists with the correct schema.

**Step 4: Commit**

```bash
git add apps/database/migration/000010_add_character_relationships.up.sql
git add apps/database/migration/000010_add_character_relationships.down.sql
git commit -m "feat: add character_relationships migration"
```

---

## Task 2: SQLC TypeScript Functions

**Files:**

- Create: `apps/database/sqlc/character_relationships_sql.ts`
- Modify: `apps/database/index.ts`

**Step 1: Create the SQLC TypeScript file**

Follow the exact pattern from `apps/database/sqlc/relationships_sql.ts` (rowMode: 'array', manual row mapping).

```typescript
// apps/database/sqlc/character_relationships_sql.ts
import { QueryArrayConfig, QueryArrayResult } from 'pg'

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>
}

// ─── Get all relationships for a character (both directions) ──────────────────

export const getCharacterRelationshipsQuery = `-- name: GetCharacterRelationships :many
SELECT
  cr.id,
  cr.character_id_a,
  cr.character_id_b,
  cr.relationship_type,
  cr.custom_label,
  cr.created_by,
  cr.created_at,
  c.id as related_character_id,
  c.name as related_character_name,
  c.slug as related_character_slug,
  ei.cloudinary_url as primary_image_url
FROM character_relationships cr
JOIN characters c ON (
  CASE WHEN cr.character_id_a = $1 THEN cr.character_id_b
       ELSE cr.character_id_a END = c.id
)
LEFT JOIN entity_images ei ON ei.entity_id = c.id
  AND ei.entity_type = 'character'
  AND ei.is_primary = true
WHERE cr.character_id_a = $1 OR cr.character_id_b = $1
ORDER BY c.name`

export interface GetCharacterRelationshipsArgs {
  characterId: number
}

export interface GetCharacterRelationshipsRow {
  id: number
  characterIdA: number
  characterIdB: number
  relationshipType: string
  customLabel: string | null
  createdBy: string
  createdAt: Date | null
  relatedCharacterId: number
  relatedCharacterName: string
  relatedCharacterSlug: string | null
  primaryImageUrl: string | null
}

export async function getCharacterRelationships(
  client: Client,
  args: GetCharacterRelationshipsArgs,
): Promise<GetCharacterRelationshipsRow[]> {
  const result = await client.query({
    text: getCharacterRelationshipsQuery,
    values: [args.characterId],
    rowMode: 'array',
  })
  return result.rows.map((row) => ({
    id: row[0],
    characterIdA: row[1],
    characterIdB: row[2],
    relationshipType: row[3],
    customLabel: row[4],
    createdBy: row[5],
    createdAt: row[6],
    relatedCharacterId: row[7],
    relatedCharacterName: row[8],
    relatedCharacterSlug: row[9],
    primaryImageUrl: row[10],
  }))
}

// ─── Create relationship ──────────────────────────────────────────────────────

export const createCharacterRelationshipQuery = `-- name: CreateCharacterRelationship :one
INSERT INTO character_relationships (character_id_a, character_id_b, relationship_type, custom_label, created_by)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT DO NOTHING
RETURNING id, character_id_a, character_id_b, relationship_type, custom_label, created_by, created_at`

export interface CreateCharacterRelationshipArgs {
  characterIdA: number
  characterIdB: number
  relationshipType: string
  customLabel: string | null
  createdBy: string
}

export interface CreateCharacterRelationshipRow {
  id: number
  characterIdA: number
  characterIdB: number
  relationshipType: string
  customLabel: string | null
  createdBy: string
  createdAt: Date | null
}

export async function createCharacterRelationship(
  client: Client,
  args: CreateCharacterRelationshipArgs,
): Promise<CreateCharacterRelationshipRow | null> {
  const result = await client.query({
    text: createCharacterRelationshipQuery,
    values: [
      args.characterIdA,
      args.characterIdB,
      args.relationshipType,
      args.customLabel,
      args.createdBy,
    ],
    rowMode: 'array',
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row[0],
    characterIdA: row[1],
    characterIdB: row[2],
    relationshipType: row[3],
    customLabel: row[4],
    createdBy: row[5],
    createdAt: row[6],
  }
}

// ─── Get single relationship (for ownership check) ───────────────────────────

export const getCharacterRelationshipQuery = `-- name: GetCharacterRelationship :one
SELECT id, character_id_a, character_id_b, relationship_type, custom_label, created_by, created_at
FROM character_relationships
WHERE id = $1`

export interface GetCharacterRelationshipArgs {
  id: number
}

export async function getCharacterRelationship(
  client: Client,
  args: GetCharacterRelationshipArgs,
): Promise<CreateCharacterRelationshipRow | null> {
  const result = await client.query({
    text: getCharacterRelationshipQuery,
    values: [args.id],
    rowMode: 'array',
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row[0],
    characterIdA: row[1],
    characterIdB: row[2],
    relationshipType: row[3],
    customLabel: row[4],
    createdBy: row[5],
    createdAt: row[6],
  }
}

// ─── Delete relationship ──────────────────────────────────────────────────────

export const deleteCharacterRelationshipQuery = `-- name: DeleteCharacterRelationship :exec
DELETE FROM character_relationships
WHERE id = $1 AND created_by = $2`

export interface DeleteCharacterRelationshipArgs {
  id: number
  createdBy: string
}

export async function deleteCharacterRelationship(
  client: Client,
  args: DeleteCharacterRelationshipArgs,
): Promise<void> {
  await client.query({
    text: deleteCharacterRelationshipQuery,
    values: [args.id, args.createdBy],
    rowMode: 'array',
  })
}
```

**Step 2: Export from database index**

In `apps/database/index.ts`, add:

```typescript
export * from './sqlc/account_sql'
export * from './sqlc/relationships_sql'
export * from './sqlc/entity_images_sql'
export * from './sqlc/subscriptions_sql'
export * from './sqlc/character_relationships_sql' // ADD THIS LINE
```

**Step 3: Verify TypeScript compiles**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npx tsc --noEmit -p apps/database/tsconfig.json 2>&1 | head -20
```

Expected: No errors.

**Step 4: Commit**

```bash
git add apps/database/sqlc/character_relationships_sql.ts apps/database/index.ts
git commit -m "feat: add character relationships SQLC functions"
```

---

## Task 3: Relationship Inverse Utility

**Files:**

- Create: `packages/app/features/characters/utils/relationshipInverse.ts`
- Create: `packages/app/features/characters/utils/__tests__/relationshipInverse.test.ts`

**Step 1: Write the failing test first**

```typescript
// packages/app/features/characters/utils/__tests__/relationshipInverse.test.ts
import {
  getInverseRelationshipType,
  getRelationshipLabel,
  FAMILY_TYPES,
  PREDEFINED_RELATIONSHIP_OPTIONS,
} from '../relationshipInverse'

describe('getInverseRelationshipType', () => {
  it('returns child for parent', () => {
    expect(getInverseRelationshipType('parent')).toBe('child')
  })
  it('returns parent for child', () => {
    expect(getInverseRelationshipType('child')).toBe('parent')
  })
  it('returns sibling for sibling', () => {
    expect(getInverseRelationshipType('sibling')).toBe('sibling')
  })
  it('returns spouse for spouse', () => {
    expect(getInverseRelationshipType('spouse')).toBe('spouse')
  })
  it('returns grandchild for grandparent', () => {
    expect(getInverseRelationshipType('grandparent')).toBe('grandchild')
  })
  it('returns grandparent for grandchild', () => {
    expect(getInverseRelationshipType('grandchild')).toBe('grandparent')
  })
  it('returns niece_nephew for aunt_uncle', () => {
    expect(getInverseRelationshipType('aunt_uncle')).toBe('niece_nephew')
  })
  it('returns aunt_uncle for niece_nephew', () => {
    expect(getInverseRelationshipType('niece_nephew')).toBe('aunt_uncle')
  })
  it('returns cousin for cousin', () => {
    expect(getInverseRelationshipType('cousin')).toBe('cousin')
  })
  it('returns custom for custom', () => {
    expect(getInverseRelationshipType('custom')).toBe('custom')
  })
  it('returns same value for unknown types', () => {
    expect(getInverseRelationshipType('unknown_type')).toBe('unknown_type')
  })
})

describe('getRelationshipLabel', () => {
  it('returns human readable label for parent', () => {
    expect(getRelationshipLabel('parent')).toBe('Parent of')
  })
  it('returns human readable label for aunt_uncle', () => {
    expect(getRelationshipLabel('aunt_uncle')).toBe('Aunt/Uncle of')
  })
  it('returns custom label for custom type with label', () => {
    expect(getRelationshipLabel('custom', 'Rival')).toBe('Rival')
  })
  it('returns Custom for custom type without label', () => {
    expect(getRelationshipLabel('custom')).toBe('Custom')
  })
})

describe('FAMILY_TYPES', () => {
  it('includes all family relationship types', () => {
    expect(FAMILY_TYPES.has('parent')).toBe(true)
    expect(FAMILY_TYPES.has('child')).toBe(true)
    expect(FAMILY_TYPES.has('sibling')).toBe(true)
    expect(FAMILY_TYPES.has('spouse')).toBe(true)
    expect(FAMILY_TYPES.has('grandparent')).toBe(true)
    expect(FAMILY_TYPES.has('grandchild')).toBe(true)
    expect(FAMILY_TYPES.has('aunt_uncle')).toBe(true)
    expect(FAMILY_TYPES.has('niece_nephew')).toBe(true)
    expect(FAMILY_TYPES.has('cousin')).toBe(true)
  })
  it('does not include custom', () => {
    expect(FAMILY_TYPES.has('custom')).toBe(false)
  })
})

describe('PREDEFINED_RELATIONSHIP_OPTIONS', () => {
  it('includes all predefined options', () => {
    const values = PREDEFINED_RELATIONSHIP_OPTIONS.map((o) => o.value)
    expect(values).toContain('parent')
    expect(values).toContain('sibling')
    expect(values).toContain('custom')
  })
})
```

**Step 2: Run to verify test fails**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npx jest packages/app/features/characters/utils/__tests__/relationshipInverse.test.ts 2>&1 | tail -10
```

Expected: FAIL — module not found.

**Step 3: Implement the utility**

```typescript
// packages/app/features/characters/utils/relationshipInverse.ts

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

export interface RelationshipOption {
  value: string
  label: string
}

export const PREDEFINED_RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  { value: 'parent', label: 'Parent of' },
  { value: 'child', label: 'Child of' },
  { value: 'sibling', label: 'Sibling of' },
  { value: 'spouse', label: 'Spouse of' },
  { value: 'grandparent', label: 'Grandparent of' },
  { value: 'grandchild', label: 'Grandchild of' },
  { value: 'aunt_uncle', label: 'Aunt/Uncle of' },
  { value: 'niece_nephew', label: 'Niece/Nephew of' },
  { value: 'cousin', label: 'Cousin of' },
  { value: 'custom', label: 'Custom...' },
]

export function getInverseRelationshipType(relationshipType: string): string {
  return RELATIONSHIP_INVERSE[relationshipType] ?? relationshipType
}

export function getRelationshipLabel(
  relationshipType: string,
  customLabel?: string | null,
): string {
  if (relationshipType === 'custom') {
    return customLabel || 'Custom'
  }
  return RELATIONSHIP_LABELS[relationshipType] ?? relationshipType
}
```

**Step 4: Run tests to verify they pass**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npx jest packages/app/features/characters/utils/__tests__/relationshipInverse.test.ts 2>&1 | tail -10
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/app/features/characters/utils/
git commit -m "feat: add relationship inverse utility"
```

---

## Task 4: Server Action — getCharacterRelationships

**Files:**

- Create: `apps/next/actions/character-relationships/getCharacterRelationships.ts`

This action fetches all character-to-character relationships for a given character, computing the correct display label based on direction.

**Step 1: Create the action**

```typescript
// apps/next/actions/character-relationships/getCharacterRelationships.ts
'use server'

import pool from '../../app/utils/open-pool'
import { getCharacterRelationships as dbGetCharacterRelationships } from '@repo/database'
import {
  getInverseRelationshipType,
  getRelationshipLabel,
  FAMILY_TYPES,
} from '@app/features/characters/utils/relationshipInverse'

export interface RelatedCharacter {
  id: number
  relationshipId: number
  name: string
  slug: string | null
  primaryImageUrl: string | null
  relationshipLabel: string
  isFamily: boolean
}

export async function getCharacterRelationships({
  characterId,
}: {
  characterId: number
}): Promise<RelatedCharacter[]> {
  try {
    const client = await pool.connect()
    try {
      const rows = await dbGetCharacterRelationships(client, { characterId })

      return rows.map((row) => {
        // Determine if this character is character_id_a or character_id_b
        const isOrigin = row.characterIdA === characterId
        const displayType = isOrigin
          ? row.relationshipType
          : getInverseRelationshipType(row.relationshipType)

        const label = getRelationshipLabel(displayType, row.customLabel)

        return {
          id: row.relatedCharacterId,
          relationshipId: row.id,
          name: row.relatedCharacterName,
          slug: row.relatedCharacterSlug,
          primaryImageUrl: row.primaryImageUrl,
          relationshipLabel: label,
          isFamily: FAMILY_TYPES.has(displayType),
        }
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error fetching character relationships:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return []
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npx tsc --noEmit -p apps/next/tsconfig.json 2>&1 | grep "character-relationships" | head -10
```

Expected: No errors for this file.

**Step 3: Commit**

```bash
git add apps/next/actions/character-relationships/getCharacterRelationships.ts
git commit -m "feat: add getCharacterRelationships server action"
```

---

## Task 5: Server Action — linkCharacterToCharacter

**Files:**

- Create: `apps/next/actions/character-relationships/linkCharacterToCharacter.ts`

**Step 1: Create the Zod validation schema**

```typescript
// apps/next/lib/validations/character-relationship.ts
import { z } from 'zod'

export const LinkCharacterToCharacterSchema = z.object({
  characterId: z.number().int().positive(),
  targetCharacterId: z.number().int().positive(),
  relationshipType: z
    .enum([
      'parent',
      'child',
      'sibling',
      'spouse',
      'grandparent',
      'grandchild',
      'aunt_uncle',
      'niece_nephew',
      'cousin',
      'custom',
    ])
    .default('custom'),
  customLabel: z.string().max(100).trim().optional().nullable(),
})

export type LinkCharacterToCharacterInput = z.infer<
  typeof LinkCharacterToCharacterSchema
>
```

**Step 2: Create the server action**

```typescript
// apps/next/actions/character-relationships/linkCharacterToCharacter.ts
'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import { getCharacter, createCharacterRelationship } from '@repo/database'
import { LinkCharacterToCharacterSchema } from '../../lib/validations/character-relationship'
import { z } from 'zod'
import { rateLimit, RateLimitConfigs } from '../../lib/rate-limit'

export interface LinkCharacterToCharacterArgs {
  characterId: number
  targetCharacterId: number
  relationshipType?: string
  customLabel?: string | null
}

export interface LinkCharacterToCharacterResult {
  success: boolean
  error?: string
}

export async function linkCharacterToCharacter(
  args: LinkCharacterToCharacterArgs,
): Promise<LinkCharacterToCharacterResult> {
  const headersList = await headers()

  // 1. Rate limiting
  const rateLimitResult = await rateLimit(
    headersList as unknown as Request,
    RateLimitConfigs.api,
  )
  if (rateLimitResult) return { success: false, error: 'Too many requests' }

  // 2. Authentication
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null
  try {
    session = await auth.api.getSession({ headers: headersList })
  } catch {
    return { success: false, error: 'Unauthorized: You must be logged in' }
  }

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized: You must be logged in' }
  }

  // 3. Input validation
  let validated: z.infer<typeof LinkCharacterToCharacterSchema>
  try {
    validated = LinkCharacterToCharacterSchema.parse({
      characterId: args.characterId,
      targetCharacterId: args.targetCharacterId,
      relationshipType: args.relationshipType ?? 'custom',
      customLabel: args.customLabel,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? 'Validation failed',
      }
    }
    return { success: false, error: 'Validation failed' }
  }

  if (validated.characterId === validated.targetCharacterId) {
    return { success: false, error: 'A character cannot be related to itself' }
  }

  const client = await pool.connect()
  try {
    // 4. Verify ownership of source character
    const character = await getCharacter(client, { id: validated.characterId })
    if (!character) {
      return { success: false, error: 'Character not found' }
    }
    if (character.userid !== session.user.id) {
      return {
        success: false,
        error:
          'Unauthorized: You can only add relationships to your own characters',
      }
    }

    // 5. Verify target character exists and belongs to same user
    const targetCharacter = await getCharacter(client, {
      id: validated.targetCharacterId,
    })
    if (!targetCharacter) {
      return { success: false, error: 'Target character not found' }
    }
    if (targetCharacter.userid !== session.user.id) {
      return {
        success: false,
        error: 'Unauthorized: You can only link to your own characters',
      }
    }

    // 6. Create relationship
    await createCharacterRelationship(client, {
      characterIdA: validated.characterId,
      characterIdB: validated.targetCharacterId,
      relationshipType: validated.relationshipType,
      customLabel: validated.customLabel ?? null,
      createdBy: session.user.id,
    })

    revalidatePath(`/${character.userid}/characters/${args.characterId}`)

    return { success: true }
  } catch (error) {
    console.error(
      'Error linking characters:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { success: false, error: 'Failed to link characters' }
  } finally {
    client.release()
  }
}
```

**Step 3: Check TypeScript**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npx tsc --noEmit -p apps/next/tsconfig.json 2>&1 | grep "linkCharacterToCharacter\|character-relationship" | head -10
```

Expected: No errors.

**Step 4: Commit**

```bash
git add apps/next/actions/character-relationships/linkCharacterToCharacter.ts
git add apps/next/lib/validations/character-relationship.ts
git commit -m "feat: add linkCharacterToCharacter server action"
```

---

## Task 6: Server Action — unlinkCharacterFromCharacter

**Files:**

- Create: `apps/next/actions/character-relationships/unlinkCharacterFromCharacter.ts`

Note: `entityId` here is the **relationship row ID** (from `character_relationships.id`), not the character's ID. This avoids ambiguity when multiple relationship types exist between two characters.

**Step 1: Create the server action**

```typescript
// apps/next/actions/character-relationships/unlinkCharacterFromCharacter.ts
'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '../../auth'
import pool from '../../app/utils/open-pool'
import {
  getCharacter,
  getCharacterRelationship,
  deleteCharacterRelationship,
} from '@repo/database'
import { rateLimit, RateLimitConfigs } from '../../lib/rate-limit'

export interface UnlinkCharacterFromCharacterArgs {
  characterId: number
  relationshipId: number
}

export interface UnlinkCharacterFromCharacterResult {
  success: boolean
  error?: string
}

export async function unlinkCharacterFromCharacter(
  args: UnlinkCharacterFromCharacterArgs,
): Promise<UnlinkCharacterFromCharacterResult> {
  const headersList = await headers()

  // 1. Rate limiting
  const rateLimitResult = await rateLimit(
    headersList as unknown as Request,
    RateLimitConfigs.api,
  )
  if (rateLimitResult) return { success: false, error: 'Too many requests' }

  // 2. Authentication
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null
  try {
    session = await auth.api.getSession({ headers: headersList })
  } catch {
    return { success: false, error: 'Unauthorized: You must be logged in' }
  }

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized: You must be logged in' }
  }

  const client = await pool.connect()
  try {
    // 3. Verify ownership of source character
    const character = await getCharacter(client, { id: args.characterId })
    if (!character) {
      return { success: false, error: 'Character not found' }
    }
    if (character.userid !== session.user.id) {
      return {
        success: false,
        error:
          'Unauthorized: You can only remove relationships from your own characters',
      }
    }

    // 4. Verify relationship exists and user created it
    const relationship = await getCharacterRelationship(client, {
      id: args.relationshipId,
    })
    if (!relationship) {
      return { success: false, error: 'Relationship not found' }
    }
    if (relationship.createdBy !== session.user.id) {
      return {
        success: false,
        error: 'Forbidden: You can only remove relationships you created',
      }
    }

    // 5. Delete
    await deleteCharacterRelationship(client, {
      id: args.relationshipId,
      createdBy: session.user.id,
    })

    revalidatePath(`/${character.userid}/characters/${args.characterId}`)

    return { success: true }
  } catch (error) {
    console.error(
      'Error unlinking characters:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { success: false, error: 'Failed to unlink characters' }
  } finally {
    client.release()
  }
}
```

**Step 2: Check TypeScript**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npx tsc --noEmit -p apps/next/tsconfig.json 2>&1 | grep "unlinkCharacter\|character-relationships" | head -10
```

Expected: No errors.

**Step 3: Commit**

```bash
git add apps/next/actions/character-relationships/unlinkCharacterFromCharacter.ts
git commit -m "feat: add unlinkCharacterFromCharacter server action"
```

---

## Task 7: Update Existing Actions

**Files:**

- Modify: `apps/next/actions/relationships/getRelatedEntitiesForCharacter.ts`
- Modify: `apps/next/actions/relationships/linkEntityToCharacter.ts`
- Modify: `apps/next/actions/relationships/unlinkEntityFromCharacter.ts`

### 7a: Update getRelatedEntitiesForCharacter

Replace the file with:

```typescript
// apps/next/actions/relationships/getRelatedEntitiesForCharacter.ts
'use server'

import pool from '../../app/utils/open-pool'
import type { RelatedEntityItem } from '@app/features/shared/EntityDetailScreen.types'
import { getCharacterRelationships } from '../character-relationships/getCharacterRelationships'

interface RelatedEntitiesForCharacter {
  stories: RelatedEntityItem[]
  locations: RelatedEntityItem[]
  timelines: RelatedEntityItem[]
  characters: RelatedEntityItem[]
}

export default async function getRelatedEntitiesForCharacter({
  characterId,
}: {
  characterId: number
}): Promise<RelatedEntitiesForCharacter> {
  try {
    const client = await pool.connect()
    try {
      // Get stories linked to this character
      const storiesResult = await client.query({
        text: `
          SELECT
            s.id,
            s.title,
            s.content,
            s.privacy,
            s.slug,
            s."userId" as userid,
            s.created_at,
            s.updated_at,
            i.cloudinary_url as primary_image_url
          FROM stories s
          JOIN story_characters sc ON s.id = sc.story_id
          LEFT JOIN entity_images i ON i.entity_id = s.id
            AND i.entity_type = 'story'
            AND i.is_primary = true
          WHERE sc.character_id = $1
          ORDER BY s.title
        `,
        values: [characterId],
        rowMode: 'array',
      })

      const stories: RelatedEntityItem[] = storiesResult.rows.map(
        (row: any[]) => ({
          id: row[0],
          title: row[1],
          name: row[1],
          description: row[2],
          primaryImageUrl: row[8],
        }),
      )

      // Get character-to-character relationships
      const relatedCharacters = await getCharacterRelationships({ characterId })
      const characters: RelatedEntityItem[] = relatedCharacters.map((rc) => ({
        id: rc.id,
        name: rc.name,
        primaryImageUrl: rc.primaryImageUrl,
        description: null,
        relationshipId: rc.relationshipId,
        relationshipLabel: rc.relationshipLabel,
        isFamily: rc.isFamily,
      }))

      return {
        stories,
        locations: [],
        timelines: [],
        characters,
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error(
      'Error fetching related entities for character:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return { stories: [], locations: [], timelines: [], characters: [] }
  }
}
```

### 7b: Update linkEntityToCharacter

Replace the `else` block at line 80-87 with character handling:

```typescript
// In the try block, after `if (args.entityType === 'story') { ... }`, replace the else:
if (args.entityType === 'story') {
  const linkPromises = args.entityIds.map((storyId) =>
    linkCharacterToStory(client, {
      storyId,
      characterId: args.characterId,
    }),
  )
  await Promise.all(linkPromises)
} else if (args.entityType === 'character') {
  // Character-to-character relationships are handled by linkCharacterToCharacter action
  // This branch handles bulk linking from the existing modal flow
  const { linkCharacterToCharacter } = await import(
    '../character-relationships/linkCharacterToCharacter'
  )
  for (const targetCharacterId of args.entityIds) {
    await linkCharacterToCharacter({
      characterId: args.characterId,
      targetCharacterId,
      relationshipType: args.relationshipType ?? 'custom',
      customLabel: args.customLabel ?? null,
    })
  }
} else {
  return {
    success: false,
    error: `Linking ${args.entityType}s to characters is not yet supported`,
  }
}
```

Also update the `LinkEntityToCharacterArgs` interface to include relationship fields:

```typescript
export interface LinkEntityToCharacterArgs {
  characterId: number
  entityType: 'story' | 'character' | 'location' | 'timeline'
  entityIds: number[]
  relationshipType?: string // for character-to-character
  customLabel?: string | null // for character-to-character custom type
}
```

### 7c: Update unlinkEntityFromCharacter

Replace the `else` block at line 70-75 with character handling:

```typescript
if (args.entityType === 'story') {
  await unlinkCharacterFromStory(client, {
    storyId: args.entityId,
    characterId: args.characterId,
  })
} else if (args.entityType === 'character') {
  // entityId is the relationship row ID for character-to-character unlinks
  const { unlinkCharacterFromCharacter } = await import(
    '../character-relationships/unlinkCharacterFromCharacter'
  )
  await unlinkCharacterFromCharacter({
    characterId: args.characterId,
    relationshipId: args.entityId,
  })
  // Early return since unlinkCharacterFromCharacter handles revalidation
  return { success: true }
} else {
  return {
    success: false,
    error: `Unlinking ${args.entityType}s from characters is not yet supported`,
  }
}
```

**Step: Check TypeScript**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npx tsc --noEmit -p apps/next/tsconfig.json 2>&1 | head -20
```

**Step: Commit**

```bash
git add apps/next/actions/relationships/
git commit -m "feat: wire character-to-character relationships into existing actions"
```

---

## Task 8: Update Types

**Files:**

- Modify: `packages/app/features/shared/EntityDetailScreen.types.ts`

Add `relationshipId`, `relationshipLabel`, and `isFamily` as optional fields to `RelatedEntityItem`:

```typescript
// In EntityDetailScreen.types.ts, update RelatedEntityItem:
export interface RelatedEntityItem {
  id: number
  name: string
  title?: string
  description?: string | null
  primaryImageUrl?: string | null
  // Character-to-character relationship metadata (optional)
  relationshipId?: number
  relationshipLabel?: string
  isFamily?: boolean
}
```

No other type changes needed — `RelatedEntities` already has `characters?: RelatedEntityItem[]` field.

**Step: Check TypeScript**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npx tsc --noEmit -p packages/app/tsconfig.json 2>&1 | head -20
```

**Step: Commit**

```bash
git add packages/app/features/shared/EntityDetailScreen.types.ts
git commit -m "feat: add relationship metadata fields to RelatedEntityItem"
```

---

## Task 9: Update AddExistingModal

**Files:**

- Modify: `packages/app/features/stories/components/AddExistingModal.tsx`
- Modify: `packages/app/features/stories/components/AddExistingModal.styles.ts` (add new styled components)

The modal needs a relationship type selector shown when `showRelationshipSelector` is `true`.

**Step 1: Update AddExistingModal.styles.ts**

Add these styled components at the bottom of the existing file:

```typescript
export const RelationshipSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme?.colors?.border || '#e5e7eb'};
`

export const RelationshipLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: ${({ theme }) => theme?.colors?.foreground || '#111827'};
`

export const RelationshipSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  margin-bottom: 8px;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
`

export const CustomLabelInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
`
```

**Step 2: Update AddExistingModal.tsx**

Key changes:

1. Update `onAdd` signature to accept relationship info
2. Add `showRelationshipSelector` prop
3. Add relationship type state + custom label state
4. Render selector below entity list when `showRelationshipSelector` is true

```typescript
'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog'
import { Button } from '@repo/ui/components/ui/button'
import { Checkbox } from '@repo/ui/components/ui/checkbox'
import {
  ModalContent,
  SearchInput,
  EntityList,
  EntityItem,
  EntityCheckbox,
  EntityInfo,
  EntityName,
  EntityDescription,
  LinkedBadge,
  NoResults,
  ModalActions,
  RelationshipSection,
  RelationshipLabel,
  RelationshipSelect,
  CustomLabelInput,
} from './AddExistingModal.styles'
import type { RelatedEntityItem } from '../../shared/EntityDetailScreen.types'
import { PREDEFINED_RELATIONSHIP_OPTIONS } from '../../characters/utils/relationshipInverse'

export interface AddExistingModalProps {
  isOpen: boolean
  entityType: 'character' | 'location' | 'timeline'
  availableEntities: RelatedEntityItem[]
  linkedEntityIds: number[]
  onClose: () => void
  onAdd: (selectedIds: number[], relationshipType?: string, customLabel?: string | null) => void
  showRelationshipSelector?: boolean
}

export function AddExistingModal({
  isOpen,
  entityType,
  availableEntities,
  linkedEntityIds,
  onClose,
  onAdd,
  showRelationshipSelector = false,
}: AddExistingModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [relationshipType, setRelationshipType] = useState('custom')
  const [customLabel, setCustomLabel] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set())
      setSearchQuery('')
      setRelationshipType('custom')
      setCustomLabel('')
    }
  }, [isOpen])

  const entityTypePlural = useMemo(() => {
    const pluralMap: Record<string, string> = {
      character: 'Characters',
      location: 'Locations',
      timeline: 'Timelines',
    }
    return pluralMap[entityType]
  }, [entityType])

  const linkedIdsSet = useMemo(() => new Set(linkedEntityIds), [linkedEntityIds])

  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) return availableEntities
    const lowerQuery = searchQuery.toLowerCase()
    return availableEntities.filter((entity) =>
      entity?.name?.toLowerCase().includes(lowerQuery),
    )
  }, [availableEntities, searchQuery])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleCheckboxChange = useCallback((entityId: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(entityId)) {
        newSet.delete(entityId)
      } else {
        newSet.add(entityId)
      }
      return newSet
    })
  }, [])

  const createCheckboxHandler = useCallback(
    (entityId: number) => () => handleCheckboxChange(entityId),
    [handleCheckboxChange],
  )

  const handleRelationshipTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRelationshipType(e.target.value)
  }, [])

  const handleCustomLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomLabel(e.target.value)
  }, [])

  const handleAddSelected = useCallback(() => {
    const idsArray = Array.from(selectedIds)
    if (showRelationshipSelector) {
      onAdd(idsArray, relationshipType, relationshipType === 'custom' ? customLabel : null)
    } else {
      onAdd(idsArray)
    }
    onClose()
  }, [selectedIds, onAdd, onClose, showRelationshipSelector, relationshipType, customLabel])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose()
    },
    [onClose],
  )

  const selectedCount = selectedIds.size
  const isAddDisabled =
    selectedCount === 0 ||
    (showRelationshipSelector && relationshipType === 'custom' && !customLabel.trim())
  const buttonText = selectedCount > 0 ? `Add Selected (${selectedCount})` : 'Add Selected'

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent aria-label={`Add Existing ${entityTypePlural}`} data-testid="add-existing-modal">
        <DialogHeader>
          <DialogTitle>Add Existing {entityTypePlural}</DialogTitle>
          <DialogDescription>
            {showRelationshipSelector
              ? 'Select a character and choose their relationship type.'
              : 'Select entities to link. Already linked entities are disabled.'}
          </DialogDescription>
        </DialogHeader>

        <ModalContent>
          <SearchInput
            type="text"
            placeholder={`Search ${entityTypePlural?.toLowerCase()}...`}
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label={`Search ${entityTypePlural?.toLowerCase()}`}
          />

          {filteredEntities.length === 0 ? (
            <NoResults>No results found</NoResults>
          ) : (
            <EntityList data-testid="entity-list">
              {filteredEntities.map((entity) => {
                const isLinked = linkedIdsSet.has(entity.id)
                const isSelected = selectedIds.has(entity.id)

                return (
                  <EntityItem key={entity.id} $isDisabled={isLinked} htmlFor={`entity-${entity.id}`}>
                    <EntityCheckbox>
                      <Checkbox
                        id={`entity-${entity.id}`}
                        checked={isSelected}
                        disabled={isLinked}
                        onCheckedChange={createCheckboxHandler(entity.id)}
                        data-testid={`entity-checkbox-${entity.id}`}
                      />
                    </EntityCheckbox>
                    <EntityInfo>
                      <EntityName>{entity.name}</EntityName>
                      {entity.description && (
                        <EntityDescription>{entity.description}</EntityDescription>
                      )}
                      {isLinked && <LinkedBadge>Already linked</LinkedBadge>}
                    </EntityInfo>
                  </EntityItem>
                )
              })}
            </EntityList>
          )}

          {showRelationshipSelector && (
            <RelationshipSection>
              <RelationshipLabel htmlFor="relationship-type">
                Relationship type
              </RelationshipLabel>
              <RelationshipSelect
                id="relationship-type"
                value={relationshipType}
                onChange={handleRelationshipTypeChange}
                aria-label="Select relationship type"
              >
                {PREDEFINED_RELATIONSHIP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </RelationshipSelect>

              {relationshipType === 'custom' && (
                <CustomLabelInput
                  type="text"
                  placeholder="Enter relationship label (e.g. Rival, Mentor)"
                  value={customLabel}
                  onChange={handleCustomLabelChange}
                  aria-label="Custom relationship label"
                  maxLength={100}
                />
              )}
            </RelationshipSection>
          )}
        </ModalContent>

        <ModalActions>
          <Button variant="outline" onClick={onClose} aria-label="Cancel">
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleAddSelected}
            disabled={isAddDisabled}
            aria-label={buttonText}
          >
            {buttonText}
          </Button>
        </ModalActions>
      </DialogContent>
    </Dialog>
  )
}
```

**Step: Commit**

```bash
git add packages/app/features/stories/components/AddExistingModal.tsx
git add packages/app/features/stories/components/AddExistingModal.styles.ts
git commit -m "feat: add relationship type selector to AddExistingModal"
```

---

## Task 10: Update EntityDetailScreen

**Files:**

- Modify: `packages/app/features/shared/EntityDetailScreen.tsx`

Key changes:

1. Remove `if (targetEntityType === entityType) return` guard (allow character-to-character)
2. Pass `showRelationshipSelector` to `AddExistingModal` when adding characters to character page
3. Update `handleAddSelectedEntities` to accept and forward relationship type/label
4. Pass `relatedCharacters` to `RelatedEntitiesGrid` for the 4th panel

**Replace the relevant sections:**

```typescript
// 1. Update handleAddExisting — remove the same-type guard
const handleAddExisting = useCallback(
  async (targetEntityType: EntityType) => {
    if (!onGetUserEntities) {
      toast({
        title: 'Error',
        description: 'Get entities function not available',
        variant: 'destructive',
      })
      return
    }

    setActiveEntityType(targetEntityType)
    setIsLoadingEntities(true)

    try {
      const result = await onGetUserEntities({ entityType: targetEntityType })
      if (result.success && result.entities) {
        setAvailableEntities(result.entities)
        setShowAddExisting(true)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load entities',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to load entities',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingEntities(false)
    }
  },
  [onGetUserEntities],
)

// 2. Update handleCreateNew — remove the same-type guard
const handleCreateNew = useCallback((targetEntityType: EntityType) => {
  setActiveEntityType(targetEntityType)
  setShowCreateNew(true)
}, [])

// 3. Update handleAddSelectedEntities to accept relationship info
const handleAddSelectedEntities = useCallback(
  async (
    selectedIds: number[],
    relationshipType?: string,
    customLabel?: string | null,
  ) => {
    if (!activeEntityType) return

    if (!onLinkEntity) {
      toast({
        title: 'Error',
        description: 'Link entity function not available',
        variant: 'destructive',
      })
      return
    }

    try {
      const linkArgs = {
        [`${entityType}Id`]: getEntityId(entity),
        entityType: activeEntityType,
        entityIds: selectedIds,
        ...(relationshipType ? { relationshipType } : {}),
        ...(customLabel != null ? { customLabel } : {}),
      }

      const result = await onLinkEntity(linkArgs as unknown as TLinkArgs)

      if (result.success) {
        toast({
          title: 'Success',
          description: `${selectedIds.length} ${activeEntityType}(s) linked successfully`,
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to link entities',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to link entities',
        variant: 'destructive',
      })
    }
  },
  [activeEntityType, entityType, entity, getEntityId, router, onLinkEntity],
)

// 4. Update handleUnlinkEntity — remove the same-type guard
const handleUnlinkEntity = useCallback(
  async (targetEntityType: EntityType, targetEntityId: number) => {
    if (!onUnlinkEntity) {
      toast({
        title: 'Error',
        description: 'Unlink entity function not available',
        variant: 'destructive',
      })
      return
    }

    try {
      const unlinkArgs = {
        [`${entityType}Id`]: getEntityId(entity),
        entityType: targetEntityType,
        entityId: targetEntityId,
      }

      const result = await onUnlinkEntity(unlinkArgs as unknown as TUnlinkArgs)

      if (result.success) {
        toast({
          title: 'Success',
          description: `${targetEntityType} unlinked successfully`,
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to unlink entity',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to unlink entity',
        variant: 'destructive',
      })
    }
  },
  [entityType, entity, getEntityId, router, onUnlinkEntity],
)
```

**Update the `RelatedEntitiesGrid` call** to pass related characters and a link to the relationships page:

```typescript
// In the JSX, replace the RelatedEntitiesGrid call:
{showRelated && (
  <div className="mt-6">
    <div className="mb-3 flex items-center justify-between">
      {entityType === 'character' && (
        <a
          href={`/${userId}/characters/${getEntityId(entity)}/relationships`}
          className="text-sm text-indigo-600 hover:text-indigo-800 underline"
        >
          View Relationships Graph →
        </a>
      )}
    </div>
    <RelatedEntitiesGrid
      characters={
        entityType === 'story'
          ? relatedEntities.characters || []
          : relatedEntities.stories || []
      }
      locations={
        entityType === 'location'
          ? relatedEntities.characters || []
          : relatedEntities.locations || []
      }
      timelines={
        entityType === 'timeline'
          ? relatedEntities.locations || []
          : relatedEntities.timelines || []
      }
      relatedCharacters={
        entityType === 'character' ? relatedEntities.characters || [] : undefined
      }
      isOwner={isOwner}
      userId={userId}
      theme={theme}
      onAddExisting={handleAddExisting}
      onCreateNew={handleCreateNew}
      onUnlink={handleUnlinkEntity}
      firstPanelType={entityType === 'story' ? 'character' : 'story'}
    />
  </div>
)}
```

**Update the `AddExistingModal` call** to pass `showRelationshipSelector`:

```typescript
<AddExistingModal
  isOpen={showAddExisting}
  entityType={activeEntityType as 'character' | 'location' | 'timeline'}
  availableEntities={availableEntities}
  linkedEntityIds={getLinkedEntityIds()}
  onClose={handleAddExistingClose}
  onAdd={handleAddSelectedEntities}
  showRelationshipSelector={
    entityType === 'character' && activeEntityType === 'character'
  }
/>
```

**Step: Commit**

```bash
git add packages/app/features/shared/EntityDetailScreen.tsx
git commit -m "feat: update EntityDetailScreen for character-to-character relationships"
```

---

## Task 11: Update RelatedEntitiesGrid

**Files:**

- Modify: `packages/app/features/stories/components/RelatedEntitiesGrid.tsx`

Key changes:

1. Add `relatedCharacters?: Entity[]` prop
2. Populate the 4th empty panel with related characters
3. Use `entity.relationshipId ?? entity.id` for unlink when in the characters panel
4. Show `entity.relationshipLabel` badge on character cards

**Step 1: Update the interface**

```typescript
interface RelatedEntitiesGridProps {
  characters: Entity[]
  locations: Entity[]
  timelines: Entity[]
  relatedCharacters?: Entity[] // NEW: character-to-character relationships
  isOwner: boolean
  userId: string
  theme?: string
  onAddExisting: (entityType: EntityType) => void
  onCreateNew: (entityType: EntityType) => void
  onUnlink: (entityType: EntityType, entityId: number) => void
  firstPanelType?: 'character' | 'story'
}
```

**Step 2: Add handlers for the character relationship panel**

```typescript
const handleAddExistingRelatedCharacters = useCallback(() => {
  onAddExisting('character')
}, [onAddExisting])

const handleCreateNewRelatedCharacters = useCallback(() => {
  onCreateNew('character')
}, [onCreateNew])
```

**Step 3: Update `renderEntityCard` to show relationship badge and use `relationshipId` for unlink**

```typescript
const renderEntityCard = useCallback(
  (entity: Entity, entityType: EntityType, useRelationshipIdForUnlink = false) => {
    let entityPath: string
    if (entityType === 'timeline') {
      entityPath = 'timelines'
    } else if (entityType === 'story') {
      entityPath = 'stories'
    } else {
      entityPath = `${entityType}s`
    }
    // Use slug if available, otherwise id
    const entityIdentifier = (entity as any).slug ?? entity.id
    const href = `/${userId}/${entityPath}/${entityIdentifier}`

    // For character-to-character unlinks, use the relationship row ID
    const unlinkId = useRelationshipIdForUnlink
      ? (entity.relationshipId ?? entity.id)
      : entity.id

    return (
      <EntityLink key={entity.id} href={href}>
        <EntityCard $theme={theme} data-testid="entity-card">
          {isOwner && (
            <RemoveButton
              $theme={theme}
              onClick={createUnlinkHandler(entityType, unlinkId)}
              aria-label={`Remove ${entity.name}`}
            >
              ×
            </RemoveButton>
          )}
          {entity.primaryImageUrl && (
            <img
              src={entity.primaryImageUrl}
              alt={entity.name}
              className="h-16 w-16 rounded object-cover"
            />
          )}
          <EntityCardContent>
            <EntityName $theme={theme}>{entity.name}</EntityName>
            {entity.relationshipLabel && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700">
                {entity.relationshipLabel}
              </span>
            )}
            {!entity.relationshipLabel && entity.description && (
              <EntityDescription $theme={theme}>
                {truncateDescription(entity.description)}
              </EntityDescription>
            )}
          </EntityCardContent>
        </EntityCard>
      </EntityLink>
    )
  },
  [userId, theme, isOwner, createUnlinkHandler],
)
```

**Step 4: Replace the empty 4th panel with the related characters panel**

In the JSX, replace:

```typescript
<ResizablePanel defaultSize={50} minSize={20} className={`p-5 ${styles.resizableOverflowAuto}`}>
  <PanelContent>
    {/* Empty panel - reserved for future use */}
  </PanelContent>
</ResizablePanel>
```

With:

```typescript
<ResizablePanel defaultSize={50} minSize={20} className={`p-5 ${styles.resizableOverflowAuto}`}>
  {relatedCharacters !== undefined ? (
    <PanelContent data-testid="related-characters-panel">
      {renderPanelHeader(
        'Related Characters',
        'character',
        handleAddExistingRelatedCharacters,
        handleCreateNewRelatedCharacters,
      )}
      {renderEntities(
        relatedCharacters,
        'character',
        handleAddExistingRelatedCharacters,
        handleCreateNewRelatedCharacters,
        true, // useRelationshipIdForUnlink
      )}
    </PanelContent>
  ) : (
    <PanelContent />
  )}
</ResizablePanel>
```

Also update `renderEntities` to accept and pass through `useRelationshipIdForUnlink`:

```typescript
const renderEntities = useCallback(
  (
    entities: Entity[],
    entityType: EntityType,
    onAddExistingClick: () => void,
    onCreateNewClick: () => void,
    useRelationshipIdForUnlink = false,
  ) => {
    if (entities.length === 0) {
      return renderEmptyState(entityType, onAddExistingClick, onCreateNewClick)
    }
    return (
      <EntitiesContainer>
        {entities.map((entity) => renderEntityCard(entity, entityType, useRelationshipIdForUnlink))}
      </EntitiesContainer>
    )
  },
  [renderEmptyState, renderEntityCard],
)
```

**Step: Commit**

```bash
git add packages/app/features/stories/components/RelatedEntitiesGrid.tsx
git commit -m "feat: add related characters panel to RelatedEntitiesGrid"
```

---

## Task 12: Update Character Detail Screen + Page

**Files:**

- Modify: `packages/app/features/characters/detail-screen.tsx`
- Modify: `apps/next/app/[userId]/characters/[characterId]/page.tsx`

### 12a: Update detail-screen.tsx

Update the `RelatedEntities` interface to include `characters`:

```typescript
interface RelatedEntities {
  stories: RelatedEntityItem[]
  locations: RelatedEntityItem[]
  timelines: RelatedEntityItem[]
  characters: RelatedEntityItem[] // ADD
}
```

No other changes needed — it already passes `relatedEntities` through to `EntityDetailScreen`.

### 12b: Update page.tsx

The page already calls `getRelatedEntitiesForCharacter` which now returns `characters`. No changes needed to the page since the data flows through. But we need to import `linkCharacterToCharacter` and `unlinkCharacterFromCharacter` for direct use if needed.

Actually no changes are needed — `linkEntityToCharacter` already handles the 'character' type now.

**Step: Verify TypeScript**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npx tsc --noEmit -p apps/next/tsconfig.json 2>&1 | head -20
```

Expected: No errors.

**Step: Commit**

```bash
git add packages/app/features/characters/detail-screen.tsx
git commit -m "feat: update character detail screen for related characters"
```

---

## Task 13: Install @xyflow/react

**Step 1: Install the package**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npm install @xyflow/react --workspace=packages/app 2>&1 | tail -5
```

If that doesn't work (monorepo setup varies):

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate/apps/next && npm install @xyflow/react
```

**Step 2: Verify it installed**

```bash
ls node_modules/@xyflow/react 2>/dev/null || ls apps/next/node_modules/@xyflow/react 2>/dev/null
```

Expected: Directory exists.

---

## Task 14: /relationships Graph Page

**Files:**

- Create: `apps/next/app/[userId]/characters/[characterId]/relationships/page.tsx`
- Create: `packages/app/features/characters/relationships-screen.tsx`
- Create: `packages/app/features/characters/components/CharacterRelationshipGraph.tsx`

### 14a: Server page

```typescript
// apps/next/app/[userId]/characters/[characterId]/relationships/page.tsx
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '../../../../../auth'
import getCharacterBySlug from '../../../../../actions/character/getCharacterBySlug'
import getCharacterById from '../../../../../actions/character/getCharacterById'
import canUserViewEntity from '../../../../../actions/permissions/canUserViewEntity'
import { getCharacterRelationships } from '../../../../../actions/character-relationships/getCharacterRelationships'
import { CharacterRelationshipsScreen } from '@app/features/characters/relationships-screen'

interface PageProps {
  params: Promise<{ userId: string; characterId: string }>
}

export default async function CharacterRelationshipsPage({ params }: PageProps) {
  const { userId, characterId } = await params
  const headersList = await headers()

  let session
  try {
    session = await auth.api.getSession({ headers: headersList })
  } catch {
    session = null
  }

  let character = await getCharacterBySlug({ userid: userId, slug: characterId })
  if (!character && !isNaN(parseInt(characterId))) {
    character = await getCharacterById({ id: parseInt(characterId) })
  }
  if (!character) notFound()

  const canView = canUserViewEntity({
    viewerId: session?.user?.id,
    ownerId: character.userid,
    privacy: character.privacy as 'public' | 'private',
  })
  if (!canView) notFound()

  const relationships = await getCharacterRelationships({ characterId: character.id })

  return (
    <CharacterRelationshipsScreen
      character={character}
      relationships={relationships}
      userId={userId}
    />
  )
}
```

### 14b: Relationships screen

```typescript
// packages/app/features/characters/relationships-screen.tsx
'use client'

import type { GetCharacterRow } from '@repo/database'
import { CharacterRelationshipGraph } from './components/CharacterRelationshipGraph'
import type { RelatedCharacter } from '../../types/character-relationships'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface CharacterRelationshipsScreenProps {
  character: GetCharacterRow
  relationships: RelatedCharacter[]
  userId: string
}

export function CharacterRelationshipsScreen({
  character,
  relationships,
  userId,
}: CharacterRelationshipsScreenProps) {
  return (
    <div className="min-h-screen p-6">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href={`/${userId}/characters/${character.slug ?? character.id}`}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {character.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        {character.name}&apos;s Relationships
      </h1>

      <div className="w-full h-[600px] border rounded-lg overflow-hidden">
        <CharacterRelationshipGraph
          character={character}
          relationships={relationships}
          userId={userId}
        />
      </div>

      {relationships.length === 0 && (
        <p className="mt-6 text-center text-gray-500">
          No relationships yet. Add some from the character detail page.
        </p>
      )}
    </div>
  )
}
```

### 14c: Create the shared type

```typescript
// packages/app/types/character-relationships.ts
export interface RelatedCharacter {
  id: number
  relationshipId: number
  name: string
  slug: string | null
  primaryImageUrl: string | null
  relationshipLabel: string
  isFamily: boolean
}
```

### 14d: Graph component

```typescript
// packages/app/features/characters/components/CharacterRelationshipGraph.tsx
'use client'

import { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useRouter } from 'next/navigation'
import type { GetCharacterRow } from '@repo/database'
import type { RelatedCharacter } from '../../../types/character-relationships'

interface CharacterRelationshipGraphProps {
  character: GetCharacterRow
  relationships: RelatedCharacter[]
  userId: string
}

function buildNodesAndEdges(
  character: GetCharacterRow,
  relationships: RelatedCharacter[],
): { nodes: Node[]; edges: Edge[] } {
  const centerX = 400
  const centerY = 300
  const radius = 200

  // Center node — current character
  const nodes: Node[] = [
    {
      id: `char-${character.id}`,
      data: { label: character.name, isCenter: true },
      position: { x: centerX, y: centerY },
      style: {
        background: '#4f46e5',
        color: 'white',
        border: '2px solid #3730a3',
        borderRadius: '50%',
        width: 100,
        height: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 600,
        padding: 8,
      },
    },
  ]

  const edges: Edge[] = []

  relationships.forEach((rel, index) => {
    const angle = (2 * Math.PI * index) / Math.max(relationships.length, 1)
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)

    nodes.push({
      id: `char-${rel.id}`,
      data: {
        label: rel.name,
        characterSlug: rel.slug ?? rel.id,
        isFamily: rel.isFamily,
      },
      position: { x, y },
      style: {
        background: rel.isFamily ? '#dbeafe' : '#f3f4f6',
        border: rel.isFamily ? '1px solid #93c5fd' : '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: 12,
        padding: 8,
        width: 100,
        textAlign: 'center',
      },
    })

    edges.push({
      id: `rel-${rel.relationshipId}`,
      source: `char-${character.id}`,
      target: `char-${rel.id}`,
      label: rel.relationshipLabel,
      style: {
        stroke: rel.isFamily ? '#3b82f6' : '#9ca3af',
      },
      labelStyle: { fontSize: 11, fill: '#374151' },
      labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
    })
  })

  return { nodes, edges }
}

export function CharacterRelationshipGraph({
  character,
  relationships,
  userId,
}: CharacterRelationshipGraphProps) {
  const router = useRouter()
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildNodesAndEdges(character, relationships),
    [character, relationships],
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      // Don't navigate for center node
      if (node.id === `char-${character.id}`) return

      const charData = node.data as { characterSlug?: string | number }
      if (charData.characterSlug) {
        router.push(`/${userId}/characters/${charData.characterSlug}/relationships`)
      }
    },
    [character.id, userId, router],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      fitView
      attributionPosition="bottom-right"
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  )
}
```

**Step: Check TypeScript**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npx tsc --noEmit -p apps/next/tsconfig.json 2>&1 | head -20
```

**Step: Commit**

```bash
git add apps/next/app/[userId]/characters/[characterId]/relationships/
git add packages/app/features/characters/relationships-screen.tsx
git add packages/app/features/characters/components/CharacterRelationshipGraph.tsx
git add packages/app/types/character-relationships.ts
git commit -m "feat: add /relationships visual graph page"
```

---

## Task 15: Final Build Verification

**Step 1: Run TypeScript check across all packages**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npx tsc --noEmit -p apps/next/tsconfig.json 2>&1 | head -30
```

**Step 2: Run existing tests**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npx jest --passWithNoTests 2>&1 | tail -20
```

**Step 3: Run build**

```bash
cd /Users/jarrodmedrano/work/story-bible-ultimate && npm run build 2>&1 | tail -30
```

Expected: Build succeeds.

**Step 4: Final commit if any lint fixes were auto-applied**

```bash
git add -A && git commit -m "chore: final build fixes for character relationships feature" 2>/dev/null || echo "Nothing to commit"
```

---

## Summary of New Files

| File                                                                         | Purpose               |
| ---------------------------------------------------------------------------- | --------------------- |
| `apps/database/migration/000010_add_character_relationships.up.sql`          | DB table              |
| `apps/database/sqlc/character_relationships_sql.ts`                          | DB query functions    |
| `packages/app/features/characters/utils/relationshipInverse.ts`              | Label/inverse mapping |
| `apps/next/lib/validations/character-relationship.ts`                        | Zod schema            |
| `apps/next/actions/character-relationships/getCharacterRelationships.ts`     | Fetch relationships   |
| `apps/next/actions/character-relationships/linkCharacterToCharacter.ts`      | Create relationship   |
| `apps/next/actions/character-relationships/unlinkCharacterFromCharacter.ts`  | Delete relationship   |
| `apps/next/app/[userId]/characters/[characterId]/relationships/page.tsx`     | Graph route           |
| `packages/app/features/characters/relationships-screen.tsx`                  | Graph screen          |
| `packages/app/features/characters/components/CharacterRelationshipGraph.tsx` | react-flow graph      |
| `packages/app/types/character-relationships.ts`                              | Shared type           |

## Summary of Modified Files

| File                                                                | Change                                                                       |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `apps/database/index.ts`                                            | Export new SQL module                                                        |
| `packages/app/features/shared/EntityDetailScreen.types.ts`          | Add `relationshipId`, `relationshipLabel`, `isFamily` to `RelatedEntityItem` |
| `apps/next/actions/relationships/getRelatedEntitiesForCharacter.ts` | Return `characters` array                                                    |
| `apps/next/actions/relationships/linkEntityToCharacter.ts`          | Handle 'character' entityType                                                |
| `apps/next/actions/relationships/unlinkEntityFromCharacter.ts`      | Handle 'character' entityType                                                |
| `packages/app/features/shared/EntityDetailScreen.tsx`               | Remove same-type guard, pass relationship selector, add graph link           |
| `packages/app/features/stories/components/RelatedEntitiesGrid.tsx`  | Add 4th panel for related characters                                         |
| `packages/app/features/stories/components/AddExistingModal.tsx`     | Add relationship type selector                                               |
| `packages/app/features/characters/detail-screen.tsx`                | Add `characters` to `RelatedEntities` interface                              |
