'use server'
import { headers } from 'next/headers'
import { auth } from '../../auth'
import { createUserProgress, upsertUserLanguageStats } from '@repo/database'
import pool from '../../app/utils/open-pool'
import { SubmitQuizSchema } from '@repo/schema'

export default async function submitQuiz(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: 'Must be logged in to save progress' }

  const parsed = SubmitQuizSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { language, score, totalQuestions, correctAnswers } = parsed.data

  try {
    const client = await pool.connect()
    try {
      const progress = await createUserProgress(client, {
        user_id: session.user.id,
        language,
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
      })
      const stats = await upsertUserLanguageStats(client, {
        user_id: session.user.id,
        language,
        score,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
      })
      return { progress, stats }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Failed to save quiz progress:', error)
    return { error: 'Failed to save quiz progress' }
  }
}
