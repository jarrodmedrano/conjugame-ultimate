CREATE TABLE story_attributes (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, key)
);

CREATE INDEX idx_story_attributes_story_id ON story_attributes(story_id);

COMMENT ON TABLE story_attributes IS 'Key-value attributes for stories (predefined and custom)';
COMMENT ON COLUMN story_attributes.key IS 'Attribute key, e.g. genre, status, or any custom string';
COMMENT ON COLUMN story_attributes.display_order IS 'Order for display (0 = first); predefined attrs get low values';
