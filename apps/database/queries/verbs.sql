-- Verbs

-- name: CreateVerb :one
INSERT INTO verbs (name, language, infinitive)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetVerb :one
SELECT * FROM verbs WHERE id = $1 LIMIT 1;

-- name: ListVerbsByLanguage :many
SELECT * FROM verbs WHERE language = $1 ORDER BY name ASC LIMIT $2 OFFSET $3;

-- name: ListAllVerbs :many
SELECT * FROM verbs ORDER BY language, name ASC LIMIT $1 OFFSET $2;

-- name: UpdateVerb :one
UPDATE verbs SET
  name = COALESCE($2, name),
  language = COALESCE($3, language),
  infinitive = COALESCE($4, infinitive),
  updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteVerb :exec
DELETE FROM verbs WHERE id = $1;
