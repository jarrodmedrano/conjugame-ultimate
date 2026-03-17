import { Client } from 'pg'

export interface QuestionRatingRow {
  id: number
  user_id: string
  question_id: number
  rating: number
  created_at: Date
}

export interface UpsertQuestionRatingArgs {
  user_id: string
  question_id: number
  rating: number
}

export interface AverageRatingRow {
  avg_rating: string | null
  rating_count: number
}

const upsertQuestionRatingQuery = `
INSERT INTO question_ratings (user_id, question_id, rating)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, question_id) DO UPDATE SET rating = EXCLUDED.rating
RETURNING *
`

export async function upsertQuestionRating(client: Client, args: UpsertQuestionRatingArgs): Promise<QuestionRatingRow> {
  const result = await client.query(upsertQuestionRatingQuery, [args.user_id, args.question_id, args.rating])
  return result.rows[0]
}

const getQuestionRatingQuery = `
SELECT * FROM question_ratings WHERE user_id = $1 AND question_id = $2 LIMIT 1
`

export async function getQuestionRating(client: Client, args: { user_id: string; question_id: number }): Promise<QuestionRatingRow | null> {
  const result = await client.query(getQuestionRatingQuery, [args.user_id, args.question_id])
  return result.rows.length > 0 ? result.rows[0] : null
}

const getAverageRatingQuery = `
SELECT AVG(rating)::decimal AS avg_rating, COUNT(*)::int AS rating_count
FROM question_ratings WHERE question_id = $1
`

export async function getAverageRatingForQuestion(client: Client, args: { question_id: number }): Promise<AverageRatingRow> {
  const result = await client.query(getAverageRatingQuery, [args.question_id])
  return result.rows[0]
}
