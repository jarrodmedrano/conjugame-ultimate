-- Story-Character relationships
CREATE TABLE story_characters (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, character_id)
);

CREATE INDEX idx_story_characters_story_id ON story_characters(story_id);
CREATE INDEX idx_story_characters_character_id ON story_characters(character_id);

-- Story-Location relationships
CREATE TABLE story_locations (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, location_id)
);

CREATE INDEX idx_story_locations_story_id ON story_locations(story_id);
CREATE INDEX idx_story_locations_location_id ON story_locations(location_id);

-- Story-Timeline relationships
CREATE TABLE story_timelines (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  timeline_id INTEGER NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, timeline_id)
);

CREATE INDEX idx_story_timelines_story_id ON story_timelines(story_id);
CREATE INDEX idx_story_timelines_timeline_id ON story_timelines(timeline_id);
