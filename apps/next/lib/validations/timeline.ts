import { z } from 'zod'

/**
 * Validation schema for creating a timeline
 */
export const CreateTimelineSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(5000, 'Description must be 5,000 characters or less')
    .trim()
    .optional()
    .nullable(),
  privacy: z.enum(['private', 'public']).default('private'),
  storyId: z
    .string()
    .regex(/^\d+$/, 'Story ID must be a valid number')
    .optional()
    .nullable(),
})

export type CreateTimelineInput = z.infer<typeof CreateTimelineSchema>

/**
 * Validation schema for updating a timeline
 */
export const UpdateTimelineSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim()
    .optional(),
  description: z
    .string()
    .max(5000, 'Description must be 5,000 characters or less')
    .trim()
    .optional()
    .nullable(),
  privacy: z.enum(['private', 'public']).optional(),
})

export type UpdateTimelineInput = z.infer<typeof UpdateTimelineSchema>
