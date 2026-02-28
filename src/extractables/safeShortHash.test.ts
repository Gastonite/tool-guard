import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { isSafeShortHash, SafeShortHash, safeShortHash } from './safeShortHash'



describe('isSafeShortHash', () => {

  it('accepts valid short hashes', () => {

    expect(isSafeShortHash('abc1234')).toBe(true)
    expect(isSafeShortHash('abc123def4')).toBe(true)
    expect(isSafeShortHash('a'.repeat(40))).toBe(true)
  })

  it('rejects invalid short hashes', () => {

    expect(isSafeShortHash('abc123')).toBe(false)
    expect(isSafeShortHash('a'.repeat(41))).toBe(false)
    expect(isSafeShortHash('ghijklm')).toBe(false)
  })
})


describe('SafeShortHash', () => {

  describe('extract', () => {

    it('consumes hex chars', () => {

      expect(safeShortHash.extract('abcdef1')).toBe(7)
    })

    it('stops on non-hex', () => {

      expect(safeShortHash.extract('abcdefg')).toBe(6)
    })

    it('returns false on non-hex first character', () => {

      expect(safeShortHash.extract('xyz')).toBe(false)
    })
  })

  describe('validate', () => {

    it('accepts 7-char hex hash', () => {

      expect(safeShortHash.validate('abcdef1')).toBe(acceptAllSymbol)
    })

    it('rejects less than 7 chars', () => {

      expect(safeShortHash.validate('abcde')).toBeUndefined()
    })
  })

  it('allowed: matches allow pattern', () => {

    const instance = SafeShortHash({ allow: ['abcdef*'] })

    expect(instance.validate('abcdef1')).toBe('abcdef*')
  })

  it('noMatch: rejects when no allow pattern matches', () => {

    const instance = SafeShortHash({ allow: ['abcdef*'] })

    expect(instance.validate('1234567')).toBeUndefined()
  })

  it('scopedDeny: deny overrides allow', () => {

    const instance = SafeShortHash({ allow: ['*'], deny: ['abcdef1'] })

    expect(instance.validate('1234567')).toBeDefined()
    expect(instance.validate('abcdef1')).toBeUndefined()
  })

  it('globalDeny: rejects on deny-only without allow', () => {

    const instance = SafeShortHash({ deny: ['abcdef*'] })

    expect(instance.validate('abcdef1')).toBeUndefined()
  })

  it('invalidInput: rejects unsafe value even with permissive allow', () => {

    const instance = SafeShortHash({ allow: ['*'] })

    expect(instance.validate('ghijk')).toBeUndefined()
  })
})
