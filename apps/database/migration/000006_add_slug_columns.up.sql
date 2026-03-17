-- Add slug columns to entity tables for URL-friendly identifiers

-- Add slug to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Add slug to characters table
ALTER TABLE characters ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Add slug to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Add slug to timelines table
ALTER TABLE timelines ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create indexes for slug lookups
CREATE INDEX IF NOT EXISTS idx_stories_slug ON stories(slug);
CREATE INDEX IF NOT EXISTS idx_characters_slug ON characters(slug);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);
CREATE INDEX IF NOT EXISTS idx_timelines_slug ON timelines(slug);

-- Create unique constraint for slug + userId combination (slugs are unique per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_userid_slug ON stories("userId", slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_userid_slug ON characters("userId", slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_userid_slug ON locations("userId", slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_timelines_userid_slug ON timelines("userId", slug) WHERE slug IS NOT NULL;

-- Backfill existing records with slugs based on their names/titles
UPDATE stories SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || id WHERE slug IS NULL;
UPDATE characters SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || id WHERE slug IS NULL;
UPDATE locations SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || id WHERE slug IS NULL;
UPDATE timelines SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || id WHERE slug IS NULL;
