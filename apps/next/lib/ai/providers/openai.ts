// apps/next/lib/ai/providers/openai.ts
import OpenAI from 'openai'
import type { AIProvider, GenerateEntityRequest, GenerateEntityResponse, StoryContext } from '../types'
import { buildSystemPrompt, buildUserMessage } from '../prompts'

export class OpenAIProvider implements AIProvider {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey })
    this.model = model
  }

  async generate(
    request: GenerateEntityRequest,
    context: StoryContext | null,
  ): Promise<GenerateEntityResponse> {
    const systemPrompt = buildSystemPrompt(request.entityType, context)
    const userMessage = buildUserMessage(request.prompt)

    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('Failed to parse AI response: no content')
    }

    try {
      const parsed = JSON.parse(content) as GenerateEntityResponse
      return {
        name: parsed.name ?? '',
        description: parsed.description ?? '',
        attributes: Array.isArray(parsed.attributes) ? parsed.attributes : [],
        mentionedCharacters: Array.isArray(parsed.mentionedCharacters) ? parsed.mentionedCharacters : [],
      }
    } catch {
      throw new Error('Failed to parse AI response: invalid JSON')
    }
  }
}
