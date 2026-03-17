CREATE TABLE location_attributes (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(location_id, key)
);

CREATE INDEX idx_location_attributes_location_id ON location_attributes(location_id);

COMMENT ON TABLE location_attributes IS 'Key-value attributes for locations (predefined and custom)';
COMMENT ON COLUMN location_attributes.key IS 'Attribute key, e.g. type, climate, or any custom string';
COMMENT ON COLUMN location_attributes.display_order IS 'Order for display (0 = first); predefined attrs get low values';
