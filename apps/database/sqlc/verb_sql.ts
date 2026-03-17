import { Client } from 'pg'

export interface VerbRow {
  id: number
  name: string
  language: string
  infinitive: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateVerbArgs {
  name: string
  language: string
  infinitive: string | null
}

export interface ListVerbsByLanguageArgs {
  language: string
  limit: number
  offset: number
}

export interface ListAllVerbsArgs {
  limit: number
  offset: number
}

export interface UpdateVerbArgs {
  id: number
  name: string | null
  language: string | null
  infinitive: string | null
}

const createVerbQuery = `
INSERT INTO verbs (name, language, infinitive)
VALUES ($1, $2, $3)
RETURNING id, name, language, infinitive, created_at, updated_at
`

export async function createVerb(client: Client, args: CreateVerbArgs): Promise<VerbRow> {
  const result = await client.query(createVerbQuery, [args.name, args.language, args.infinitive])
  return result.rows[0]
}

const getVerbQuery = `SELECT id, name, language, infinitive, created_at, updated_at FROM verbs WHERE id = $1 LIMIT 1`

export async function getVerb(client: Client, args: { id: number }): Promise<VerbRow | null> {
  const result = await client.query(getVerbQuery, [args.id])
  return result.rows.length > 0 ? result.rows[0] : null
}

const listVerbsByLanguageQuery = `
SELECT id, name, language, infinitive, created_at, updated_at
FROM verbs WHERE language = $1 ORDER BY name ASC LIMIT $2 OFFSET $3
`

export async function listVerbsByLanguage(client: Client, args: ListVerbsByLanguageArgs): Promise<VerbRow[]> {
  const result = await client.query(listVerbsByLanguageQuery, [args.language, args.limit, args.offset])
  return result.rows
}

const listAllVerbsQuery = `
SELECT id, name, language, infinitive, created_at, updated_at
FROM verbs ORDER BY language, name ASC LIMIT $1 OFFSET $2
`

export async function listAllVerbs(client: Client, args: ListAllVerbsArgs): Promise<VerbRow[]> {
  const result = await client.query(listAllVerbsQuery, [args.limit, args.offset])
  return result.rows
}

const updateVerbQuery = `
UPDATE verbs SET
  name = COALESCE($2, name),
  language = COALESCE($3, language),
  infinitive = COALESCE($4, infinitive),
  updated_at = NOW()
WHERE id = $1
RETURNING id, name, language, infinitive, created_at, updated_at
`

export async function updateVerb(client: Client, args: UpdateVerbArgs): Promise<VerbRow> {
  const result = await client.query(updateVerbQuery, [args.id, args.name, args.language, args.infinitive])
  return result.rows[0]
}

const deleteVerbQuery = `DELETE FROM verbs WHERE id = $1`

export async function deleteVerb(client: Client, args: { id: number }): Promise<void> {
  await client.query(deleteVerbQuery, [args.id])
}
