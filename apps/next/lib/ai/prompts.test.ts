// apps/next/lib/ai/prompts.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildUserMessage } from './prompts'
import type { EntityType, StoryContext } from './types'

const mockContext: StoryContext = {
  title: 'The Lost City',
  description: 'A tale of discovery in a forgotten land.',
  characters: [{ name: 'Maya Chen', description: 'An archaeologist' }],
  locations: [{ name: 'Ruins of Elara' }],
  timelines: [{ name: 'Ancient Era' }],
}

describe('buildSystemPrompt', () => {
  it('includes entity type in prompt', () => {
    const prompt = buildSystemPrompt('character', mockContext)
    expect(prompt).toContain('CHARACTER')
  })

  it('includes story title when context provided', () => {
    const prompt = buildSystemPrompt('character', mockContext)
    expect(prompt).toContain('The Lost City')
  })

  it('includes existing character names', () => {
    const prompt = buildSystemPrompt('character', mockContext)
    expect(prompt).toContain('Maya Chen')
  })

  it('works without context', () => {
    const prompt = buildSystemPrompt('location', null)
    expect(prompt).toContain('LOCATION')
    expect(prompt).not.toContain('Story context')
  })

  it('includes JSON schema instructions', () => {
    const prompt = buildSystemPrompt('character', null)
    expect(prompt).toContain('mentionedCharacters')
    expect(prompt).toContain('attributes')
  })
})

describe('buildUserMessage', () => {
  it('returns the prompt as the user message', () => {
    const msg = buildUserMessage('A mysterious blacksmith')
    expect(msg).toBe('A mysterious blacksmith')
  })
})
