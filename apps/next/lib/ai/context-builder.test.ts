// apps/next/lib/ai/context-builder.test.ts
import { describe, it, expect, vi } from 'vitest'
import { buildStoryContext } from './context-builder'

const mockClient = {
  query: vi.fn(),
}

describe('buildStoryContext', () => {
  it('returns null when storyId is undefined', async () => {
    const result = await buildStoryContext(mockClient as never, undefined)
    expect(result).toBeNull()
    expect(mockClient.query).not.toHaveBeenCalled()
  })

  it('returns structured context when storyId is provided', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ title: 'The Lost City', content: 'A tale...' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Maya Chen', description: 'Archaeologist' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Ruins of Elara' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Ancient Era' }] })

    const result = await buildStoryContext(mockClient as never, 1)
    expect(result?.title).toBe('The Lost City')
    expect(result?.characters[0]?.name).toBe('Maya Chen')
    expect(result?.locations[0]?.name).toBe('Ruins of Elara')
    expect(result?.timelines[0]?.name).toBe('Ancient Era')
  })

  it('returns null when story not found', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] })
    const result = await buildStoryContext(mockClient as never, 999)
    expect(result).toBeNull()
  })
})
