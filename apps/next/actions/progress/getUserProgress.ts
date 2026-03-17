'use server'
import { listUserLanguageStats, listUserProgress } from '@repo/database'
import pool from '../../app/utils/open-pool'

export async function getUserLanguageStats(userId: string) {
  try {
    const client = await pool.connect()
    try {
      return await listUserLanguageStats(client, { user_id: userId })
    } finally {
      client.release()
    }
  } catch {
    return []
  }
}

export async function getUserHistory(userId: string, limit = 20, offset = 0) {
  try {
    const client = await pool.connect()
    try {
      return await listUserProgress(client, { user_id: userId, limit, offset })
    } finally {
      client.release()
    }
  } catch {
    return []
  }
}
