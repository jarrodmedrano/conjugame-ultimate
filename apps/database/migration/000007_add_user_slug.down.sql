-- Remove slug column from users table

-- Drop indexes first
DROP INDEX IF EXISTS idx_users_slug_unique;
DROP INDEX IF EXISTS idx_users_slug;

-- Drop column
ALTER TABLE users DROP COLUMN IF EXISTS slug;
