import pool from '../app/utils/open-pool'
import { getSubscriptionByUserId } from '@repo/database'

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
 * Stub: quota enforcement has been removed. Always returns allowed.
 * Kept for API compatibility with any callers.
 */
export async function checkEntityQuota(
  _userId: string,
  _entityType: string,
): Promise<QuotaCheckResult> {
  return { allowed: true }
}

/**
 * Stub: quota enforcement has been removed. Always returns allowed.
 * Kept for API compatibility with any callers.
 */
export async function canCreateEntity(
  _userId: string,
  _entityType: string,
): Promise<QuotaCheckResult> {
  return { allowed: true }
}
