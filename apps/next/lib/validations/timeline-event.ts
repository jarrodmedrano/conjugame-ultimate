import { z } from 'zod'

export const CreateTimelineEventSchema = z.object({
  timelineId: z.number().int().positive(),
  eventDate: z
    .string()
    .min(1, 'Event date is required')
    .max(100, 'Date must be 100 characters or less')
    .trim(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less')
    .trim(),
  description: z
    .string()
    .max(10000, 'Description must be 10,000 characters or less')
    .trim()
    .optional()
    .nullable(),
  orderIndex: z.number().int().min(0).default(0),
})

export const UpdateTimelineEventSchema = z.object({
  id: z.number().int().positive(),
  eventDate: z
    .string()
    .min(1, 'Event date is required')
    .max(100)
    .trim(),
  title: z.string().min(1, 'Title is required').max(255).trim(),
  description: z
    .string()
    .max(10000)
    .trim()
    .optional()
    .nullable(),
  orderIndex: z.number().int().min(0),
})

export type CreateTimelineEventInput = z.infer<typeof CreateTimelineEventSchema>
export type UpdateTimelineEventInput = z.infer<typeof UpdateTimelineEventSchema>
