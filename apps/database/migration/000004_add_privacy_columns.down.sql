-- Remove constraints
ALTER TABLE stories DROP CONSTRAINT IF EXISTS check_stories_privacy;
ALTER TABLE characters DROP CONSTRAINT IF EXISTS check_characters_privacy;
ALTER TABLE locations DROP CONSTRAINT IF EXISTS check_locations_privacy;
ALTER TABLE timelines DROP CONSTRAINT IF EXISTS check_timelines_privacy;

-- Drop indexes
DROP INDEX IF EXISTS idx_stories_privacy;
DROP INDEX IF EXISTS idx_characters_privacy;
DROP INDEX IF EXISTS idx_locations_privacy;
DROP INDEX IF EXISTS idx_timelines_privacy;

-- Drop columns
ALTER TABLE stories DROP COLUMN IF EXISTS privacy;
ALTER TABLE characters DROP COLUMN IF EXISTS privacy;
ALTER TABLE locations DROP COLUMN IF EXISTS privacy;
ALTER TABLE timelines DROP COLUMN IF EXISTS privacy;
