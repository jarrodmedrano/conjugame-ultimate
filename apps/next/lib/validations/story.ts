import { z } from 'zod'

/**
 * Validation schema for creating a story
 */
export const CreateStorySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be 50,000 characters or less')
    .trim(),
  privacy: z.enum(['private', 'public']).default('private'),
})

export type CreateStoryInput = z.infer<typeof CreateStorySchema>

/**
 * Validation schema for updating a story
 */
export const UpdateStorySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .optional(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be 50,000 characters or less')
    .trim()
    .optional(),
  privacy: z.enum(['private', 'public']).optional(),
})

export type UpdateStoryInput = z.infer<typeof UpdateStorySchema>

/**
 * Validation schema for upserting a story attribute
 */
export const UpsertStoryAttributeSchema = z.object({
  key: z
    .string()
    .min(1, 'Key is required')
    .max(100, 'Key must be 100 characters or less')
    .trim()
    .regex(/^[a-z0-9_]+$/, 'Key must be lowercase letters, numbers, and underscores only'),
  value: z
    .string()
    .max(500, 'Value must be 500 characters or less')
    .trim()
    .nullable()
    .optional(),
  displayOrder: z.number().int().min(0).optional().nullable(),
})

export type UpsertStoryAttributeInput = z.infer<typeof UpsertStoryAttributeSchema>

/**
 * Validation schema for deleting a story attribute
 */
export const DeleteStoryAttributeSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Attribute ID must be a valid number')
    .transform((val) => parseInt(val, 10)),
})

export type DeleteStoryAttributeInput = z.infer<typeof DeleteStoryAttributeSchema>
