import { QueryArrayConfig, QueryArrayResult } from 'pg'

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>
}

export const getTimelineEventsQuery = `-- name: GetTimelineEvents :many
SELECT id, timeline_id, event_date, title, description, order_index, created_at, updated_at
FROM timeline_events
WHERE timeline_id = $1
ORDER BY order_index ASC, created_at ASC`

export interface GetTimelineEventsArgs {
  timelineId: number
}

export interface GetTimelineEventsRow {
  id: number
  timelineId: number
  eventDate: string
  title: string
  description: string | null
  orderIndex: number
  createdAt: Date | null
  updatedAt: Date | null
}

export async function getTimelineEvents(
  client: Client,
  args: GetTimelineEventsArgs,
): Promise<GetTimelineEventsRow[]> {
  const result = await client.query({
    text: getTimelineEventsQuery,
    values: [args.timelineId],
    rowMode: 'array',
  })
  return result.rows.map((row) => ({
    id: row[0],
    timelineId: row[1],
    eventDate: row[2],
    title: row[3],
    description: row[4],
    orderIndex: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }))
}

export const createTimelineEventQuery = `-- name: CreateTimelineEvent :one
INSERT INTO timeline_events (timeline_id, event_date, title, description, order_index)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, timeline_id, event_date, title, description, order_index, created_at, updated_at`

export interface CreateTimelineEventArgs {
  timelineId: number
  eventDate: string
  title: string
  description: string | null
  orderIndex: number
}

export async function createTimelineEvent(
  client: Client,
  args: CreateTimelineEventArgs,
): Promise<GetTimelineEventsRow> {
  const result = await client.query({
    text: createTimelineEventQuery,
    values: [
      args.timelineId,
      args.eventDate,
      args.title,
      args.description,
      args.orderIndex,
    ],
    rowMode: 'array',
  })
  const row = result.rows[0]
  return {
    id: row[0],
    timelineId: row[1],
    eventDate: row[2],
    title: row[3],
    description: row[4],
    orderIndex: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const updateTimelineEventQuery = `-- name: UpdateTimelineEvent :one
UPDATE timeline_events
SET event_date = $2, title = $3, description = $4, order_index = $5, updated_at = NOW()
WHERE id = $1
RETURNING id, timeline_id, event_date, title, description, order_index, created_at, updated_at`

export interface UpdateTimelineEventArgs {
  id: number
  eventDate: string
  title: string
  description: string | null
  orderIndex: number
}

export async function updateTimelineEvent(
  client: Client,
  args: UpdateTimelineEventArgs,
): Promise<GetTimelineEventsRow | null> {
  const result = await client.query({
    text: updateTimelineEventQuery,
    values: [
      args.id,
      args.eventDate,
      args.title,
      args.description,
      args.orderIndex,
    ],
    rowMode: 'array',
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row[0],
    timelineId: row[1],
    eventDate: row[2],
    title: row[3],
    description: row[4],
    orderIndex: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}

export const deleteTimelineEventQuery = `-- name: DeleteTimelineEvent :exec
DELETE FROM timeline_events WHERE id = $1`

export interface DeleteTimelineEventArgs {
  id: number
}

export async function deleteTimelineEvent(
  client: Client,
  args: DeleteTimelineEventArgs,
): Promise<void> {
  await client.query({
    text: deleteTimelineEventQuery,
    values: [args.id],
    rowMode: 'array',
  })
}

export const getTimelineEventQuery = `-- name: GetTimelineEvent :one
SELECT id, timeline_id, event_date, title, description, order_index, created_at, updated_at
FROM timeline_events WHERE id = $1`

export async function getTimelineEvent(
  client: Client,
  args: { id: number },
): Promise<GetTimelineEventsRow | null> {
  const result = await client.query({
    text: getTimelineEventQuery,
    values: [args.id],
    rowMode: 'array',
  })
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row[0],
    timelineId: row[1],
    eventDate: row[2],
    title: row[3],
    description: row[4],
    orderIndex: row[5],
    createdAt: row[6],
    updatedAt: row[7],
  }
}
