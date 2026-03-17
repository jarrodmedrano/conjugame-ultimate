import { z } from 'zod'
import { SUPPORTED_LANGUAGES } from './verb'

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]

export const AnswerSchema = z.object({
  text: z.string().min(1),
  correct: z.boolean(),
})

export const QuestionSchema = z.object({
  id: z.number(),
  verb_id: z.number().nullable(),
  tense: z.string().min(1).max(100),
  regularity: z.string().max(50).nullable(),
  verb_type: z.string().max(50).nullable(),
  text: z.string().min(1),
  translation: z.string().nullable(),
  answers: z.array(AnswerSchema).min(2).max(6),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  language: z.enum(SUPPORTED_LANGUAGES),
  src: z.string().max(255).nullable(),
  rating_score: z.union([z.string(), z.number()]).optional(),
  created_at: z.date().optional(),
})

export const CreateQuestionSchema = z.object({
  verb_id: z.number().optional().nullable(),
  tense: z.string().min(1, 'Tense is required').max(100),
  regularity: z.enum(['regular', 'irregular']).optional().nullable(),
  verb_type: z.string().max(50).optional().nullable(),
  text: z.string().min(1, 'Question text is required'),
  translation: z.string().optional().nullable(),
  answers: z.array(AnswerSchema).min(2, 'At least 2 answers required').max(6),
  difficulty: z.enum(DIFFICULTY_LEVELS).default('medium'),
  language: z.enum(SUPPORTED_LANGUAGES),
  src: z.string().max(255).optional().nullable(),
})

export const RateQuestionSchema = z.object({
  questionId: z.number(),
  rating: z.number().int().min(1).max(5),
})

export type Question = z.infer<typeof QuestionSchema>
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>
export type Answer = z.infer<typeof AnswerSchema>
export type RateQuestionInput = z.infer<typeof RateQuestionSchema>
