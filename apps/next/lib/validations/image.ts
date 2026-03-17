import { z } from 'zod'

/**
 * Validation schema for image upload
 */
export const UploadImageSchema = z.object({
  entityType: z.enum(['story', 'character', 'location', 'timeline']),
  entityId: z
    .string()
    .regex(/^\d+$/, 'Entity ID must be a valid number')
    .transform((val) => parseInt(val, 10)),
  isPrimary: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  displayOrder: z
    .string()
    .nullable()
    .optional()
    .default('0')
    .transform((val) => parseInt(val ?? '0', 10)),
})

export type UploadImageInput = z.infer<typeof UploadImageSchema>

/**
 * Validation schema for image deletion
 */
export const DeleteImageSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Image ID must be a valid number')
    .transform((val) => parseInt(val, 10)),
})

export type DeleteImageInput = z.infer<typeof DeleteImageSchema>
