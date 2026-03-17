// apps/next/lib/ai/providers/openai.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAIProvider } from './openai'
import type { GenerateEntityRequest } from '../types'

const mockCompletionsCreate = vi.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: JSON.stringify({
          name: 'Harbor Town',
          description: 'A windswept coastal settlement.',
          attributes: [{ key: 'Climate', value: 'Maritime' }],
          mentionedCharacters: [],
        }),
      },
    },
  ],
})

vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = { completions: { create: mockCompletionsCreate } }
      constructor(_opts: unknown) {}
    },
  }
})

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider

  beforeEach(() => {
    provider = new OpenAIProvider('fake-api-key', 'gpt-4o')
  })

  it('returns structured response', async () => {
    const req: GenerateEntityRequest = {
      entityType: 'location',
      prompt: 'A windswept harbor town',
    }
    const result = await provider.generate(req, null)
    expect(result.name).toBe('Harbor Town')
    expect(result.attributes[0]?.key).toBe('Climate')
  })

  it('throws on invalid JSON response', async () => {
    mockCompletionsCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'not json' } }],
    })

    const req: GenerateEntityRequest = { entityType: 'location', prompt: 'test' }
    await expect(provider.generate(req, null)).rejects.toThrow('Failed to parse AI response')
  })
})
