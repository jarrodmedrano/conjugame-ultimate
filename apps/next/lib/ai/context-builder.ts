// apps/next/lib/ai/context-builder.ts
import type { PoolClient } from 'pg'
import type { StoryContext } from './types'

export async function buildStoryContext(
  client: PoolClient,
  storyId: number | undefined,
  userId: string,
): Promise<StoryContext | null> {
  if (!storyId) return null

  const storyResult = await client.query<{ title: string; content: string }>(
    'SELECT title, content FROM stories WHERE id = $1 AND "userId" = $2 LIMIT 1',
    [storyId, userId],
  )

  const story = storyResult.rows[0]
  if (!story) return null

  const [charactersResult, locationsResult, timelinesResult] = await Promise.all([
    client.query<{ name: string; description: string }>(
      `SELECT c.name, c.description
       FROM characters c
       JOIN story_characters sc ON sc.character_id = c.id
       WHERE sc.story_id = $1
       LIMIT 20`,
      [storyId],
    ),
    client.query<{ name: string }>(
      `SELECT l.name
       FROM locations l
       JOIN story_locations sl ON sl.location_id = l.id
       WHERE sl.story_id = $1
       LIMIT 20`,
      [storyId],
    ),
    client.query<{ name: string }>(
      `SELECT t.name
       FROM timelines t
       JOIN story_timelines st ON st.timeline_id = t.id
       WHERE st.story_id = $1
       LIMIT 20`,
      [storyId],
    ),
  ])

  return {
    title: story.title,
    description: story.content ?? '',
    characters: charactersResult.rows,
    locations: locationsResult.rows,
    timelines: timelinesResult.rows,
  }
}
