import { QueryArrayConfig, QueryArrayResult } from 'pg'

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>
}

export const getCharactersForStoryQuery = `-- name: GetCharactersForStory :many
SELECT
  c.id,
  c."userId",
  c.name,
  c.description,
  c.slug,
  c.privacy,
  c.created_at,
  c.updated_at,
  i.cloudinary_url as primary_image_url
FROM characters c
JOIN story_characters sc ON c.id = sc.character_id
LEFT JOIN entity_images i ON i.entity_id = c.id
  AND i.entity_type = 'character'
  AND i.is_primary = true
WHERE sc.story_id = $1
ORDER BY c.name`

export interface GetCharactersForStoryArgs {
  storyId: number
}

export interface GetCharactersForStoryRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
  primaryImageUrl: string | null
}

export async function getCharactersForStory(
  client: Client,
  args: GetCharactersForStoryArgs,
): Promise<GetCharactersForStoryRow[]> {
  const result = await client.query({
    text: getCharactersForStoryQuery,
    values: [args.storyId],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
      primaryImageUrl: row[8],
    }
  })
}

export const getLocationsForStoryQuery = `-- name: GetLocationsForStory :many
SELECT
  l.id,
  l."userId",
  l.name,
  l.description,
  l.slug,
  l.privacy,
  l.created_at,
  l.updated_at,
  i.cloudinary_url as primary_image_url
FROM locations l
JOIN story_locations sl ON l.id = sl.location_id
LEFT JOIN entity_images i ON i.entity_id = l.id
  AND i.entity_type = 'location'
  AND i.is_primary = true
WHERE sl.story_id = $1
ORDER BY l.name`

export interface GetLocationsForStoryArgs {
  storyId: number
}

export interface GetLocationsForStoryRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
  primaryImageUrl: string | null
}

export async function getLocationsForStory(
  client: Client,
  args: GetLocationsForStoryArgs,
): Promise<GetLocationsForStoryRow[]> {
  const result = await client.query({
    text: getLocationsForStoryQuery,
    values: [args.storyId],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
      primaryImageUrl: row[8],
    }
  })
}

export const getTimelinesForStoryQuery = `-- name: GetTimelinesForStory :many
SELECT
  t.id,
  t."userId",
  t.name,
  t.description,
  t.slug,
  t.privacy,
  t.created_at,
  t.updated_at,
  i.cloudinary_url as primary_image_url
FROM timelines t
JOIN story_timelines st ON t.id = st.timeline_id
LEFT JOIN entity_images i ON i.entity_id = t.id
  AND i.entity_type = 'timeline'
  AND i.is_primary = true
WHERE st.story_id = $1
ORDER BY t.name`

export interface GetTimelinesForStoryArgs {
  storyId: number
}

export interface GetTimelinesForStoryRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
  primaryImageUrl: string | null
}

export async function getTimelinesForStory(
  client: Client,
  args: GetTimelinesForStoryArgs,
): Promise<GetTimelinesForStoryRow[]> {
  const result = await client.query({
    text: getTimelinesForStoryQuery,
    values: [args.storyId],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
      primaryImageUrl: row[8],
    }
  })
}

export const getStoriesForCharacterQuery = `-- name: GetStoriesForCharacter :many
SELECT
  s.id,
  s."userId",
  s.title,
  s.content,
  s.privacy,
  s.slug,
  s.created_at,
  s.updated_at,
  i.cloudinary_url as primary_image_url
FROM stories s
JOIN story_characters sc ON s.id = sc.story_id
LEFT JOIN entity_images i ON i.entity_id = s.id
  AND i.entity_type = 'story'
  AND i.is_primary = true
WHERE sc.character_id = $1
ORDER BY s.title`

export interface GetStoriesForCharacterArgs {
  characterId: number
}

export interface GetStoriesForCharacterRow {
  id: number
  userid: string
  title: string
  content: string | null
  privacy: string
  slug: string | null
  createdAt: Date | null
  updatedAt: Date | null
  primaryImageUrl: string | null
}

export async function getStoriesForCharacter(
  client: Client,
  args: GetStoriesForCharacterArgs,
): Promise<GetStoriesForCharacterRow[]> {
  const result = await client.query({
    text: getStoriesForCharacterQuery,
    values: [args.characterId],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      title: row[2],
      content: row[3],
      privacy: row[4],
      slug: row[5],
      createdAt: row[6],
      updatedAt: row[7],
      primaryImageUrl: row[8],
    }
  })
}

