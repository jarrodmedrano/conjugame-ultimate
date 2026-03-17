import type { PoolClient } from 'pg'
import pool from '../app/utils/open-pool'
import {
  getSubscriptionByUserId,
  countStoriesForUser,
  countCharactersForUser,
  countLocationsForUser,
  countTimelinesForUser,
} from '@repo/database'

export type EntityType = 'stories' | 'characters' | 'locations' | 'timelines'

export const PREVIEW_LIMITS: Record<EntityType, number> = {
  stories: 1,
  characters: 10,
  locations: 10,
  timelines: 1,
}

export interface QuotaCheckResult {
  allowed: boolean
  reason?: string
  limit?: number
  count?: number
}

/**
 * Returns true if the user has an active (or trialing) subscription.
 * Cancel-at-period-end subscriptions are still considered active until period ends.
 * Returns false on any database error (fail-closed).
 */
export async function isSubscribed(userId: string): Promise<boolean> {
  const client = await pool.connect()
  try {
    const subscription = await getSubscriptionByUserId(client, { userId })
    if (!subscription) return false
    return (
      subscription.status === 'active' || subscription.status === 'trialing'
    )
  } catch {
    return false
  } finally {
    client.release()
  }
}

/**
 * Core quota logic using a caller-supplied client.
 * Must be called within a transaction with an advisory lock held to prevent
 * race conditions (see entity creation routes).
 */
export async function checkQuotaWithClient(
  client: PoolClient,
  userId: string,
  entityType: EntityType,
): Promise<QuotaCheckResult> {
  const subscription = await getSubscriptionByUserId(client, { userId })
  const subscribed =
    subscription?.status === 'active' || subscription?.status === 'trialing'
  if (subscribed) {
    return { allowed: true }
  }

  const limit = PREVIEW_LIMITS[entityType]
  let count = 0

  switch (entityType) {
    case 'stories':
      count = await countStoriesForUser(client, { userid: userId })
      break
    case 'characters':
      count = await countCharactersForUser(client, { userid: userId })
      break
    case 'locations':
      count = await countLocationsForUser(client, { userid: userId })
      break
    case 'timelines':
      count = await countTimelinesForUser(client, { userid: userId })
      break
  }

  if (count >= limit) {
    return {
      allowed: false,
      reason: `Preview limit reached for ${entityType}.`,
      limit,
      count,
    }
  }

  return { allowed: true, limit, count }
}

/**
 * Checks whether a user can create an entity of the given type.
 * Subscribed users can always create. Preview users are subject to PREVIEW_LIMITS.
 * Fails closed on any database error.
 */
export async function canCreateEntity(
  userId: string,
  entityType: EntityType,
): Promise<QuotaCheckResult> {
  const client = await pool.connect()
  try {
    return await checkQuotaWithClient(client, userId, entityType)
  } catch (error) {
    console.error(
      'Quota check failed:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return {
      allowed: false,
      reason: 'Unable to verify subscription status. Please try again.',
    }
  } finally {
    client.release()
  }
}
