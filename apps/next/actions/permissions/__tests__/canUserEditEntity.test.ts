import { describe, it, expect } from 'vitest'
import canUserEditEntity from '../canUserEditEntity'

describe('canUserEditEntity', () => {
  it('should allow owner to edit own entity', () => {
    const result = canUserEditEntity({
      userId: 'user-1',
      ownerId: 'user-1',
    })
    expect(result).toBe(true)
  })

  it('should deny non-owner editing', () => {
    const result = canUserEditEntity({
      userId: 'user-2',
      ownerId: 'user-1',
    })
    expect(result).toBe(false)
  })

  it('should deny unauthenticated users editing', () => {
    const result = canUserEditEntity({
      userId: undefined,
      ownerId: 'user-1',
    })
    expect(result).toBe(false)
  })
})