export const linkCharacterToStoryQuery = `-- name: LinkCharacterToStory :exec
INSERT INTO story_characters (story_id, character_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING`

export interface LinkCharacterToStoryArgs {
  storyId: number
  characterId: number
}

export async function linkCharacterToStory(
  client: Client,
  args: LinkCharacterToStoryArgs,
): Promise<void> {
  await client.query({
    text: linkCharacterToStoryQuery,
    values: [args.storyId, args.characterId],
    rowMode: 'array',
  })
}

export const unlinkCharacterFromStoryQuery = `-- name: UnlinkCharacterFromStory :exec
DELETE FROM story_characters
WHERE story_id = $1 AND character_id = $2`

export interface UnlinkCharacterFromStoryArgs {
  storyId: number
  characterId: number
}

export async function unlinkCharacterFromStory(
  client: Client,
  args: UnlinkCharacterFromStoryArgs,
): Promise<void> {
  await client.query({
    text: unlinkCharacterFromStoryQuery,
    values: [args.storyId, args.characterId],
    rowMode: 'array',
  })
}

export const linkLocationToStoryQuery = `-- name: LinkLocationToStory :exec
INSERT INTO story_locations (story_id, location_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING`

export interface LinkLocationToStoryArgs {
  storyId: number
  locationId: number
}

export async function linkLocationToStory(
  client: Client,
  args: LinkLocationToStoryArgs,
): Promise<void> {
  await client.query({
    text: linkLocationToStoryQuery,
    values: [args.storyId, args.locationId],
    rowMode: 'array',
  })
}

export const unlinkLocationFromStoryQuery = `-- name: UnlinkLocationFromStory :exec
DELETE FROM story_locations
WHERE story_id = $1 AND location_id = $2`

export interface UnlinkLocationFromStoryArgs {
  storyId: number
  locationId: number
}

export async function unlinkLocationFromStory(
  client: Client,
  args: UnlinkLocationFromStoryArgs,
): Promise<void> {
  await client.query({
    text: unlinkLocationFromStoryQuery,
    values: [args.storyId, args.locationId],
    rowMode: 'array',
  })
}

export const linkTimelineToStoryQuery = `-- name: LinkTimelineToStory :exec
INSERT INTO story_timelines (story_id, timeline_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING`

export interface LinkTimelineToStoryArgs {
  storyId: number
  timelineId: number
}

export async function linkTimelineToStory(
  client: Client,
  args: LinkTimelineToStoryArgs,
): Promise<void> {
  await client.query({
    text: linkTimelineToStoryQuery,
    values: [args.storyId, args.timelineId],
    rowMode: 'array',
  })
}

export const unlinkTimelineFromStoryQuery = `-- name: UnlinkTimelineFromStory :exec
DELETE FROM story_timelines
WHERE story_id = $1 AND timeline_id = $2`

export interface UnlinkTimelineFromStoryArgs {
  storyId: number
  timelineId: number
}

export async function unlinkTimelineFromStory(
  client: Client,
  args: UnlinkTimelineFromStoryArgs,
): Promise<void> {
  await client.query({
    text: unlinkTimelineFromStoryQuery,
    values: [args.storyId, args.timelineId],
    rowMode: 'array',
  })
}

export const linkCharacterToLocationQuery = `-- name: LinkCharacterToLocation :exec
INSERT INTO character_locations (character_id, location_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING`

export interface LinkCharacterToLocationArgs {
  characterId: number
  locationId: number
}

export async function linkCharacterToLocation(
  client: Client,
  args: LinkCharacterToLocationArgs,
): Promise<void> {
  await client.query({
    text: linkCharacterToLocationQuery,
    values: [args.characterId, args.locationId],
    rowMode: 'array',
  })
}

export const unlinkCharacterFromLocationQuery = `-- name: UnlinkCharacterFromLocation :exec
DELETE FROM character_locations
WHERE character_id = $1 AND location_id = $2`

export interface UnlinkCharacterFromLocationArgs {
  characterId: number
  locationId: number
}

export async function unlinkCharacterFromLocation(
  client: Client,
  args: UnlinkCharacterFromLocationArgs,
): Promise<void> {
  await client.query({
    text: unlinkCharacterFromLocationQuery,
    values: [args.characterId, args.locationId],
    rowMode: 'array',
  })
}

