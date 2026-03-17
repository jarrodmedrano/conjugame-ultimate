// apps/next/lib/ai/types.test.ts
import { describe, it, expect } from 'vitest'
import type { GenerateEntityRequest, GenerateEntityResponse, AIProvider } from './types'

describe('AI types', () => {
  it('GenerateEntityRequest accepts valid shape', () => {
    const req: GenerateEntityRequest = {
      entityType: 'character',
      prompt: 'A brooding detective',
      storyId: 42,
    }
    expect(req.entityType).toBe('character')
    expect(req.storyId).toBe(42)
  })

  it('GenerateEntityRequest allows no storyId', () => {
    const req: GenerateEntityRequest = {
      entityType: 'location',
      prompt: 'A foggy pier',
    }
    expect(req.storyId).toBeUndefined()
  })

  it('GenerateEntityResponse has required fields', () => {
    const res: GenerateEntityResponse = {
      name: 'Detective Marsh',
      description: 'A haunted investigator.',
      attributes: [{ key: 'Age', value: '45' }],
      mentionedCharacters: [],
    }
    expect(res.name).toBe('Detective Marsh')
    expect(res.attributes).toHaveLength(1)
  })
})
