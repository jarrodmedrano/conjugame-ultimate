import { Client } from 'pg'

export interface UserProgressRow {
  id: number
  user_id: string
  language: string
  score: number
  total_questions: number
  correct_answers: number
  completed_at: Date
}

export interface CreateUserProgressArgs {
  user_id: string
  language: string
  score: number
  total_questions: number
  correct_answers: number
}

export interface UserLanguageStatsRow {
  id: number
  user_id: string
  language: string
  total_score: number
  total_quizzes: number
  total_correct: number
  total_questions: number
  best_score: number
  last_played_at: Date | null
}

export interface UpsertUserLanguageStatsArgs {
  user_id: string
  language: string
  score: number
  correct_answers: number
  total_questions: number
}

export interface LeaderboardRow {
  user_id: string
  name: string | null
  username: string | null
  avatar_url: string | null
  language: string
  total_score: number
  total_quizzes: number
  best_score: number
}

export interface GetLeaderboardArgs {
  language: string
  limit_count: number
}

const createUserProgressQuery = `
INSERT INTO user_progress (user_id, language, score, total_questions, correct_answers)
VALUES ($1, $2, $3, $4, $5)
RETURNING *
`

export async function createUserProgress(client: Client, args: CreateUserProgressArgs): Promise<UserProgressRow> {
  const result = await client.query(createUserProgressQuery, [
    args.user_id, args.language, args.score, args.total_questions, args.correct_answers,
  ])
  return result.rows[0]
}

const listUserProgressQuery = `
SELECT * FROM user_progress WHERE user_id = $1 ORDER BY completed_at DESC LIMIT $2 OFFSET $3
`

export async function listUserProgress(client: Client, args: { user_id: string; limit: number; offset: number }): Promise<UserProgressRow[]> {
  const result = await client.query(listUserProgressQuery, [args.user_id, args.limit, args.offset])
  return result.rows
}

const listUserProgressByLanguageQuery = `
SELECT * FROM user_progress WHERE user_id = $1 AND language = $2 ORDER BY completed_at DESC LIMIT $3 OFFSET $4
`

export async function listUserProgressByLanguage(client: Client, args: { user_id: string; language: string; limit: number; offset: number }): Promise<UserProgressRow[]> {
  const result = await client.query(listUserProgressByLanguageQuery, [args.user_id, args.language, args.limit, args.offset])
  return result.rows
}

const listUserLanguageStatsQuery = `
SELECT * FROM user_language_stats WHERE user_id = $1 ORDER BY total_score DESC
`

export async function listUserLanguageStats(client: Client, args: { user_id: string }): Promise<UserLanguageStatsRow[]> {
  const result = await client.query(listUserLanguageStatsQuery, [args.user_id])
  return result.rows
}

const upsertUserLanguageStatsQuery = `
INSERT INTO user_language_stats (user_id, language, total_score, total_quizzes, total_correct, total_questions, best_score, last_played_at)
VALUES ($1, $2, $3, 1, $4, $5, $3, NOW())
ON CONFLICT (user_id, language) DO UPDATE SET
  total_score = user_language_stats.total_score + EXCLUDED.total_score,
  total_quizzes = user_language_stats.total_quizzes + 1,
  total_correct = user_language_stats.total_correct + EXCLUDED.total_correct,
  total_questions = user_language_stats.total_questions + EXCLUDED.total_questions,
  best_score = GREATEST(user_language_stats.best_score, EXCLUDED.best_score),
  last_played_at = NOW()
RETURNING *
`

export async function upsertUserLanguageStats(client: Client, args: UpsertUserLanguageStatsArgs): Promise<UserLanguageStatsRow> {
  const result = await client.query(upsertUserLanguageStatsQuery, [
    args.user_id, args.language, args.score, args.correct_answers, args.total_questions,
  ])
  return result.rows[0]
}

const getLeaderboardQuery = `
SELECT
  uls.user_id,
  u.name,
  u.username,
  u.avatar_url,
  uls.language,
  uls.total_score,
  uls.total_quizzes,
  uls.best_score
FROM user_language_stats uls
JOIN users u ON u.id = uls.user_id
WHERE ($1 = '' OR uls.language = $1)
ORDER BY uls.total_score DESC
LIMIT $2
`

export async function getLeaderboard(client: Client, args: GetLeaderboardArgs): Promise<LeaderboardRow[]> {
  const result = await client.query(getLeaderboardQuery, [args.language, args.limit_count])
  return result.rows
}
