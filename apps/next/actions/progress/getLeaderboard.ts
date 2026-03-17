'use server'
import { getLeaderboard } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getLeaderboardAction(language = '', limit = 20) {
  try {
    const client = await pool.connect()
    try {
      return await getLeaderboard(client, { language, limit_count: limit })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return []
  }
}
