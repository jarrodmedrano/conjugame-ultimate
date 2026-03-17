CREATE TABLE character_timelines (
  id SERIAL PRIMARY KEY,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  timeline_id INTEGER NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, timeline_id)
);

CREATE INDEX idx_character_timelines_character_id ON character_timelines(character_id);
CREATE INDEX idx_character_timelines_timeline_id ON character_timelines(timeline_id);
