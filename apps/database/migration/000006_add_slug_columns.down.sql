-- Remove slug columns from entity tables

-- Drop indexes first
DROP INDEX IF EXISTS idx_stories_userid_slug;
DROP INDEX IF EXISTS idx_characters_userid_slug;
DROP INDEX IF EXISTS idx_locations_userid_slug;
DROP INDEX IF EXISTS idx_timelines_userid_slug;

DROP INDEX IF EXISTS idx_stories_slug;
DROP INDEX IF EXISTS idx_characters_slug;
DROP INDEX IF EXISTS idx_locations_slug;
DROP INDEX IF EXISTS idx_timelines_slug;

-- Drop columns
ALTER TABLE stories DROP COLUMN IF EXISTS slug;
ALTER TABLE characters DROP COLUMN IF EXISTS slug;
ALTER TABLE locations DROP COLUMN IF EXISTS slug;
ALTER TABLE timelines DROP COLUMN IF EXISTS slug;
