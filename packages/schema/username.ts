import { z } from 'zod'

export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be 30 characters or less')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, hyphens, and underscores',
  )
  .transform((val) => val.toLowerCase())

export type Username = z.infer<typeof UsernameSchema>
