import { describe, it, expect } from 'vitest'
import canUserViewEntity from '../canUserViewEntity'

describe('canUserViewEntity', () => {
  it('should allow owner to view own entity', () => {
    const result = canUserViewEntity({
      viewerId: 'user-1',
      ownerId: 'user-1',
      privacy: 'private',
    })
    expect(result).toBe(true)
  })

  it('should allow anyone to view public entity', () => {
    const result = canUserViewEntity({
      viewerId: 'user-2',
      ownerId: 'user-1',
      privacy: 'public',
    })
    expect(result).toBe(true)
  })

  it('should deny viewing private entity by non-owner', () => {
    const result = canUserViewEntity({
      viewerId: 'user-2',
      ownerId: 'user-1',
      privacy: 'private',
    })
    expect(result).toBe(false)
  })

  it('should deny unauthenticated users viewing private entities', () => {
    const result = canUserViewEntity({
      viewerId: undefined,
      ownerId: 'user-1',
      privacy: 'private',
    })
    expect(result).toBe(false)
  })

  it('should allow unauthenticated users viewing public entities', () => {
    const result = canUserViewEntity({
      viewerId: undefined,
      ownerId: 'user-1',
      privacy: 'public',
    })
    expect(result).toBe(true)
  })
})
