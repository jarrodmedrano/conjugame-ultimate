import { QueryArrayConfig, QueryArrayResult } from 'pg'

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocationAttribute {
  id: number
  locationId: number
  key: string
  value: string | null
  displayOrder: number | null
  createdAt: Date | null
  updatedAt: Date | null
}

// ─── GetLocationAttributes ────────────────────────────────────────────────────

export const getLocationAttributesQuery = `-- name: GetLocationAttributes :many
SELECT id, location_id, key, value, display_order, created_at, updated_at
FROM location_attributes
WHERE location_id = $1
ORDER BY display_order ASC, id ASC`

export interface GetLocationAttributesArgs {
  locationId: number
}

export async function getLocationAttributes(
  client: Client,
  args: GetLocationAttributesArgs,
): Promise<LocationAttribute[]> {
  const result = await client.query({
    text: getLocationAttributesQuery,
    values: [args.locationId],
    rowMode: 'array',
  })
  return result.rows.map((row) => ({
    id: row[0],
    locationId: row[1],
    key: row[2],
    value: row[3],
    displayOrder: row[4],
    createdAt: row[5],
    updatedAt: row[6],
  }))
}

// ─── UpsertLocationAttribute ──────────────────────────────────────────────────

export const upsertLocationAttributeQuery = `-- name: UpsertLocationAttribute :one
INSERT INTO location_attributes (location_id, key, value, display_order)
VALUES ($1, $2, $3, $4)
ON CONFLICT (location_id, key)
DO UPDATE SET value = EXCLUDED.value, display_order = EXCLUDED.display_order, updated_at = NOW()
RETURNING id, location_id, key, value, display_order, created_at, updated_at`

export interface UpsertLocationAttributeArgs {
  locationId: number
  key: string
  value: string | null
  displayOrder: number | null
}

export async function upsertLocationAttribute(
  client: Client,
  args: UpsertLocationAttributeArgs,
): Promise<LocationAttribute | null> {
  const result = await client.query({
    text: upsertLocationAttributeQuery,
    values: [args.locationId, args.key, args.value, args.displayOrder],
    rowMode: 'array',
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row[0],
    locationId: row[1],
    key: row[2],
    value: row[3],
    displayOrder: row[4],
    createdAt: row[5],
    updatedAt: row[6],
  }
}

// ─── DeleteLocationAttribute ──────────────────────────────────────────────────

export const deleteLocationAttributeQuery = `-- name: DeleteLocationAttribute :exec
DELETE FROM location_attributes
WHERE id = $1 AND location_id = $2`

export interface DeleteLocationAttributeArgs {
  id: number
  locationId: number
}

export async function deleteLocationAttribute(
  client: Client,
  args: DeleteLocationAttributeArgs,
): Promise<void> {
  await client.query({
    text: deleteLocationAttributeQuery,
    values: [args.id, args.locationId],
    rowMode: 'array',
  })
}
