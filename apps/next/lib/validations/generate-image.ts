// apps/next/lib/validations/generate-image.ts
import { z } from 'zod'

export const IMAGE_STYLES = [
  'sci-fi',
  'fantasy',
  'realistic',
  'noir',
  'drama',
  'comedy',
  'horror',
] as const

export type ImageStyle = (typeof IMAGE_STYLES)[number]

export const GenerateImageSchema = z.object({
  entityType: z.enum(['character', 'location', 'story', 'timeline']),
  entityName: z.string().min(1).max(100).trim(),
  entityDescription: z.string().max(5000).trim(),
  customPrompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(500, 'Prompt must be 500 characters or less')
    .trim(),
  style: z.enum(IMAGE_STYLES).optional(),
  entityId: z
    .string()
    .regex(/^\d+$/, 'Entity ID must be a valid number')
    .transform((val) => parseInt(val, 10)),
  isPrimary: z.boolean().default(false),
})

export type GenerateImageInput = z.infer<typeof GenerateImageSchema>
