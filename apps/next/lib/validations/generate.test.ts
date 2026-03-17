// apps/next/lib/validations/generate.test.ts
import { describe, it, expect } from 'vitest'
import { GenerateEntitySchema } from './generate'
import { z } from 'zod'

describe('GenerateEntitySchema', () => {
  it('accepts valid character request', () => {
    const result = GenerateEntitySchema.parse({
      entityType: 'character',
      prompt: 'A brooding detective',
    })
    expect(result.entityType).toBe('character')
    expect(result.storyId).toBeUndefined()
  })

  it('accepts valid request with storyId', () => {
    const result = GenerateEntitySchema.parse({
      entityType: 'location',
      prompt: 'A foggy pier',
      storyId: 42,
    })
    expect(result.storyId).toBe(42)
  })

  it('rejects invalid entityType', () => {
    expect(() =>
      GenerateEntitySchema.parse({ entityType: 'invalid', prompt: 'test' })
    ).toThrow(z.ZodError)
  })

  it('rejects empty prompt', () => {
    expect(() =>
      GenerateEntitySchema.parse({ entityType: 'character', prompt: '' })
    ).toThrow(z.ZodError)
  })

  it('rejects prompt over 1000 chars', () => {
    expect(() =>
      GenerateEntitySchema.parse({ entityType: 'character', prompt: 'x'.repeat(1001) })
    ).toThrow(z.ZodError)
  })
})
