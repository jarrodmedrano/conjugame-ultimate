import { describe, it, expect } from 'vitest'
import { validateImageFile } from './validate-image'

describe('validateImageFile', () => {
  it('rejects non-image files', () => {
    const result = validateImageFile({
      type: 'text/plain',
      size: 1000,
    } as File)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('JPG and PNG')
  })

  it('rejects GIF files', () => {
    const result = validateImageFile({
      type: 'image/gif',
      size: 1000,
    } as File)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('JPG and PNG')
  })

  it('rejects files over 2MB', () => {
    const result = validateImageFile({
      type: 'image/jpeg',
      size: 3 * 1024 * 1024, // 3MB
    } as File)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('2MB')
  })

  it('accepts valid JPEG under 2MB', () => {
    const result = validateImageFile({
      type: 'image/jpeg',
      size: 1 * 1024 * 1024, // 1MB
    } as File)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('accepts valid PNG under 2MB', () => {
    const result = validateImageFile({
      type: 'image/png',
      size: 500 * 1024, // 500KB
    } as File)

    expect(result.valid).toBe(true)
  })
})
