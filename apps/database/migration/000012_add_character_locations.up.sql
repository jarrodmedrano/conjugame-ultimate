CREATE TABLE character_locations (
  id SERIAL PRIMARY KEY,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, location_id)
);

CREATE INDEX idx_character_locations_character_id ON character_locations(character_id);
CREATE INDEX idx_character_locations_location_id ON character_locations(location_id);
