-- Migration: Create entity_images table
-- Created: 2026-02-06

CREATE TABLE entity_images (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('story', 'character', 'location', 'timeline')),
    entity_id INTEGER NOT NULL,
    cloudinary_public_id TEXT NOT NULL,
    cloudinary_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    file_name VARCHAR(255),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups by entity
CREATE INDEX idx_entity_images_lookup ON entity_images(entity_type, entity_id);

-- Index for filtering primary images
CREATE INDEX idx_entity_images_primary ON entity_images(entity_type, entity_id, is_primary);

-- Constraint: Only one primary image per entity
CREATE UNIQUE INDEX idx_entity_images_one_primary
    ON entity_images(entity_type, entity_id)
    WHERE is_primary = TRUE;

-- Add helpful comment
COMMENT ON TABLE entity_images IS 'Stores image metadata for all entity types (stories, characters, locations, timelines)';
COMMENT ON COLUMN entity_images.cloudinary_public_id IS 'Cloudinary public ID for deletion operations';
COMMENT ON COLUMN entity_images.display_order IS 'Order for gallery images (0 is first)';
