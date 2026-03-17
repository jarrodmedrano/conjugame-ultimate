import { z } from 'zod'

/**
 * Validation schema for creating a location
 */
export const CreateLocationSchema = z.object({
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

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>

/**
 * Validation schema for updating a location
 */
export const UpdateLocationSchema = z.object({
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

export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>

/**
 * Validation schema for upserting a location attribute
 */
export const UpsertLocationAttributeSchema = z.object({
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

export type UpsertLocationAttributeInput = z.infer<typeof UpsertLocationAttributeSchema>

/**
 * Validation schema for deleting a location attribute
 */
export const DeleteLocationAttributeSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Attribute ID must be a valid number')
    .transform((val) => parseInt(val, 10)),
})

export type DeleteLocationAttributeInput = z.infer<typeof DeleteLocationAttributeSchema>
