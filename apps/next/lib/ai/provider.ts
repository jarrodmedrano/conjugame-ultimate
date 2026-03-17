// apps/next/lib/ai/provider.ts
import type { AIProvider } from './types'
import { AnthropicProvider } from './providers/anthropic'
import { OpenAIProvider } from './providers/openai'

export type SupportedProvider = 'anthropic' | 'openai'

export function getAIProvider(override?: { provider: SupportedProvider; apiKey: string }): AIProvider {
  if (override) {
    const model = process.env.AI_MODEL
    if (override.provider === 'openai') {
      return new OpenAIProvider(override.apiKey, model || 'gpt-4o')
    }
    return new AnthropicProvider(override.apiKey, model || 'claude-sonnet-4-6')
  }

  // Fall back to env-configured provider (server key)
  const providerName = process.env.AI_PROVIDER || 'anthropic'
  const model = process.env.AI_MODEL

  if (providerName === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is required')
    return new OpenAIProvider(apiKey, model || 'gpt-4o')
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is required')
  return new AnthropicProvider(apiKey, model || 'claude-sonnet-4-6')
}
