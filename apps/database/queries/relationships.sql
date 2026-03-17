-- name: GetCharactersForStory :many
SELECT c.* FROM characters c
JOIN story_characters sc ON c.id = sc.character_id
WHERE sc.story_id = $1
ORDER BY c.name;

-- name: GetLocationsForStory :many
SELECT l.* FROM locations l
JOIN story_locations sl ON l.id = sl.location_id
WHERE sl.story_id = $1
ORDER BY l.name;

-- name: GetTimelinesForStory :many
SELECT t.* FROM timelines t
JOIN story_timelines st ON t.id = st.timeline_id
WHERE st.story_id = $1
ORDER BY t.name;

-- name: LinkCharacterToStory :exec
INSERT INTO story_characters (story_id, character_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: UnlinkCharacterFromStory :exec
DELETE FROM story_characters
WHERE story_id = $1 AND character_id = $2;

-- name: LinkLocationToStory :exec
INSERT INTO story_locations (story_id, location_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: UnlinkLocationFromStory :exec
DELETE FROM story_locations
WHERE story_id = $1 AND location_id = $2;

-- name: LinkTimelineToStory :exec
INSERT INTO story_timelines (story_id, timeline_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: UnlinkTimelineFromStory :exec
DELETE FROM story_timelines
WHERE story_id = $1 AND timeline_id = $2;

-- name: LinkCharacterToLocation :exec
INSERT INTO character_locations (character_id, location_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: UnlinkCharacterFromLocation :exec
DELETE FROM character_locations
WHERE character_id = $1 AND location_id = $2;

-- name: GetLocationsForCharacter :many
SELECT l.id, l."userId", l.name, l.description, l.slug, l.privacy, l.created_at, l.updated_at
FROM locations l
JOIN character_locations cl ON l.id = cl.location_id
WHERE cl.character_id = $1
ORDER BY l.name;

-- name: GetCharactersForLocation :many
SELECT c.id, c."userId", c.name, c.description, c.slug, c.privacy, c.created_at, c.updated_at
FROM characters c
JOIN character_locations cl ON c.id = cl.character_id
WHERE cl.location_id = $1
ORDER BY c.name;

-- name: LinkCharacterToTimeline :exec
INSERT INTO character_timelines (character_id, timeline_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: UnlinkCharacterFromTimeline :exec
DELETE FROM character_timelines
WHERE character_id = $1 AND timeline_id = $2;

-- name: GetTimelinesForCharacter :many
SELECT t.id, t."userId", t.name, t.description, t.slug, t.privacy, t.created_at, t.updated_at
FROM timelines t
JOIN character_timelines ct ON t.id = ct.timeline_id
WHERE ct.character_id = $1
ORDER BY t.name;

-- name: GetCharactersForTimeline :many
SELECT c.id, c."userId", c.name, c.description, c.slug, c.privacy, c.created_at, c.updated_at
FROM characters c
JOIN character_timelines ct ON c.id = ct.character_id
WHERE ct.timeline_id = $1
ORDER BY c.name;

-- name: LinkLocationToTimeline :exec
INSERT INTO location_timelines (location_id, timeline_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: UnlinkLocationFromTimeline :exec
DELETE FROM location_timelines
WHERE location_id = $1 AND timeline_id = $2;

-- name: GetTimelinesForLocation :many
SELECT t.id, t."userId", t.name, t.description, t.slug, t.privacy, t.created_at, t.updated_at
FROM timelines t
JOIN location_timelines lt ON t.id = lt.timeline_id
WHERE lt.location_id = $1
ORDER BY t.name;

-- name: GetLocationsForTimeline :many
SELECT l.id, l."userId", l.name, l.description, l.slug, l.privacy, l.created_at, l.updated_at
FROM locations l
JOIN location_timelines lt ON l.id = lt.location_id
WHERE lt.timeline_id = $1
ORDER BY l.name;
