// apps/next/lib/ai/providers/anthropic.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnthropicProvider } from './anthropic'
import type { GenerateEntityRequest } from '../types'

const mockMessagesCreate = vi.fn().mockResolvedValue({
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        name: 'Detective Marsh',
        description: 'A weathered investigator.',
        attributes: [{ key: 'Age', value: '45' }],
        mentionedCharacters: [],
      }),
    },
  ],
})

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockMessagesCreate }
      constructor(_opts: unknown) {}
    },
  }
})

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider

  beforeEach(() => {
    provider = new AnthropicProvider('fake-api-key', 'claude-sonnet-4-6')
  })

  it('returns structured response', async () => {
    const req: GenerateEntityRequest = {
      entityType: 'character',
      prompt: 'A brooding detective',
    }
    const result = await provider.generate(req, null)
    expect(result.name).toBe('Detective Marsh')
    expect(result.attributes).toHaveLength(1)
    expect(result.mentionedCharacters).toEqual([])
  })

  it('throws on invalid JSON response', async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not json' }],
    })

    const req: GenerateEntityRequest = { entityType: 'character', prompt: 'test' }
    await expect(provider.generate(req, null)).rejects.toThrow('Failed to parse AI response')
  })
})
