import { z } from 'zod'
import { SUPPORTED_LANGUAGES } from './verb'
import { DIFFICULTY_LEVELS } from './question'

export const QuizSetupSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES),
  difficulty: z.enum(DIFFICULTY_LEVELS).default('easy'),
  questionCount: z.number().int().min(5).max(20).default(10),
})

export const SubmitQuizSchema = z.object({
  language: z.string(),
  difficulty: z.string(),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  correctAnswers: z.number().int().min(0),
})

export type QuizSetupInput = z.infer<typeof QuizSetupSchema>
export type SubmitQuizInput = z.infer<typeof SubmitQuizSchema>
