'use server'
import { getRandomQuestions } from '@repo/database'
import pool from '../../app/utils/open-pool'

export default async function getRandomQuestionsAction(
  language: string,
  difficulty: string,
  count: number,
) {
  try {
    const client = await pool.connect()
    try {
      return await getRandomQuestions(client, {
        language,
        difficulty,
        limit_count: count,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Failed to fetch random questions:', error)
    return []
  }
}
