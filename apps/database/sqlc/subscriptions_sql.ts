import { QueryArrayConfig, QueryArrayResult } from 'pg'

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>
}

// ─── GetSubscriptionByUserId ──────────────────────────────────────────────────

export const getSubscriptionByUserIdQuery = `-- name: GetSubscriptionByUserId :one
SELECT id, user_id, stripe_customer_id, status, price_id, current_period_end, cancel_at_period_end, created_at, updated_at
FROM subscriptions
WHERE user_id = $1
LIMIT 1`

export interface GetSubscriptionByUserIdArgs {
  userId: string
}

export interface SubscriptionRow {
  id: string
  userId: string
  stripeCustomerId: string
  status: string
  priceId: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean | null
  createdAt: Date
  updatedAt: Date
}

export async function getSubscriptionByUserId(
  client: Client,
  args: GetSubscriptionByUserIdArgs,
): Promise<SubscriptionRow | null> {
  const result = await client.query({
    text: getSubscriptionByUserIdQuery,
    values: [args.userId],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userId: row[1],
    stripeCustomerId: row[2],
    status: row[3],
    priceId: row[4],
    currentPeriodEnd: row[5],
    cancelAtPeriodEnd: row[6],
    createdAt: row[7],
    updatedAt: row[8],
  }
}

// ─── GetSubscriptionByStripeCustomerId ───────────────────────────────────────

export const getSubscriptionByStripeCustomerIdQuery = `-- name: GetSubscriptionByStripeCustomerId :one
SELECT id, user_id, stripe_customer_id, status, price_id, current_period_end, cancel_at_period_end, created_at, updated_at
FROM subscriptions
WHERE stripe_customer_id = $1
LIMIT 1`

export interface GetSubscriptionByStripeCustomerIdArgs {
  stripeCustomerId: string
}

export async function getSubscriptionByStripeCustomerId(
  client: Client,
  args: GetSubscriptionByStripeCustomerIdArgs,
): Promise<SubscriptionRow | null> {
  const result = await client.query({
    text: getSubscriptionByStripeCustomerIdQuery,
    values: [args.stripeCustomerId],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userId: row[1],
    stripeCustomerId: row[2],
    status: row[3],
    priceId: row[4],
    currentPeriodEnd: row[5],
    cancelAtPeriodEnd: row[6],
    createdAt: row[7],
    updatedAt: row[8],
  }
}

// ─── UpsertSubscription ───────────────────────────────────────────────────────

export const upsertSubscriptionQuery = `-- name: UpsertSubscription :one
INSERT INTO subscriptions (id, user_id, stripe_customer_id, status, price_id, current_period_end, cancel_at_period_end, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
    id = EXCLUDED.id,
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    status = EXCLUDED.status,
    price_id = EXCLUDED.price_id,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    updated_at = NOW()
RETURNING id, user_id, stripe_customer_id, status, price_id, current_period_end, cancel_at_period_end, created_at, updated_at`

export interface UpsertSubscriptionArgs {
  id: string
  userId: string
  stripeCustomerId: string
  status: string
  priceId: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
}

export async function upsertSubscription(
  client: Client,
  args: UpsertSubscriptionArgs,
): Promise<SubscriptionRow | null> {
  const result = await client.query({
    text: upsertSubscriptionQuery,
    values: [
      args.id,
      args.userId,
      args.stripeCustomerId,
      args.status,
      args.priceId,
      args.currentPeriodEnd,
      args.cancelAtPeriodEnd,
    ],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userId: row[1],
    stripeCustomerId: row[2],
    status: row[3],
    priceId: row[4],
    currentPeriodEnd: row[5],
    cancelAtPeriodEnd: row[6],
    createdAt: row[7],
    updatedAt: row[8],
  }
}

// ─── UpdateSubscriptionStatus ─────────────────────────────────────────────────

export const updateSubscriptionStatusQuery = `-- name: UpdateSubscriptionStatus :one
UPDATE subscriptions
SET status = $2,
    cancel_at_period_end = $3,
    current_period_end = $4,
    updated_at = NOW()
WHERE user_id = $1
RETURNING id, user_id, stripe_customer_id, status, price_id, current_period_end, cancel_at_period_end, created_at, updated_at`

export interface UpdateSubscriptionStatusArgs {
  userId: string
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date | null
}

export async function updateSubscriptionStatus(
  client: Client,
  args: UpdateSubscriptionStatusArgs,
): Promise<SubscriptionRow | null> {
  const result = await client.query({
    text: updateSubscriptionStatusQuery,
    values: [
      args.userId,
      args.status,
      args.cancelAtPeriodEnd,
      args.currentPeriodEnd,
    ],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return null
  }
  const row = result.rows[0]
  return {
    id: row[0],
    userId: row[1],
    stripeCustomerId: row[2],
    status: row[3],
    priceId: row[4],
    currentPeriodEnd: row[5],
    cancelAtPeriodEnd: row[6],
    createdAt: row[7],
    updatedAt: row[8],
  }
}

// ─── Entity count queries ──────────────────────────────────────────────────────

export const countStoriesForUserQuery = `-- name: CountStoriesForUser :one
SELECT COUNT(*) AS count FROM stories WHERE "userId" = $1`

export const countCharactersForUserQuery = `-- name: CountCharactersForUser :one
SELECT COUNT(*) AS count FROM characters WHERE "userId" = $1`

export const countLocationsForUserQuery = `-- name: CountLocationsForUser :one
SELECT COUNT(*) AS count FROM locations WHERE "userId" = $1`

export const countTimelinesForUserQuery = `-- name: CountTimelinesForUser :one
SELECT COUNT(*) AS count FROM timelines WHERE "userId" = $1`

export interface CountForUserArgs {
  userid: string
}

export interface CountRow {
  count: string
}

async function countQuery(
  client: Client,
  queryText: string,
  userId: string,
): Promise<number> {
  const result = await client.query({
    text: queryText,
    values: [userId],
    rowMode: 'array',
  })
  if (result.rows.length !== 1) {
    return 0
  }
  return parseInt(result.rows[0][0] as string, 10)
}

export async function countStoriesForUser(
  client: Client,
  args: CountForUserArgs,
): Promise<number> {
  return countQuery(client, countStoriesForUserQuery, args.userid)
}

export async function countCharactersForUser(
  client: Client,
  args: CountForUserArgs,
): Promise<number> {
  return countQuery(client, countCharactersForUserQuery, args.userid)
}

export async function countLocationsForUser(
  client: Client,
  args: CountForUserArgs,
): Promise<number> {
  return countQuery(client, countLocationsForUserQuery, args.userid)
}

export async function countTimelinesForUser(
  client: Client,
  args: CountForUserArgs,
): Promise<number> {
  return countQuery(client, countTimelinesForUserQuery, args.userid)
}
