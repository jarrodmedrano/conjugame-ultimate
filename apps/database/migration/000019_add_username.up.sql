-- Add username column (user-chosen, short, clean)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30);

-- Backfill from existing slug: slugs are already unique per user so use directly,
-- just lowercase and truncate to 30 chars.
UPDATE users
SET username = SUBSTRING(LOWER(slug), 1, 30)
WHERE username IS NULL AND slug IS NOT NULL AND slug != '';

-- For any users still missing (no slug), fall back to first 8 chars of id
UPDATE users
SET username = 'user-' || SUBSTRING(id, 1, 8)
WHERE username IS NULL;

-- Unique constraint created AFTER backfill to avoid collisions during data population
-- (case-insensitive via lowercase enforcement at app layer)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique
  ON users(username)
  WHERE username IS NOT NULL;
