// apps/next/lib/ai/provider.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { getAIProvider } from './provider'

vi.mock('./providers/anthropic', () => ({
  AnthropicProvider: class MockAnthropicProvider {
    type = 'anthropic'
    constructor(_apiKey: string, _model: string) {}
  },
}))
vi.mock('./providers/openai', () => ({
  OpenAIProvider: class MockOpenAIProvider {
    type = 'openai'
    constructor(_apiKey: string, _model: string) {}
  },
}))

describe('getAIProvider', () => {
  afterEach(() => { vi.unstubAllEnvs() })

  it('returns AnthropicProvider when AI_PROVIDER=anthropic', () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic')
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key')
    vi.stubEnv('AI_MODEL', 'claude-sonnet-4-6')
    const provider = getAIProvider()
    expect((provider as unknown as { type: string }).type).toBe('anthropic')
  })

  it('returns OpenAIProvider when AI_PROVIDER=openai', () => {
    vi.stubEnv('AI_PROVIDER', 'openai')
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    vi.stubEnv('AI_MODEL', 'gpt-4o')
    const provider = getAIProvider()
    expect((provider as unknown as { type: string }).type).toBe('openai')
  })

  it('defaults to anthropic when AI_PROVIDER not set', () => {
    vi.stubEnv('AI_PROVIDER', '')
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key')
    vi.stubEnv('AI_MODEL', '')
    const provider = getAIProvider()
    expect((provider as unknown as { type: string }).type).toBe('anthropic')
  })

  it('throws when API key is missing', () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic')
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    expect(() => getAIProvider()).toThrow('ANTHROPIC_API_KEY')
  })
})
