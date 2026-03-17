CREATE TABLE character_attributes (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(character_id, key)
);

CREATE INDEX idx_character_attributes_character_id ON character_attributes(character_id);

COMMENT ON TABLE character_attributes IS 'Key-value attributes for characters (predefined and custom)';
COMMENT ON COLUMN character_attributes.key IS 'Attribute key, e.g. date_of_birth, hair_color, or any custom string';
COMMENT ON COLUMN character_attributes.display_order IS 'Order for display (0 = first); predefined attrs get low values';
