-- Users (Better Auth Schema)
-- name: CreateUser :one
INSERT INTO users (id, name, email, "emailVerified", image, slug, "createdAt", "updatedAt", role, locale, "isTwoFactorEnabled")
VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8, $9)
RETURNING *;

-- name: GetUser :one
SELECT * FROM users WHERE id = $1 LIMIT 1;

-- name: GetUserBySlug :one
SELECT * FROM users WHERE slug = $1 LIMIT 1;

-- name: GetUserByUsername :one
SELECT * FROM users WHERE username = $1 LIMIT 1;

-- name: CheckUsernameExists :one
SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) AS exists;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 LIMIT 1;

-- name: GetUsersByRole :many
SELECT * FROM users WHERE "role" = $1 ORDER BY id LIMIT $2 OFFSET $3;

-- name: GetUserForUpdate :one
SELECT * FROM users WHERE id = $1 LIMIT 1 FOR NO KEY UPDATE;

-- name: ListUsers :many
SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2;

-- name: UpdateUser :one
UPDATE users SET
  name = COALESCE($2, name),
  email = COALESCE($3, email),
  "emailVerified" = COALESCE($4, "emailVerified"),
  image = COALESCE($5, image),
  slug = COALESCE($6, slug),
  "role" = COALESCE($7, "role"),
  "isTwoFactorEnabled" = COALESCE($8, "isTwoFactorEnabled"),
  "locale" = COALESCE($9, 'en'),
  username = COALESCE($10, username),
  "updatedAt" = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateUserLocale :exec
UPDATE users
SET "locale" = COALESCE($2, 'en'),
    "updatedAt" = NOW()
WHERE id = $1;

-- name: UpdateUserEmail :one
UPDATE users SET 
  email = $2, 
  "emailVerified" = FALSE, -- reset emailVerified when changing email
  "updatedAt" = NOW()
WHERE id = $1 
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

-- Sessions (Better Auth Schema)
-- name: CreateSession :one
INSERT INTO sessions (id, "userId", token, "expiresAt", "ipAddress", "userAgent", "createdAt", "updatedAt")
VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
RETURNING *;

-- name: GetSession :one
SELECT * FROM sessions WHERE token = $1 LIMIT 1;

-- name: GetSessionById :one
SELECT * FROM sessions WHERE id = $1 LIMIT 1;

-- name: ListSessionsForUser :many
SELECT * FROM sessions WHERE "userId" = $1 ORDER BY "expiresAt" DESC LIMIT $2 OFFSET $3;

-- name: UpdateSession :one
UPDATE sessions SET 
  "expiresAt" = COALESCE($2, "expiresAt"),
  "ipAddress" = COALESCE($3, "ipAddress"),
  "userAgent" = COALESCE($4, "userAgent"),
  "updatedAt" = NOW()
WHERE id = $1 
RETURNING *;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE token = $1;

-- name: DeleteSessionById :exec
DELETE FROM sessions WHERE id = $1;

