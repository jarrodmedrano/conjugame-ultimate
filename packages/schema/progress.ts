import { z } from 'zod'

export const UserProgressSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  language: z.string(),
  score: z.number(),
  total_questions: z.number(),
  correct_answers: z.number(),
  completed_at: z.date().optional(),
})

export const UserLanguageStatsSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  language: z.string(),
  total_score: z.number(),
  total_quizzes: z.number(),
  total_correct: z.number(),
  total_questions: z.number(),
  best_score: z.number(),
  last_played_at: z.date().nullable().optional(),
})

export type UserProgress = z.infer<typeof UserProgressSchema>
export type UserLanguageStats = z.infer<typeof UserLanguageStatsSchema>
