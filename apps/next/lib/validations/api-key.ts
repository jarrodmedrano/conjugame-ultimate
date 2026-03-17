import { z } from 'zod'

export const SaveApiKeySchema = z.object({
  provider: z.enum(['anthropic', 'openai']),
  apiKey: z
    .string()
    .min(20, 'API key is too short')
    .max(300, 'API key is too long')
    .trim()
    .refine(
      (key) => key.startsWith('sk-'),
      'Invalid API key format'
    ),
})

export type SaveApiKeyInput = z.infer<typeof SaveApiKeySchema>

export const DeleteApiKeySchema = z.object({
  provider: z.enum(['anthropic', 'openai']),
})

export type DeleteApiKeyInput = z.infer<typeof DeleteApiKeySchema>