-- Accounts (Better Auth Schema)
-- name: CreateAccount :one
INSERT INTO accounts (id, "userId", "accountId", "providerId", "accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "idToken", scope, password, "createdAt", "updatedAt")
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
RETURNING *;

-- name: GetAccount :one
SELECT * FROM accounts WHERE id = $1 LIMIT 1;

-- name: GetAccountByProvider :one
SELECT * FROM accounts WHERE "userId" = $1 AND "providerId" = $2 LIMIT 1;

-- name: ListAccountsForUser :many
SELECT * FROM accounts WHERE "userId" = $1 ORDER BY id LIMIT $2 OFFSET $3;

-- name: UpdateAccount :one
UPDATE accounts SET 
  "accessToken" = COALESCE($2, "accessToken"),
  "refreshToken" = COALESCE($3, "refreshToken"),
  "accessTokenExpiresAt" = COALESCE($4, "accessTokenExpiresAt"),
  "refreshTokenExpiresAt" = COALESCE($5, "refreshTokenExpiresAt"),
  "idToken" = COALESCE($6, "idToken"),
  scope = COALESCE($7, scope),
  password = COALESCE($8, password),
  "updatedAt" = NOW()
WHERE id = $1 
RETURNING *;

-- name: DeleteAccount :exec
DELETE FROM accounts WHERE id = $1;

-- Verification (Better Auth Schema)
-- name: CreateVerification :one
INSERT INTO verifications (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
VALUES ($1, $2, $3, $4, NOW(), NOW())
RETURNING *;

-- name: GetVerification :one
SELECT * FROM verifications WHERE identifier = $1 AND value = $2 LIMIT 1;

-- name: GetVerificationByValue :one
SELECT * FROM verifications WHERE value = $1 LIMIT 1;

-- name: GetVerificationById :one
SELECT * FROM verifications WHERE id = $1 LIMIT 1;

-- name: DeleteVerification :exec
DELETE FROM verifications WHERE id = $1;

-- name: DeleteExpiredVerifications :exec
DELETE FROM verifications WHERE "expiresAt" < NOW();

-- Stories
-- name: CreateStory :one
INSERT INTO stories ("userId", title, content, privacy, slug)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetStory :one
SELECT * FROM stories WHERE id = $1 LIMIT 1;

-- name: GetStoryBySlug :one
SELECT * FROM stories WHERE "userId" = $1 AND slug = $2 LIMIT 1;

-- name: CheckStorySlugExists :one
SELECT EXISTS(SELECT 1 FROM stories WHERE "userId" = $1 AND slug = $2) AS exists;

-- name: ListStoriesForUser :many
SELECT * FROM stories WHERE "userId" = $1 ORDER BY id LIMIT $2 OFFSET $3;

-- name: ListStoriesForUserWithPrivacy :many
SELECT * FROM stories
WHERE "userId" = sqlc.arg(owner_id)
  AND (privacy = 'public' OR sqlc.arg(is_owner)::boolean = true)
ORDER BY created_at DESC;

-- name: UpdateStory :one
UPDATE stories SET title = $2, content = $3, updated_at = NOW()
WHERE id = $1 RETURNING *;

-- name: UpdateStoryPrivacy :one
UPDATE stories
SET privacy = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteStory :exec
DELETE FROM stories WHERE id = $1;

-- Characters
-- name: CreateCharacter :one
INSERT INTO characters ("userId", name, description, privacy, slug)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetCharacter :one
SELECT * FROM characters WHERE id = $1 LIMIT 1;

-- name: GetCharacterBySlug :one
SELECT * FROM characters WHERE "userId" = $1 AND slug = $2 LIMIT 1;

-- name: CheckCharacterSlugExists :one
SELECT EXISTS(SELECT 1 FROM characters WHERE "userId" = $1 AND slug = $2) AS exists;

-- name: ListCharactersForUser :many
SELECT * FROM characters WHERE "userId" = $1 ORDER BY id LIMIT $2 OFFSET $3;

-- name: ListCharactersForUserWithPrivacy :many
SELECT * FROM characters
WHERE "userId" = sqlc.arg(owner_id)
  AND (privacy = 'public' OR sqlc.arg(is_owner)::boolean = true)
ORDER BY created_at DESC;

-- name: UpdateCharacter :one
UPDATE characters SET name = $2, description = $3, updated_at = NOW()
WHERE id = $1 RETURNING *;

-- name: UpdateCharacterPrivacy :one
UPDATE characters
SET privacy = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteCharacter :exec
DELETE FROM characters WHERE id = $1;

-- Locations
-- name: CreateLocation :one
INSERT INTO locations ("userId", name, description, privacy, slug)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetLocation :one
SELECT * FROM locations WHERE id = $1 LIMIT 1;

-- name: GetLocationBySlug :one
SELECT * FROM locations WHERE "userId" = $1 AND slug = $2 LIMIT 1;

-- name: CheckLocationSlugExists :one
SELECT EXISTS(SELECT 1 FROM locations WHERE "userId" = $1 AND slug = $2) AS exists;

-- name: ListLocationsForUser :many
SELECT * FROM locations WHERE "userId" = $1 ORDER BY id LIMIT $2 OFFSET $3;

-- name: ListLocationsForUserWithPrivacy :many
SELECT * FROM locations
WHERE "userId" = sqlc.arg(owner_id)
  AND (privacy = 'public' OR sqlc.arg(is_owner)::boolean = true)
ORDER BY created_at DESC;

-- name: UpdateLocation :one
UPDATE locations SET name = $2, description = $3, updated_at = NOW()
WHERE id = $1 RETURNING *;

-- name: UpdateLocationPrivacy :one
UPDATE locations
SET privacy = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteLocation :exec
DELETE FROM locations WHERE id = $1;


-- Timelines
-- name: CreateTimeline :one
INSERT INTO timelines ("userId", name, description, privacy, slug)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetTimeline :one
SELECT * FROM timelines WHERE id = $1 LIMIT 1;

-- name: GetTimelineBySlug :one
SELECT * FROM timelines WHERE "userId" = $1 AND slug = $2 LIMIT 1;

-- name: CheckTimelineSlugExists :one
SELECT EXISTS(SELECT 1 FROM timelines WHERE "userId" = $1 AND slug = $2) AS exists;

-- name: ListTimelinesForUser :many
SELECT * FROM timelines WHERE "userId" = $1 ORDER BY id LIMIT $2 OFFSET $3;

-- name: ListTimelinesForUserWithPrivacy :many
SELECT * FROM timelines
WHERE "userId" = sqlc.arg(owner_id)
  AND (privacy = 'public' OR sqlc.arg(is_owner)::boolean = true)
ORDER BY created_at DESC;

-- name: UpdateTimeline :one
UPDATE timelines SET name = $2, description = $3, updated_at = NOW()
WHERE id = $1 RETURNING *;

-- name: UpdateTimelinePrivacy :one
UPDATE timelines
SET privacy = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteTimeline :exec
DELETE FROM timelines WHERE id = $1;