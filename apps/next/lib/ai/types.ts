// apps/next/lib/ai/types.ts

export type EntityType = 'story' | 'character' | 'location' | 'timeline'

export interface GenerateEntityRequest {
  entityType: EntityType
  prompt: string
  storyId?: number
}

export interface StoryContext {
  title: string
  description: string
  characters: Array<{ name: string; description: string }>
  locations: Array<{ name: string }>
  timelines: Array<{ name: string }>
}

export interface GenerateEntityResponse {
  name: string
  description: string
  attributes: Array<{ key: string; value: string }>
  mentionedCharacters: string[]
}

export interface AIProvider {
  generate(request: GenerateEntityRequest, context: StoryContext | null): Promise<GenerateEntityResponse>
}
