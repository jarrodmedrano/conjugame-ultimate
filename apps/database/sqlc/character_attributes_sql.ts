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