export const getLocationsForCharacterQuery = `-- name: GetLocationsForCharacter :many
SELECT
  l.id,
  l."userId",
  l.name,
  l.description,
  l.slug,
  l.privacy,
  l.created_at,
  l.updated_at,
  i.cloudinary_url as primary_image_url
FROM locations l
JOIN character_locations cl ON l.id = cl.location_id
LEFT JOIN entity_images i ON i.entity_id = l.id
  AND i.entity_type = 'location'
  AND i.is_primary = true
WHERE cl.character_id = $1
ORDER BY l.name`

export interface GetLocationsForCharacterArgs {
  characterId: number
}

export interface GetLocationsForCharacterRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
  primaryImageUrl: string | null
}

export async function getLocationsForCharacter(
  client: Client,
  args: GetLocationsForCharacterArgs,
): Promise<GetLocationsForCharacterRow[]> {
  const result = await client.query({
    text: getLocationsForCharacterQuery,
    values: [args.characterId],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
      primaryImageUrl: row[8],
    }
  })
}

export const getCharactersForLocationQuery = `-- name: GetCharactersForLocation :many
SELECT
  c.id,
  c."userId",
  c.name,
  c.description,
  c.slug,
  c.privacy,
  c.created_at,
  c.updated_at,
  i.cloudinary_url as primary_image_url
FROM characters c
JOIN character_locations cl ON c.id = cl.character_id
LEFT JOIN entity_images i ON i.entity_id = c.id
  AND i.entity_type = 'character'
  AND i.is_primary = true
WHERE cl.location_id = $1
ORDER BY c.name`

export interface GetCharactersForLocationArgs {
  locationId: number
}

export interface GetCharactersForLocationRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
  primaryImageUrl: string | null
}

export async function getCharactersForLocation(
  client: Client,
  args: GetCharactersForLocationArgs,
): Promise<GetCharactersForLocationRow[]> {
  const result = await client.query({
    text: getCharactersForLocationQuery,
    values: [args.locationId],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
      primaryImageUrl: row[8],
    }
  })
}

export const linkCharacterToTimelineQuery = `-- name: LinkCharacterToTimeline :exec
INSERT INTO character_timelines (character_id, timeline_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING`

export interface LinkCharacterToTimelineArgs {
  characterId: number
  timelineId: number
}

export async function linkCharacterToTimeline(
  client: Client,
  args: LinkCharacterToTimelineArgs,
): Promise<void> {
  await client.query({
    text: linkCharacterToTimelineQuery,
    values: [args.characterId, args.timelineId],
    rowMode: 'array',
  })
}

export const unlinkCharacterFromTimelineQuery = `-- name: UnlinkCharacterFromTimeline :exec
DELETE FROM character_timelines
WHERE character_id = $1 AND timeline_id = $2`

export interface UnlinkCharacterFromTimelineArgs {
  characterId: number
  timelineId: number
}

export async function unlinkCharacterFromTimeline(
  client: Client,
  args: UnlinkCharacterFromTimelineArgs,
): Promise<void> {
  await client.query({
    text: unlinkCharacterFromTimelineQuery,
    values: [args.characterId, args.timelineId],
    rowMode: 'array',
  })
}

export const getTimelinesForCharacterQuery = `-- name: GetTimelinesForCharacter :many
SELECT
  t.id,
  t."userId",
  t.name,
  t.description,
  t.slug,
  t.privacy,
  t.created_at,
  t.updated_at,
  i.cloudinary_url as primary_image_url
FROM timelines t
JOIN character_timelines ct ON t.id = ct.timeline_id
LEFT JOIN entity_images i ON i.entity_id = t.id
  AND i.entity_type = 'timeline'
  AND i.is_primary = true
WHERE ct.character_id = $1
ORDER BY t.name`

export interface GetTimelinesForCharacterArgs {
  characterId: number
}

export interface GetTimelinesForCharacterRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
  primaryImageUrl: string | null
}

export async function getTimelinesForCharacter(
  client: Client,
  args: GetTimelinesForCharacterArgs,
): Promise<GetTimelinesForCharacterRow[]> {
  const result = await client.query({
    text: getTimelinesForCharacterQuery,
    values: [args.characterId],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
      primaryImageUrl: row[8],
    }
  })
}

