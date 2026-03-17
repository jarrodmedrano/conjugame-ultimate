import { describe, it, expect } from 'vitest'
import { UsernameSchema } from '../username'

describe('UsernameSchema', () => {
  it('accepts valid usernames', () => {
    expect(UsernameSchema.parse('johndoe')).toBe('johndoe')
    expect(UsernameSchema.parse('john_doe')).toBe('john_doe')
    expect(UsernameSchema.parse('john-doe')).toBe('john-doe')
    expect(UsernameSchema.parse('abc')).toBe('abc')
    expect(UsernameSchema.parse('a'.repeat(30))).toHaveLength(30)
  })

  it('rejects too short', () => {
    expect(() => UsernameSchema.parse('ab')).toThrow()
  })

  it('rejects too long', () => {
    expect(() => UsernameSchema.parse('a'.repeat(31))).toThrow()
  })

  it('rejects special characters', () => {
    expect(() => UsernameSchema.parse('john doe')).toThrow()
    expect(() => UsernameSchema.parse('john@doe')).toThrow()
    expect(() => UsernameSchema.parse('john!doe')).toThrow()
  })

  it('lowercases the value', () => {
    expect(UsernameSchema.parse('JohnDoe')).toBe('johndoe')
  })
})
