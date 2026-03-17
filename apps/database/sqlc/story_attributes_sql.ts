import { QueryArrayConfig, QueryArrayResult } from 'pg'

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoryAttribute {
  id: number
  storyId: number
  key: string
  value: string | null
  displayOrder: number | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ─── GetStoryAttributes ────────────────────────────────────────────────────

export const getStoryAttributesQuery = `-- name: GetStoryAttributes :many
SELECT id, story_id, key, value, display_order, created_at, updated_at
FROM story_attributes
WHERE story_id = $1
ORDER BY display_order ASC, id ASC`

export interface GetStoryAttributesArgs {
  storyId: number
}

export async function getStoryAttributes(
  client: Client,
  args: GetStoryAttributesArgs,
): Promise<StoryAttribute[]> {
  const result = await client.query({
    text: getStoryAttributesQuery,
    values: [args.storyId],
    rowMode: 'array',
  })
  return result.rows.map((row) => ({
    id: row[0],
    storyId: row[1],
    key: row[2],
    value: row[3],
    displayOrder: row[4],
    createdAt: row[5],
    updatedAt: row[6],
  }))
}

// ─── UpsertStoryAttribute ──────────────────────────────────────────────────────

export const upsertStoryAttributeQuery = `-- name: UpsertStoryAttribute :one
INSERT INTO story_attributes (story_id, key, value, display_order)
VALUES ($1, $2, $3, $4)
ON CONFLICT (story_id, key)
DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW()
RETURNING id, story_id, key, value, display_order, created_at, updated_at`

export interface UpsertStoryAttributeArgs {
  storyId: number
  key: string
  value: string | null
  displayOrder: number | null
}

export async function upsertStoryAttribute(
  client: Client,
  args: UpsertStoryAttributeArgs,
): Promise<StoryAttribute | null> {
  const result = await client.query({
    text: upsertStoryAttributeQuery,
    values: [args.storyId, args.key, args.value, args.displayOrder],
    rowMode: 'array',
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row[0],
    storyId: row[1],
    key: row[2],
    value: row[3],
    displayOrder: row[4],
    createdAt: row[5],
    updatedAt: row[6],
  }
}

// ─── DeleteStoryAttribute ──────────────────────────────────────────────────────

export const deleteStoryAttributeQuery = `-- name: DeleteStoryAttribute :exec
DELETE FROM story_attributes
WHERE id = $1 AND story_id = $2`

export interface DeleteStoryAttributeArgs {
  id: number
  storyId: number
}

export async function deleteStoryAttribute(
  client: Client,
  args: DeleteStoryAttributeArgs,
): Promise<void> {
  await client.query({
    text: deleteStoryAttributeQuery,
    values: [args.id, args.storyId],
    rowMode: 'array',
  })
}
