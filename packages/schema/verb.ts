import { z } from 'zod'

export const SUPPORTED_LANGUAGES = ['spanish', 'english', 'portuguese'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const VerbSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255),
  language: z.enum(SUPPORTED_LANGUAGES),
  infinitive: z.string().max(255).nullable(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
})

export const CreateVerbSchema = z.object({
  name: z.string().min(1, 'Verb name is required').max(255),
  language: z.enum(SUPPORTED_LANGUAGES),
  infinitive: z.string().max(255).optional().nullable(),
})

export const UpdateVerbSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255).optional(),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
  infinitive: z.string().max(255).optional().nullable(),
})

export type Verb = z.infer<typeof VerbSchema>
export type CreateVerbInput = z.infer<typeof CreateVerbSchema>
export type UpdateVerbInput = z.infer<typeof UpdateVerbSchema>
