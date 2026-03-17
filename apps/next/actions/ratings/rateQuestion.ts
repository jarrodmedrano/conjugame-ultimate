'use server'
import { headers } from 'next/headers'
import { auth } from '../../auth'
import {
  upsertQuestionRating,
  getAverageRatingForQuestion,
  updateQuestionRatingScore,
} from '@repo/database'
import pool from '../../app/utils/open-pool'
import { RateQuestionSchema } from '@repo/schema'

export default async function rateQuestion(
  input: unknown,
): Promise<Record<string, unknown>> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { error: 'Must be logged in to rate questions' }

  const parsed = RateQuestionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { questionId, rating } = parsed.data

  try {
    const client = await pool.connect()
    try {
      await upsertQuestionRating(client, {
        user_id: session.user.id,
        question_id: questionId,
        rating,
      })
      const avgResult = await getAverageRatingForQuestion(client, {
        question_id: questionId,
      })
      if (avgResult.avg_rating) {
        await updateQuestionRatingScore(client, {
          id: questionId,
          rating_score: parseFloat(avgResult.avg_rating),
        })
      }
      return {
        success: true,
        avgRating: avgResult.avg_rating,
        ratingCount: avgResult.rating_count,
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Failed to rate question:', error)
    return { error: 'Failed to rate question' }
  }
}
