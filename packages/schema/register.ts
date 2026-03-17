import { z } from 'zod'
import { UsernameSchema } from './username'

export const RegisterSchema = z.object({
  email: z.string().email({
    message: 'Email is required',
  }),
  password: z.string().min(6, {
    message: 'Minimum 6 characters required',
  }),
  name: z.string().min(1, {
    message: 'Name is required',
  }),
  username: UsernameSchema,
})

export type registerSchema = z.infer<typeof RegisterSchema>
