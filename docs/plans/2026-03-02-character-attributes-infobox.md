# Character Attributes Infobox Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Wikipedia-style infobox to character detail pages showing a portrait + key-value attributes (predefined fields like date of birth, sex, etc., plus user-defined custom attributes), all editable via the existing Edit Character modal.

**Architecture:** A new `character_attributes` table stores key-value pairs per character (with ordering). The database package gets new hand-written TypeScript query functions following the existing SQLC pattern. A new `CharacterInfobox` UI component renders the infobox alongside the portrait. Attribute editing is added as a new section in the existing `EditCharacterModal`.

**Tech Stack:** PostgreSQL (migrations), TypeScript SQLC-style query functions, Next.js server actions, React + Tailwind CSS, Zod validation, Radix UI (existing).

---

## Predefined Attribute Keys

These are stored identically to custom attributes (just key-value pairs), but the UI shows them with friendly labels in a fixed order when present:

| Key              | Label          |
| ---------------- | -------------- |
| `date_of_birth`  | Date of Birth  |
| `place_of_birth` | Place of Birth |
| `date_of_death`  | Date of Death  |
| `place_of_death` | Place of Death |
| `sex`            | Sex            |
| `race`           | Race           |
| `hair_color`     | Hair Color     |
| `eye_color`      | Eye Color      |
| `blood_type`     | Blood Type     |

Custom attributes use any other key string and appear after the predefined ones.

---

### Task 1: Database Migration

**Files:**

- Create: `apps/database/migration/000011_add_character_attributes.up.sql`
- Create: `apps/database/migration/000011_add_character_attributes.down.sql`

**Step 1: Write the up migration**

```sql
-- apps/database/migration/000011_add_character_attributes.up.sql
CREATE TABLE character_attributes (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(character_id, key)
);

CREATE INDEX idx_character_attributes_character_id ON character_attributes(character_id);

COMMENT ON TABLE character_attributes IS 'Key-value attributes for characters (predefined and custom)';
COMMENT ON COLUMN character_attributes.key IS 'Attribute key, e.g. date_of_birth, hair_color, or any custom string';
COMMENT ON COLUMN character_attributes.display_order IS 'Order for display (0 = first); predefined attrs get low values';
```

**Step 2: Write the down migration**

```sql
-- apps/database/migration/000011_add_character_attributes.down.sql
DROP TABLE IF EXISTS character_attributes;
```

**Step 3: Apply the migration**

Run: `cd apps/database && make migrate-up`

