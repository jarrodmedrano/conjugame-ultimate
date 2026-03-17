-- Better Auth Core Schema

-- User Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN DEFAULT FALSE,
    image TEXT,
    slug VARCHAR(255),
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Additional fields
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    locale TEXT DEFAULT 'en',
    "isTwoFactorEnabled" BOOLEAN DEFAULT FALSE
);

-- Session Table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Account Table
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ,
    "refreshTokenExpiresAt" TIMESTAMPTZ,
    scope TEXT,
    "idToken" TEXT,
    password TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Verification Table
CREATE TABLE verifications (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_sessions_userId ON sessions("userId");
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_accounts_userId ON accounts("userId");
CREATE INDEX idx_verifications_identifier ON verifications(identifier);

-- Custom Application Tables

CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255),
    privacy VARCHAR(10) DEFAULT 'private' NOT NULL CHECK (privacy IN ('public', 'private')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255),
    privacy VARCHAR(10) DEFAULT 'private' NOT NULL CHECK (privacy IN ('public', 'private')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_stories_userId ON stories("userId");
CREATE INDEX idx_characters_userId ON characters("userId");

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255),
    privacy VARCHAR(10) DEFAULT 'private' NOT NULL CHECK (privacy IN ('public', 'private')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_locations_userId ON locations("userId");

CREATE TABLE timelines (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255),
    privacy VARCHAR(10) DEFAULT 'private' NOT NULL CHECK (privacy IN ('public', 'private')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_timelines_userId ON timelines("userId");

-- Relationship Tables

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
