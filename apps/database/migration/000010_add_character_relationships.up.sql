CREATE TABLE character_relationships (
  id SERIAL PRIMARY KEY,
  character_id_a INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  character_id_b INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL,
  custom_label VARCHAR(100),
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id_a, character_id_b, relationship_type),
  CHECK (character_id_a != character_id_b)
);

CREATE INDEX idx_char_rel_a ON character_relationships(character_id_a);
CREATE INDEX idx_char_rel_b ON character_relationships(character_id_b);
CREATE INDEX idx_char_rel_created_by ON character_relationships(created_by);
