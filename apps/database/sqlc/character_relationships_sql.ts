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

export interface GetCharacterRelationshipRow {
  id: number
  characterIdA: number
  characterIdB: number
  relationshipType: string
  customLabel: string | null
  createdBy: string
  createdAt: Date | null
}

export async function getCharacterRelationship(
  client: Client,
  args: GetCharacterRelationshipArgs,
): Promise<GetCharacterRelationshipRow | null> {
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
