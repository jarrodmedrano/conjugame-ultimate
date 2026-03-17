// apps/next/lib/ai/prompts.ts
import type { EntityType, StoryContext } from './types'

const ENTITY_LABELS: Record<EntityType, string> = {
  story: 'STORY',
  character: 'CHARACTER',
  location: 'LOCATION',
  timeline: 'TIMELINE',
}

const ENTITY_ATTRIBUTE_HINTS: Record<EntityType, string> = {
  story: 'Genre, Themes, Tone, Setting Era, Target Audience',
  character: 'Age, Gender, Occupation, Personality, Motivation, Flaw, Backstory',
  location: 'Climate, Population, Notable Features, History, Atmosphere',
  timeline: 'Time Period, Duration, Key Events, Significance',
}

export function buildSystemPrompt(
  entityType: EntityType,
  context: StoryContext | null,
): string {
  const label = ENTITY_LABELS[entityType]
  const attributeHints = ENTITY_ATTRIBUTE_HINTS[entityType]

  const contextSection = context
    ? `
## Story Context
Story: "${context.title}" — ${context.description}
${context.characters.length > 0 ? `Existing characters: ${context.characters.map((c) => `${c.name} (${c.description})`).join(', ')}` : ''}
${context.locations.length > 0 ? `Existing locations: ${context.locations.map((l) => l.name).join(', ')}` : ''}
${context.timelines.length > 0 ? `Existing timelines: ${context.timelines.map((t) => t.name).join(', ')}` : ''}
`
    : ''

  return `You are a creative writing assistant helping authors build rich story bibles.
${contextSection}
## Task
Generate a ${label} based on the user's prompt. Your output must be consistent with any story context provided above.

## Output Format
Return ONLY valid JSON matching this exact schema — no markdown, no explanation, just JSON:
{
  "name": "string (the ${label.toLowerCase()}'s name/title)",
  "description": "string (2-3 rich paragraphs)",
  "attributes": [{ "key": "string", "value": "string" }],
  "mentionedCharacters": ["string"]
}

## Attribute Guidelines
Suggested attribute keys for a ${label}: ${attributeHints}
Include 4-6 relevant attributes. Only populate mentionedCharacters with names from the existing characters list above that appear in your output — leave empty array if none.`
}

export function buildUserMessage(prompt: string): string {
  return prompt
}
