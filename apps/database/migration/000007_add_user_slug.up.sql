-- Add slug column to users table for URL-friendly identifiers

-- Add slug to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug);

-- Create unique constraint for slug (slugs must be unique across all users)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slug_unique ON users(slug) WHERE slug IS NOT NULL;

-- Backfill existing records with slugs based on their names
-- Use name if available, otherwise use a portion of the id
UPDATE users SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(name, SUBSTRING(id, 1, 8)), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || SUBSTRING(id, 1, 8) WHERE slug IS NULL;
