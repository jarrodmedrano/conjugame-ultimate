import { QueryArrayConfig, QueryArrayResult } from 'pg'

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>
}

export const getEntityImagesQuery = `-- name: GetEntityImages :many

SELECT id, entity_type, entity_id, cloudinary_public_id, cloudinary_url, is_primary, display_order, file_name, file_size, width, height, created_at, updated_at FROM entity_images
WHERE entity_type = $1 AND entity_id = $2
ORDER BY is_primary DESC, display_order ASC`

export interface GetEntityImagesArgs {
  entityType: string
  entityId: number
}

export interface GetEntityImagesRow {
  id: number
  entityType: string
  entityId: number
  cloudinaryPublicId: string
  cloudinaryUrl: string
  isPrimary: boolean | null
  displayOrder: number | null
  fileName: string | null
  fileSize: number | null
  width: number | null
  height: number | null
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getEntityImages(
  client: Client,
  args: GetEntityImagesArgs,
): Promise<GetEntityImagesRow[]> {
  const result = await client.query({
    text: getEntityImagesQuery,
    values: [args.entityType, args.entityId],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      entityType: row[1],
      entityId: row[2],
      cloudinaryPublicId: row[3],
      cloudinaryUrl: row[4],
      isPrimary: row[5],
      displayOrder: row[6],
      fileName: row[7],
      fileSize: row[8],
      width: row[9],
      height: row[10],
      createdAt: row[11],
      updatedAt: row[12],
    }
  })
}

export const getPrimaryImageQuery = `-- name: GetPrimaryImage :one
SELECT id, entity_type, entity_id, cloudinary_public_id, cloudinary_url, is_primary, display_order, file_name, file_size, width, height, created_at, updated_at FROM entity_images
WHERE entity_type = $1 AND entity_id = $2 AND is_primary = TRUE
LIMIT 1`

export interface GetPrimaryImageArgs {
  entityType: string
  entityId: number
}

