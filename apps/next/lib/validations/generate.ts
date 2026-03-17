// apps/next/lib/validations/generate.ts
import { z } from 'zod'

export const GenerateEntitySchema = z.object({
  entityType: z.enum(['story', 'character', 'location', 'timeline']),
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(1000, 'Prompt must be 1000 characters or less')
    .trim(),
  storyId: z.number().int().positive().optional(),
})

export type GenerateEntityInput = z.infer<typeof GenerateEntitySchema>
