-- Add privacy column to all entity tables
ALTER TABLE stories ADD COLUMN privacy VARCHAR(10) DEFAULT 'private' NOT NULL;
ALTER TABLE characters ADD COLUMN privacy VARCHAR(10) DEFAULT 'private' NOT NULL;
ALTER TABLE locations ADD COLUMN privacy VARCHAR(10) DEFAULT 'private' NOT NULL;
ALTER TABLE timelines ADD COLUMN privacy VARCHAR(10) DEFAULT 'private' NOT NULL;

-- Add indexes for filtering by privacy
CREATE INDEX idx_stories_privacy ON stories(privacy);
CREATE INDEX idx_characters_privacy ON characters(privacy);
CREATE INDEX idx_locations_privacy ON locations(privacy);
CREATE INDEX idx_timelines_privacy ON timelines(privacy);

-- Add constraints to ensure valid values
ALTER TABLE stories ADD CONSTRAINT check_stories_privacy
  CHECK (privacy IN ('public', 'private'));
ALTER TABLE characters ADD CONSTRAINT check_characters_privacy
  CHECK (privacy IN ('public', 'private'));
ALTER TABLE locations ADD CONSTRAINT check_locations_privacy
  CHECK (privacy IN ('public', 'private'));
ALTER TABLE timelines ADD CONSTRAINT check_timelines_privacy
  CHECK (privacy IN ('public', 'private'));
