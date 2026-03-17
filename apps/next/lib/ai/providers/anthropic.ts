// apps/next/lib/ai/providers/anthropic.ts
import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, GenerateEntityRequest, GenerateEntityResponse, StoryContext } from '../types'
import { buildSystemPrompt, buildUserMessage } from '../prompts'

export class AnthropicProvider implements AIProvider {
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async generate(
    request: GenerateEntityRequest,
    context: StoryContext | null,
  ): Promise<GenerateEntityResponse> {
    const systemPrompt = buildSystemPrompt(request.entityType, context)
    const userMessage = buildUserMessage(request.prompt)

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Failed to parse AI response: no text content')
    }

    try {
      const raw = textContent.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
      const parsed = JSON.parse(raw) as GenerateEntityResponse
      return {
        name: parsed.name ?? '',
        description: parsed.description ?? '',
        attributes: Array.isArray(parsed.attributes) ? parsed.attributes : [],
        mentionedCharacters: Array.isArray(parsed.mentionedCharacters) ? parsed.mentionedCharacters : [],
      }
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        console.error('AI raw response:', textContent.text)
      }
      throw new Error('Failed to parse AI response: invalid JSON')
    }
  }
}