(Or whatever the project's migration command is — check `apps/database/Makefile`)

Expected: Migration runs without error, `character_attributes` table exists.

**Step 4: Commit**

```bash
git add apps/database/migration/000011_add_character_attributes.up.sql
git add apps/database/migration/000011_add_character_attributes.down.sql
git commit -m "feat: add character_attributes table migration"
```

---

### Task 2: Database Query Functions

**Files:**

- Create: `apps/database/sqlc/character_attributes_sql.ts`
- Modify: `apps/database/index.ts`

**Step 1: Create the query functions file**

```typescript
// apps/database/sqlc/character_attributes_sql.ts
import { QueryArrayConfig, QueryArrayResult } from 'pg'

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CharacterAttribute {
  id: number
  characterId: number
  key: string
  value: string | null
  displayOrder: number | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ─── GetCharacterAttributes ────────────────────────────────────────────────────

export const getCharacterAttributesQuery = `-- name: GetCharacterAttributes :many
SELECT id, character_id, key, value, display_order, created_at, updated_at
FROM character_attributes
WHERE character_id = $1
ORDER BY display_order ASC, id ASC`

export interface GetCharacterAttributesArgs {
  characterId: number
}

export async function getCharacterAttributes(
  client: Client,
  args: GetCharacterAttributesArgs,
): Promise<CharacterAttribute[]> {
  const result = await client.query({
    text: getCharacterAttributesQuery,
    values: [args.characterId],
    rowMode: 'array',
  })
  return result.rows.map((row) => ({
    id: row[0],
    characterId: row[1],
    key: row[2],
    value: row[3],
    displayOrder: row[4],
    createdAt: row[5],
    updatedAt: row[6],
  }))
}

// ─── UpsertCharacterAttribute ──────────────────────────────────────────────────

export const upsertCharacterAttributeQuery = `-- name: UpsertCharacterAttribute :one
INSERT INTO character_attributes (character_id, key, value, display_order)
VALUES ($1, $2, $3, $4)
ON CONFLICT (character_id, key)
DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW()
RETURNING id, character_id, key, value, display_order, created_at, updated_at`

export interface UpsertCharacterAttributeArgs {
  characterId: number
  key: string
  value: string | null
  displayOrder: number | null
}

export async function upsertCharacterAttribute(
  client: Client,
  args: UpsertCharacterAttributeArgs,
): Promise<CharacterAttribute | null> {
  const result = await client.query({
    text: upsertCharacterAttributeQuery,
    values: [args.characterId, args.key, args.value, args.displayOrder],
    rowMode: 'array',
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row[0],
    characterId: row[1],
    key: row[2],
    value: row[3],
    displayOrder: row[4],
    createdAt: row[5],
    updatedAt: row[6],
  }
}

// ─── DeleteCharacterAttribute ──────────────────────────────────────────────────

export const deleteCharacterAttributeQuery = `-- name: DeleteCharacterAttribute :exec
DELETE FROM character_attributes
WHERE id = $1 AND character_id = $2`

export interface DeleteCharacterAttributeArgs {
  id: number
  characterId: number
}

export async function deleteCharacterAttribute(
  client: Client,
  args: DeleteCharacterAttributeArgs,
): Promise<void> {
  await client.query({
    text: deleteCharacterAttributeQuery,
    values: [args.id, args.characterId],
    rowMode: 'array',
  })
}
```

**Step 2: Add export to database package index**

In `apps/database/index.ts`, add:

```typescript
export * from './sqlc/character_attributes_sql'
```

**Step 3: Build the database package to verify TypeScript compiles**

Run: `cd apps/database && npx tsc --noEmit`

Expected: No TypeScript errors.

**Step 4: Commit**

```bash
git add apps/database/sqlc/character_attributes_sql.ts apps/database/index.ts
git commit -m "feat: add character_attributes database query functions"
```

---

### Task 3: Validation Schema

**Files:**

- Modify: `apps/next/lib/validations/character.ts`

**Step 1: Add attribute schemas to the existing character validation file**

Append to `apps/next/lib/validations/character.ts`:

```typescript
/**
 * Validation schema for upserting a character attribute
 */
export const UpsertCharacterAttributeSchema = z.object({
  key: z
    .string()
    .min(1, 'Key is required')
    .max(100, 'Key must be 100 characters or less')
    .trim()
    .regex(
      /^[a-z0-9_]+$/,
      'Key must be lowercase letters, numbers, and underscores only',
    ),
  value: z
    .string()
    .max(500, 'Value must be 500 characters or less')
    .trim()
    .nullable()
    .optional(),
  displayOrder: z.number().int().min(0).optional().nullable(),
})

export type UpsertCharacterAttributeInput = z.infer<
  typeof UpsertCharacterAttributeSchema
>

/**
 * Validation schema for deleting a character attribute
 */
export const DeleteCharacterAttributeSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Attribute ID must be a valid number')
    .transform((val) => parseInt(val, 10)),
})

export type DeleteCharacterAttributeInput = z.infer<
  typeof DeleteCharacterAttributeSchema
>
```

**Step 2: Verify TypeScript compiles**

Run: `cd apps/next && npx tsc --noEmit`

Expected: No errors related to the new schema.

**Step 3: Commit**

```bash
git add apps/next/lib/validations/character.ts
git commit -m "feat: add character attribute validation schemas"
```

---

### Task 4: API Route for Attributes

**Files:**

- Create: `apps/next/app/api/character/[id]/attributes/route.ts`

**Step 1: Write the API route**

```typescript
// apps/next/app/api/character/[id]/attributes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/auth-middleware'
import { rateLimit, RateLimitConfigs } from '../../../../../lib/rate-limit'
import {
  UpsertCharacterAttributeSchema,
  DeleteCharacterAttributeSchema,
} from '../../../../../lib/validations/character'
import {
  getCharacterAttributes,
  upsertCharacterAttribute,
  deleteCharacterAttribute,
} from '@repo/database'
import pool from '../../../../utils/open-pool'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/character/[id]/attributes
export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error

  const { id } = await params
  const characterId = parseInt(id, 10)
  if (isNaN(characterId)) {
    return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const attributes = await getCharacterAttributes(client, { characterId })
    return NextResponse.json(attributes)
  } catch (error) {
    console.error(
      'Error fetching character attributes:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to fetch attributes' },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}

// POST /api/character/[id]/attributes — upsert one attribute
export async function POST(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const { id } = await params
  const characterId = parseInt(id, 10)
  if (isNaN(characterId)) {
    return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const validated = UpsertCharacterAttributeSchema.parse(body)

    const client = await pool.connect()
    try {
      // Verify ownership: character must belong to this user
      const ownershipCheck = await client.query({
        text: 'SELECT "userId" FROM characters WHERE id = $1 LIMIT 1',
        values: [characterId],
      })
      if (ownershipCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Character not found' },
          { status: 404 },
        )
      }
      if (ownershipCheck.rows[0].userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const attribute = await upsertCharacterAttribute(client, {
        characterId,
        key: validated.key,
        value: validated.value ?? null,
        displayOrder: validated.displayOrder ?? null,
      })

      return NextResponse.json(attribute, { status: 201 })
    } finally {
      client.release()
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'Error upserting character attribute:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to save attribute' },
      { status: 500 },
    )
  }
}

// DELETE /api/character/[id]/attributes?id=<attributeId>
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await rateLimit(request, RateLimitConfigs.api)
  if (rateLimitResult) return rateLimitResult

  const authResult = await requireAuth(request)
  if (authResult.error) return authResult.error
  const { user } = authResult

  const { id } = await params
  const characterId = parseInt(id, 10)
  if (isNaN(characterId)) {
    return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 })
  }

  try {
    const url = new URL(request.url)
    const validated = DeleteCharacterAttributeSchema.parse({
      id: url.searchParams.get('id'),
    })

    const client = await pool.connect()
    try {
      // Verify ownership
      const ownershipCheck = await client.query({
        text: 'SELECT "userId" FROM characters WHERE id = $1 LIMIT 1',
        values: [characterId],
      })
      if (ownershipCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Character not found' },
          { status: 404 },
        )
      }
      if (ownershipCheck.rows[0].userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await deleteCharacterAttribute(client, {
        id: validated.id,
        characterId,
      })

      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }
    console.error(
      'Error deleting character attribute:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.json(
      { error: 'Failed to delete attribute' },
      { status: 500 },
    )
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd apps/next && npx tsc --noEmit`

Expected: No errors.

**Step 3: Commit**

```bash
git add apps/next/app/api/character/[id]/attributes/route.ts
git commit -m "feat: add character attributes API route (GET, POST, DELETE)"
```

---

### Task 5: CharacterInfobox Component

**Files:**

- Create: `packages/app/features/characters/components/CharacterInfobox.tsx`

This is the Wikipedia-style box that displays the character portrait + attributes.

**Step 1: Create the component**

```typescript
// packages/app/features/characters/components/CharacterInfobox.tsx
'use client'

import Image from 'next/image'
import type { CharacterAttribute } from '@repo/database'

// Predefined attribute configuration (display order + labels)
const PREDEFINED_ATTRIBUTES: Array<{ key: string; label: string }> = [
  { key: 'date_of_birth', label: 'Date of Birth' },
  { key: 'place_of_birth', label: 'Place of Birth' },
  { key: 'date_of_death', label: 'Date of Death' },
  { key: 'place_of_death', label: 'Place of Death' },
  { key: 'sex', label: 'Sex' },
  { key: 'race', label: 'Race' },
  { key: 'hair_color', label: 'Hair Color' },
  { key: 'eye_color', label: 'Eye Color' },
  { key: 'blood_type', label: 'Blood Type' },
]

const PREDEFINED_KEYS = new Set(PREDEFINED_ATTRIBUTES.map((a) => a.key))

function getLabelForKey(key: string): string {
  const predefined = PREDEFINED_ATTRIBUTES.find((a) => a.key === key)
  if (predefined) return predefined.label
  // Convert snake_case to Title Case for custom keys
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function sortAttributes(attributes: CharacterAttribute[]): CharacterAttribute[] {
  const predefinedOrder = PREDEFINED_ATTRIBUTES.map((a) => a.key)
  return [...attributes].sort((a, b) => {
    const aIdx = predefinedOrder.indexOf(a.key)
    const bIdx = predefinedOrder.indexOf(b.key)
    // Predefined attributes first (in defined order)
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    if (aIdx !== -1) return -1
    if (bIdx !== -1) return 1
    // Custom attributes: sort by display_order then by key
    return (a.displayOrder ?? 999) - (b.displayOrder ?? 999)
  })
}

interface CharacterInfoboxProps {
  characterName: string
  primaryImageUrl?: string
  attributes: CharacterAttribute[]
  theme?: string
}

export function CharacterInfobox({
  characterName,
  primaryImageUrl,
  attributes,
  theme,
}: CharacterInfoboxProps) {
  const isDark = theme === 'dark'

  // Only render if there's an image or at least one attribute
  if (!primaryImageUrl && attributes.length === 0) return null

  const sortedAttributes = sortAttributes(attributes)

  return (
    <aside
      data-testid="character-infobox"
      className={`
        float-right ml-6 mb-4 w-64 border rounded-sm text-sm
        ${isDark ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300 text-gray-900'}
      `}
    >
      {/* Infobox title */}
      <div
        className={`
          px-3 py-2 text-center font-semibold text-sm border-b
          ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'}
        `}
      >
        {characterName}
      </div>

      {/* Portrait */}
      {primaryImageUrl && (
        <div className="p-2 flex justify-center border-b border-gray-300 dark:border-gray-600">
          <div className="relative w-full" style={{ aspectRatio: '3/4', maxHeight: '256px' }}>
            <Image
              src={primaryImageUrl}
              alt={`${characterName} portrait`}
              fill
              className="object-cover"
              sizes="256px"
            />
          </div>
        </div>
      )}

      {/* Attributes table */}
      {sortedAttributes.length > 0 && (
        <table className="w-full text-xs">
          <tbody>
            {sortedAttributes.map((attr) => (
              <tr
                key={attr.id}
                className={`border-b last:border-b-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <th
                  className={`
                    px-2 py-1.5 text-left font-semibold w-[45%] align-top
                    ${isDark ? 'bg-gray-750 text-gray-300' : 'bg-gray-100 text-gray-700'}
                  `}
                >
                  {getLabelForKey(attr.key)}
                </th>
                <td className="px-2 py-1.5 align-top break-words">
                  {attr.value || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </aside>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` from the monorepo root (or `packages/app`).

Expected: No errors.

**Step 3: Commit**

```bash
git add packages/app/features/characters/components/CharacterInfobox.tsx
git commit -m "feat: add CharacterInfobox component (Wikipedia-style)"
```

---

### Task 6: Attribute Editor Component

This is the attribute editing UI that lives inside the Edit Character modal.

**Files:**

- Create: `packages/app/features/characters/components/AttributeEditor.tsx`

**Step 1: Create the component**

```typescript
// packages/app/features/characters/components/AttributeEditor.tsx
'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { CharacterAttribute } from '@repo/database'

const PREDEFINED_ATTRIBUTE_OPTIONS = [
  { key: 'date_of_birth', label: 'Date of Birth' },
  { key: 'place_of_birth', label: 'Place of Birth' },
  { key: 'date_of_death', label: 'Date of Death' },
  { key: 'place_of_death', label: 'Place of Death' },
  { key: 'sex', label: 'Sex' },
  { key: 'race', label: 'Race' },
  { key: 'hair_color', label: 'Hair Color' },
  { key: 'eye_color', label: 'Eye Color' },
  { key: 'blood_type', label: 'Blood Type' },
]

function getLabelForKey(key: string): string {
  const predefined = PREDEFINED_ATTRIBUTE_OPTIONS.find((a) => a.key === key)
  if (predefined) return predefined.label
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface AttributeEditorProps {
  characterId: number
  attributes: CharacterAttribute[]
  onAttributesChange: (attributes: CharacterAttribute[]) => void
  theme?: string
  disabled?: boolean
}

export function AttributeEditor({
  characterId,
  attributes,
  onAttributesChange,
  theme,
  disabled = false,
}: AttributeEditorProps) {
  const isDark = theme === 'dark'
  const [isAdding, setIsAdding] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [isCustomKey, setIsCustomKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existingKeys = new Set(attributes.map((a) => a.key))

  const availablePredefined = PREDEFINED_ATTRIBUTE_OPTIONS.filter(
    (opt) => !existingKeys.has(opt.key),
  )

  const handleAddAttribute = async () => {
    const key = isCustomKey ? newKey.trim().toLowerCase().replace(/\s+/g, '_') : newKey
    if (!key || !newValue.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/character/${characterId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: newValue.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save attribute')
      }

      const saved: CharacterAttribute = await response.json()
      onAttributesChange([...attributes, saved])
      setNewKey('')
      setNewValue('')
      setIsAdding(false)
      setIsCustomKey(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attribute')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAttribute = async (attributeId: number) => {
    setError(null)
    try {
      const response = await fetch(
        `/api/character/${characterId}/attributes?id=${attributeId}`,
        { method: 'DELETE' },
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete attribute')
      }

      onAttributesChange(attributes.filter((a) => a.id !== attributeId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attribute')
    }
  }

  const handleUpdateValue = async (attribute: CharacterAttribute, newVal: string) => {
    // Optimistically update local state
    onAttributesChange(
      attributes.map((a) =>
        a.id === attribute.id ? { ...a, value: newVal } : a,
      ),
    )

    try {
      const response = await fetch(`/api/character/${characterId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: attribute.key, value: newVal }),
      })

      if (!response.ok) {
        // Revert on failure
        onAttributesChange(attributes)
        const data = await response.json()
        throw new Error(data.error || 'Failed to update attribute')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update attribute')
    }
  }

  const inputClasses = `
    w-full px-2 py-1.5 text-sm rounded border
    ${isDark
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
    focus:outline-none focus:ring-1 focus:ring-blue-500
    disabled:opacity-50
  `

  return (
    <div data-testid="attribute-editor">
      {/* Existing attributes */}
      {attributes.length > 0 && (
        <div className="space-y-2 mb-3">
          {attributes.map((attr) => (
            <div key={attr.id} className="flex items-center gap-2">
              <span
                className={`text-xs font-medium w-28 shrink-0 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              >
                {getLabelForKey(attr.key)}
              </span>
              <input
                type="text"
                className={inputClasses}
                value={attr.value ?? ''}
                onChange={(e) => handleUpdateValue(attr, e.target.value)}
                disabled={disabled}
                placeholder="Enter value"
              />
              <button
                type="button"
                aria-label={`Delete ${getLabelForKey(attr.key)}`}
                onClick={() => handleDeleteAttribute(attr.id)}
                disabled={disabled}
                className="shrink-0 p-1 rounded text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 mb-2" role="alert">{error}</p>
      )}

      {/* Add new attribute */}
      {isAdding ? (
        <div className="space-y-2 p-3 rounded border border-dashed border-gray-400">
          {/* Key selector */}
          <div className="flex gap-2">
            {!isCustomKey && availablePredefined.length > 0 ? (
              <select
                className={`${inputClasses} flex-1`}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                disabled={isSaving}
              >
                <option value="">Select attribute...</option>
                {availablePredefined.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className={`${inputClasses} flex-1`}
                placeholder="Custom attribute name"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                disabled={isSaving}
              />
            )}
            <button
              type="button"
              onClick={() => {
                setIsCustomKey(!isCustomKey)
                setNewKey('')
              }}
              className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              disabled={isSaving}
            >
              {isCustomKey ? 'Predefined' : 'Custom'}
            </button>
          </div>

          {/* Value input */}
          <input
            type="text"
            className={inputClasses}
            placeholder="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAddAttribute() }
              if (e.key === 'Escape') { setIsAdding(false); setNewKey(''); setNewValue('') }
            }}
            disabled={isSaving}
          />

          {/* Add/Cancel buttons */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setNewKey(''); setNewValue(''); setIsCustomKey(false) }}
              className={`text-xs px-3 py-1.5 rounded ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddAttribute}
              disabled={!newKey || !newValue.trim() || isSaving}
              className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          disabled={disabled}
          className={`
            flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-dashed
            ${isDark
              ? 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'
              : 'border-gray-400 text-gray-500 hover:border-gray-600 hover:text-gray-700'}
            disabled:opacity-50 transition-colors
          `}
          data-testid="add-attribute-button"
        >
          <Plus className="h-3 w-3" />
          Add attribute
        </button>
      )}
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

Expected: No errors.

**Step 3: Commit**

```bash
git add packages/app/features/characters/components/AttributeEditor.tsx
git commit -m "feat: add AttributeEditor component for character attributes"
```

---

### Task 7: Wire AttributeEditor into EditCharacterModal

**Files:**

- Modify: `packages/app/features/characters/components/EditCharacterModal.tsx`
- Modify: `packages/app/features/characters/hooks/useCharacterEdit.ts`

**Step 1: Add `attributes` to `CharacterFormData`**

In `useCharacterEdit.ts`, update the `CharacterFormData` interface and related functions:

```typescript
// Add import at top:
import type { CharacterAttribute } from '@repo/database'

// Update CharacterFormData:
export interface CharacterFormData {
  name: string
  description: string
  images: EntityImage[]
  attributes: CharacterAttribute[]   // ADD THIS
}

// Update UseCharacterEditArgs:
export interface UseCharacterEditArgs {
  character: GetCharacterRow
  images?: EntityImage[]
  attributes?: CharacterAttribute[]   // ADD THIS
  onSave?: (updatedCharacter: CharacterFormData) => void
  onCancel?: () => void
}

// Update createInitialFormData:
function createInitialFormData(
  character: GetCharacterRow,
  images: EntityImage[] = [],
  attributes: CharacterAttribute[] = [],   // ADD THIS
): CharacterFormData {
  return {
    name: character.name,
    description: character.description || '',
    images,
    attributes,   // ADD THIS
  }
}

// Update useCharacterEdit to accept and pass attributes:
export function useCharacterEdit(args: UseCharacterEditArgs): UseCharacterEditReturn {
  const { character, images = [], attributes = [], onSave, onCancel } = args

  const [formData, setFormData] = useState<CharacterFormData>(() =>
    createInitialFormData(character, images, attributes),
  )
  // ... rest of function unchanged, but update cancelEditing:
  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setFormData(createInitialFormData(character, images, attributes))
    if (onCancel) onCancel()
  }, [character, images, attributes, onCancel])

  // Update resetForm:
  const resetForm = useCallback(() => {
    setFormData(createInitialFormData(character, images, attributes))
  }, [character, images, attributes])
```

**Step 2: Update `updateField` type in the hook**

The `updateField` function's type needs to handle the new `attributes` field. Since `CharacterAttribute[]` is neither `string` nor `EntityImage[]`, update the union:

```typescript
// In useCharacterEdit.ts
import type { CharacterAttribute } from '@repo/database'

// Update updateField signature:
updateField: (
  field: keyof CharacterFormData,
  value: string | EntityImage[] | CharacterAttribute[],
) => void
```

**Step 3: Add AttributeEditor section to EditCharacterModal**

In `EditCharacterModal.tsx`, add:

```typescript
// Add import at top:
import { AttributeEditor } from './AttributeEditor'
import type { CharacterAttribute } from '@repo/database'

// Update EditCharacterModalProps:
interface EditCharacterModalProps {
  // ... existing props ...
  attributes?: CharacterAttribute[]   // ADD THIS
}

// Inside the component, destructure:
// { ..., attributes = [], ... }

// Add after the Images FormField (before ButtonGroup):
<FormField>
  <Label $theme={theme}>
    Attributes
  </Label>
  <AttributeEditor
    characterId={characterId!}
    attributes={formData.attributes}
    onAttributesChange={(updated) => onChange('attributes', updated)}
    theme={theme}
    disabled={isSaving}
  />
</FormField>
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: No errors (may need to fix the `updateField` union type cascading through `EntityDetailScreen`).

**Step 5: Commit**

```bash
git add packages/app/features/characters/hooks/useCharacterEdit.ts
git add packages/app/features/characters/components/EditCharacterModal.tsx
git commit -m "feat: add attribute editing to EditCharacterModal"
```

---

### Task 8: Wire CharacterInfobox into CharacterDetail

**Files:**

- Modify: `packages/app/features/characters/components/CharacterDetail.tsx`

**Step 1: Update CharacterDetail to accept and display attributes**

```typescript
// Add import:
import { CharacterInfobox } from './CharacterInfobox'
import type { CharacterAttribute } from '@repo/database'

// Add to CharacterDetailProps interface:
attributes?: CharacterAttribute[]

// Add to function parameters:
// { ..., attributes = [], ... }

// REMOVE the primaryImageUrl from DetailHeader (it will show in the infobox instead)
// Or keep it — decide: the infobox shows the large portrait, DetailHeader keeps its thumbnail

// Add the infobox above the Content block:
// Inside the flex container, before <Content>:
<CharacterInfobox
  characterName={character.name}
  primaryImageUrl={primaryImage?.cloudinaryUrl}
  attributes={attributes}
  theme={theme}
/>
```

The `CharacterInfobox` uses `float-right` so it flows alongside the description text in Wikipedia style.

**Step 2: Verify TypeScript compiles**

Expected: No errors.

**Step 3: Commit**

```bash
git add packages/app/features/characters/components/CharacterDetail.tsx
git commit -m "feat: add CharacterInfobox to character detail page"
```

---

### Task 9: Wire Attributes Through the Detail Screen and Page

**Files:**

- Modify: `packages/app/features/characters/detail-screen.tsx`
- Modify: `apps/next/app/[userId]/characters/[characterId]/page.tsx`

**Step 1: Fetch attributes in the page component**

In `page.tsx`, add attribute fetching after images are fetched:

```typescript
// Add import at top:
import { getCharacterAttributes } from '@repo/database'
import type { CharacterAttribute } from '@repo/database'

// After images fetching block, add:
let attributes: CharacterAttribute[] = []
try {
  const dbClient = await pool.connect()
  try {
    attributes = await getCharacterAttributes(dbClient, {
      characterId: character.id,
    })
  } finally {
    dbClient.release()
  }
} catch {
  attributes = []
}

// Pass to CharacterDetailScreen:
<CharacterDetailScreen
  // ... existing props ...
  attributes={attributes}
/>
```

(Note: Reuse the existing pool client block — open one connection and do both queries.)

**Step 2: Pass attributes through CharacterDetailScreen**

In `detail-screen.tsx`:

```typescript
// Add to CharacterDetailScreenProps:
attributes?: CharacterAttribute[]

// Update useCharacterEditWithImages to inject attributes:
const useCharacterEditWithImages = (config: Record<string, unknown>) => {
  return useCharacterEdit({
    ...config,
    images: props.images,
    attributes: props.attributes ?? [],   // ADD THIS
  } as never)
}

// Pass attributes to DetailComponent and EditModalComponent:
// In DetailComponent:
<CharacterDetail
  // ... existing props ...
  attributes={props.attributes ?? []}
/>

// In EditModalComponent:
<EditCharacterModal
  // ... existing props ...
  attributes={editProps.formData.attributes}
/>
```

**Step 3: Verify TypeScript compiles across the full app**

Run from monorepo root: `npx tsc --noEmit` (or each package separately)

Expected: No errors.

**Step 4: Commit**

```bash
git add packages/app/features/characters/detail-screen.tsx
git add apps/next/app/[userId]/characters/[characterId]/page.tsx
git commit -m "feat: wire character attributes through detail screen and page"
```

---

### Task 10: Optimize Pool Usage in page.tsx

The page currently opens separate connections for images and attributes. Consolidate to a single connection.

**Files:**

- Modify: `apps/next/app/[userId]/characters/[characterId]/page.tsx`

**Step 1: Merge the two database fetches into one pool connection**

```typescript
// Replace the two separate pool.connect() blocks with one:
const client = await pool.connect()
let images: EntityImage[] = []
let attributes: CharacterAttribute[] = []
try {
  const [dbImages, dbAttributes] = await Promise.all([
    getEntityImages(client, {
      entityType: 'character',
      entityId: character.id,
    }),
    getCharacterAttributes(client, { characterId: character.id }),
  ])
  images = dbImages.map(/* existing mapping */)
  attributes = dbAttributes
} finally {
  client.release()
}
```

**Step 2: Verify TypeScript and test manually**

Expected: Character detail page loads with attributes displayed.

**Step 3: Commit**

```bash
git add apps/next/app/[userId]/characters/[characterId]/page.tsx
git commit -m "perf: consolidate character detail DB queries into single connection"
```

---

### Task 11: Build the Database Package

The database package needs to be rebuilt so its `dist/` output reflects the new `character_attributes_sql.ts`.

**Files:**

- Modify: `apps/database/dist/` (generated output)

**Step 1: Build the package**

Run: `cd apps/database && npm run build` (check `package.json` for the build script name)

Expected: `apps/database/dist/sqlc/character_attributes_sql.d.ts` is generated, `dist/index.d.ts` exports it.

**Step 2: Commit the dist output**

```bash
git add apps/database/dist/
git commit -m "build: rebuild database package with character_attributes queries"
```

---

### Task 12: Manual Smoke Test

With the app running locally:

1. Navigate to a character detail page.
2. If the character has no attributes and no portrait, the infobox should **not render**.
3. If the character has a portrait, the infobox should show just the portrait.
4. Click **Edit** on a character you own.
5. Scroll to the **Attributes** section in the modal.
6. Click **Add attribute** → select "Date of Birth" from the predefined list → enter a value → click Add.
7. Verify it appears in the attribute list.
8. Close modal → infobox should show the new attribute.
9. Reopen modal → edit the attribute value inline.
10. Delete an attribute using the trash icon.
11. Add a **custom attribute** by clicking "Custom" toggle, entering a name and value.
12. Verify custom attribute appears in infobox with title-cased label.
13. Test as a non-owner viewing the character (attributes read-only, no edit UI shown).

---

## Summary of Files Changed

| File                                                                 | Action               |
| -------------------------------------------------------------------- | -------------------- |
| `apps/database/migration/000011_add_character_attributes.up.sql`     | Create               |
| `apps/database/migration/000011_add_character_attributes.down.sql`   | Create               |
| `apps/database/sqlc/character_attributes_sql.ts`                     | Create               |
| `apps/database/index.ts`                                             | Modify (add export)  |
| `apps/database/dist/`                                                | Rebuild              |
| `apps/next/lib/validations/character.ts`                             | Modify (add schemas) |
| `apps/next/app/api/character/[id]/attributes/route.ts`               | Create               |
| `packages/app/features/characters/components/CharacterInfobox.tsx`   | Create               |
| `packages/app/features/characters/components/AttributeEditor.tsx`    | Create               |
| `packages/app/features/characters/components/EditCharacterModal.tsx` | Modify               |
| `packages/app/features/characters/components/CharacterDetail.tsx`    | Modify               |
| `packages/app/features/characters/hooks/useCharacterEdit.ts`         | Modify               |
| `packages/app/features/characters/detail-screen.tsx`                 | Modify               |
| `apps/next/app/[userId]/characters/[characterId]/page.tsx`           | Modify               |