export const getCharactersForTimelineQuery = `-- name: GetCharactersForTimeline :many
SELECT
  c.id,
  c."userId",
  c.name,
  c.description,
  c.slug,
  c.privacy,
  c.created_at,
  c.updated_at,
  i.cloudinary_url as primary_image_url
FROM characters c
JOIN character_timelines ct ON c.id = ct.character_id
LEFT JOIN entity_images i ON i.entity_id = c.id
  AND i.entity_type = 'character'
  AND i.is_primary = true
WHERE ct.timeline_id = $1
ORDER BY c.name`

export interface GetCharactersForTimelineArgs {
  timelineId: number
}

export interface GetCharactersForTimelineRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
  primaryImageUrl: string | null
}

export async function getCharactersForTimeline(
  client: Client,
  args: GetCharactersForTimelineArgs,
): Promise<GetCharactersForTimelineRow[]> {
  const result = await client.query({
    text: getCharactersForTimelineQuery,
    values: [args.timelineId],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
      primaryImageUrl: row[8],
    }
  })
}

export const linkLocationToTimelineQuery = `-- name: LinkLocationToTimeline :exec
INSERT INTO location_timelines (location_id, timeline_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING`

export interface LinkLocationToTimelineArgs {
  locationId: number
  timelineId: number
}

export async function linkLocationToTimeline(
  client: Client,
  args: LinkLocationToTimelineArgs,
): Promise<void> {
  await client.query({
    text: linkLocationToTimelineQuery,
    values: [args.locationId, args.timelineId],
    rowMode: 'array',
  })
}

export const unlinkLocationFromTimelineQuery = `-- name: UnlinkLocationFromTimeline :exec
DELETE FROM location_timelines
WHERE location_id = $1 AND timeline_id = $2`

export interface UnlinkLocationFromTimelineArgs {
  locationId: number
  timelineId: number
}

export async function unlinkLocationFromTimeline(
  client: Client,
  args: UnlinkLocationFromTimelineArgs,
): Promise<void> {
  await client.query({
    text: unlinkLocationFromTimelineQuery,
    values: [args.locationId, args.timelineId],
    rowMode: 'array',
  })
}

export const getTimelinesForLocationQuery = `-- name: GetTimelinesForLocation :many
SELECT
  t.id,
  t."userId",
  t.name,
  t.description,
  t.slug,
  t.privacy,
  t.created_at,
  t.updated_at,
  i.cloudinary_url as primary_image_url
FROM timelines t
JOIN location_timelines lt ON t.id = lt.timeline_id
LEFT JOIN entity_images i ON i.entity_id = t.id
  AND i.entity_type = 'timeline'
  AND i.is_primary = true
WHERE lt.location_id = $1
ORDER BY t.name`

export interface GetTimelinesForLocationArgs {
  locationId: number
}

export interface GetTimelinesForLocationRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
  primaryImageUrl: string | null
}

export async function getTimelinesForLocation(
  client: Client,
  args: GetTimelinesForLocationArgs,
): Promise<GetTimelinesForLocationRow[]> {
  const result = await client.query({
    text: getTimelinesForLocationQuery,
    values: [args.locationId],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
      primaryImageUrl: row[8],
    }
  })
}

export const getLocationsForTimelineQuery = `-- name: GetLocationsForTimeline :many
SELECT
  l.id,
  l."userId",
  l.name,
  l.description,
  l.slug,
  l.privacy,
  l.created_at,
  l.updated_at,
  i.cloudinary_url as primary_image_url
FROM locations l
JOIN location_timelines lt ON l.id = lt.location_id
LEFT JOIN entity_images i ON i.entity_id = l.id
  AND i.entity_type = 'location'
  AND i.is_primary = true
WHERE lt.timeline_id = $1
ORDER BY l.name`

export interface GetLocationsForTimelineArgs {
  timelineId: number
}

export interface GetLocationsForTimelineRow {
  id: number
  userid: string
  name: string
  description: string | null
  slug: string | null
  privacy: string
  createdAt: Date | null
  updatedAt: Date | null
  primaryImageUrl: string | null
}

export async function getLocationsForTimeline(
  client: Client,
  args: GetLocationsForTimelineArgs,
): Promise<GetLocationsForTimelineRow[]> {
  const result = await client.query({
    text: getLocationsForTimelineQuery,
    values: [args.timelineId],
    rowMode: 'array',
  })
  return result.rows.map((row) => {
    return {
      id: row[0],
      userid: row[1],
      name: row[2],
      description: row[3],
      slug: row[4],
      privacy: row[5],
      createdAt: row[6],
      updatedAt: row[7],
      primaryImageUrl: row[8],
    }
  })
}
