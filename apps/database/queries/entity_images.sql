-- Entity Images

-- name: GetEntityImages :many
SELECT * FROM entity_images
WHERE entity_type = $1 AND entity_id = $2
ORDER BY is_primary DESC, display_order ASC;

-- name: GetPrimaryImage :one
SELECT * FROM entity_images
WHERE entity_type = $1 AND entity_id = $2 AND is_primary = TRUE
LIMIT 1;

-- name: GetGalleryImages :many
SELECT * FROM entity_images
WHERE entity_type = $1 AND entity_id = $2 AND is_primary = FALSE
ORDER BY display_order ASC;

-- name: CreateEntityImage :one
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
RETURNING *;

-- name: DeleteEntityImage :one
DELETE FROM entity_images
WHERE id = $1
RETURNING cloudinary_public_id;

-- name: SetPrimaryImage :exec
UPDATE entity_images
SET is_primary = (id = $2), updated_at = NOW()
WHERE entity_type = $1 AND entity_id = $3;

-- name: UpdateImageOrder :exec
UPDATE entity_images
SET display_order = $2, updated_at = NOW()
WHERE id = $1;

-- name: CountEntityImages :one
SELECT COUNT(*) FROM entity_images
WHERE entity_type = $1 AND entity_id = $2;

-- name: CountGalleryImages :one
SELECT COUNT(*) FROM entity_images
WHERE entity_type = $1 AND entity_id = $2 AND is_primary = FALSE;
