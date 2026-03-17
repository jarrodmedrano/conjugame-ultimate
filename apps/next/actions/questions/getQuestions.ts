'use server'
import { listQuestionsByLanguage } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getQuestions(
  language: string,
  limit = 20,
  offset = 0,
) {
  try {
    const client = await pool.connect()
    try {
      return await listQuestionsByLanguage(client, { language, limit, offset })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Failed to fetch questions:', error)
    return []
  }
}