export interface GetPrimaryImageRow {
  id: number
  entityType: string
  entityId: number
  cloudinaryPublicId: string
  cloudinaryUrl: string
  isPrimary: boolean | null
  displayOrder: number | null
  fileName: string | null
  fileSize: number | null
  width: number | null
  height: number | null
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getPrimaryImage(
  client: Client,
  args: GetPrimaryImageArgs,
): Promise<GetPrimaryImageRow | null> {
  const result = await client.query({
    text: getPrimaryImageQuery,
    values: [args.entityType, args.entityId],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    entityType: row[1],
    entityId: row[2],
    cloudinaryPublicId: row[3],
    cloudinaryUrl: row[4],
    isPrimary: row[5],
    displayOrder: row[6],
    fileName: row[7],
    fileSize: row[8],
    width: row[9],
    height: row[10],
    createdAt: row[11],
    updatedAt: row[12],
  }
}

export const getGalleryImagesQuery = `-- name: GetGalleryImages :many
SELECT id, entity_type, entity_id, cloudinary_public_id, cloudinary_url, is_primary, display_order, file_name, file_size, width, height, created_at, updated_at FROM entity_images
WHERE entity_type = $1 AND entity_id = $2 AND is_primary = FALSE
ORDER BY display_order ASC`

export interface GetGalleryImagesArgs {
  entityType: string
  entityId: number
}

export interface GetGalleryImagesRow {
  id: number
  entityType: string
  entityId: number
  cloudinaryPublicId: string
  cloudinaryUrl: string
  isPrimary: boolean | null
  displayOrder: number | null
  fileName: string | null
  fileSize: number | null
  width: number | null
  height: number | null
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getGalleryImages(
  client: Client,
  args: GetGalleryImagesArgs,
): Promise<GetGalleryImagesRow[]> {
  const result = await client.query({
    text: getGalleryImagesQuery,
    values: [args.entityType, args.entityId],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      entityType: row[1],
      entityId: row[2],
      cloudinaryPublicId: row[3],
      cloudinaryUrl: row[4],
      isPrimary: row[5],
      displayOrder: row[6],
      fileName: row[7],
      fileSize: row[8],
      width: row[9],
      height: row[10],
      createdAt: row[11],
      updatedAt: row[12],
    }
  })
}

export const createEntityImageQuery = `-- name: CreateEntityImage :one
INSERT INTO entity_images (
  entity_type,
  entity_id,
  cloudinary_public_id,
  cloudinary_url,
  is_primary,
  display_order,
  file_name,
  file_size,
  width,
  height
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, entity_type, entity_id, cloudinary_public_id, cloudinary_url, is_primary, display_order, file_name, file_size, width, height, created_at, updated_at`

export interface CreateEntityImageArgs {
  entityType: string
  entityId: number
  cloudinaryPublicId: string
  cloudinaryUrl: string
  isPrimary: boolean | null
  displayOrder: number | null
  fileName: string | null
  fileSize: number | null
  width: number | null
  height: number | null
}

export interface CreateEntityImageRow {
  id: number
  entityType: string
  entityId: number
  cloudinaryPublicId: string
  cloudinaryUrl: string
  isPrimary: boolean | null
  displayOrder: number | null
  fileName: string | null
  fileSize: number | null
  width: number | null
  height: number | null
  createdAt: Date | null
  updatedAt: Date | null
}

export async function createEntityImage(
  client: Client,
  args: CreateEntityImageArgs,
): Promise<CreateEntityImageRow | null> {
  const result = await client.query({
    text: createEntityImageQuery,
    values: [
      args.entityType,
      args.entityId,
      args.cloudinaryPublicId,
      args.cloudinaryUrl,
      args.isPrimary,
      args.displayOrder,
      args.fileName,
      args.fileSize,
      args.width,
      args.height,
    ],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    entityType: row[1],
    entityId: row[2],
    cloudinaryPublicId: row[3],
    cloudinaryUrl: row[4],
    isPrimary: row[5],
    displayOrder: row[6],
    fileName: row[7],
    fileSize: row[8],
    width: row[9],
    height: row[10],
    createdAt: row[11],
    updatedAt: row[12],
  }
}

export const deleteEntityImageQuery = `-- name: DeleteEntityImage :one
DELETE FROM entity_images
WHERE id = $1
RETURNING cloudinary_public_id`

export interface DeleteEntityImageArgs {
  id: number
}

export interface DeleteEntityImageRow {
  cloudinaryPublicId: string
}

export async function deleteEntityImage(
  client: Client,
  args: DeleteEntityImageArgs,
): Promise<DeleteEntityImageRow | null> {
  const result = await client.query({
    text: deleteEntityImageQuery,
    values: [args.id],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    cloudinaryPublicId: row[0],
  }
}

export const setPrimaryImageQuery = `-- name: SetPrimaryImage :exec
UPDATE entity_images
SET is_primary = (id = $2), updated_at = NOW()
WHERE entity_type = $1 AND entity_id = $3`

export interface SetPrimaryImageArgs {
  entityType: string
  id: number
  entityId: number
}

export async function setPrimaryImage(
  client: Client,
  args: SetPrimaryImageArgs,
): Promise<void> {
  await client.query({
    text: setPrimaryImageQuery,
    values: [args.entityType, args.id, args.entityId],
    rowMode: 'array',
  })
}

export const updateImageOrderQuery = `-- name: UpdateImageOrder :exec
UPDATE entity_images
SET display_order = $2, updated_at = NOW()
WHERE id = $1`

export interface UpdateImageOrderArgs {
  id: number
  displayOrder: number | null
}

export async function updateImageOrder(
  client: Client,
  args: UpdateImageOrderArgs,
): Promise<void> {
  await client.query({
    text: updateImageOrderQuery,
    values: [args.id, args.displayOrder],
    rowMode: 'array',
  })
}

export const countEntityImagesQuery = `-- name: CountEntityImages :one
SELECT COUNT(*) FROM entity_images
WHERE entity_type = $1 AND entity_id = $2`

export interface CountEntityImagesArgs {
  entityType: string
  entityId: number
}

export interface CountEntityImagesRow {
  count: string
}

export async function countEntityImages(
  client: Client,
  args: CountEntityImagesArgs,
): Promise<CountEntityImagesRow | null> {
  const result = await client.query({
    text: countEntityImagesQuery,
    values: [args.entityType, args.entityId],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    count: row[0],
  }
}

export const countGalleryImagesQuery = `-- name: CountGalleryImages :one
SELECT COUNT(*) FROM entity_images
WHERE entity_type = $1 AND entity_id = $2 AND is_primary = FALSE`

export interface CountGalleryImagesArgs {
  entityType: string
  entityId: number
}

export interface CountGalleryImagesRow {
  count: string
}

export async function countGalleryImages(
  client: Client,
  args: CountGalleryImagesArgs,
): Promise<CountGalleryImagesRow | null> {
  const result = await client.query({
    text: countGalleryImagesQuery,
    values: [args.entityType, args.entityId],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    count: row[0],
  }
}
