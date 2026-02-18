import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { isSafeCommitHash, SafeCommitHash, safeCommitHash } from './safeCommitHash'



describe('isSafeCommitHash', () => {

  it('accepts valid SHA-1 hashes', () => {

    expect(isSafeCommitHash('a'.repeat(40))).toBe(true)
    expect(isSafeCommitHash('0123456789abcdef0123456789abcdef01234567')).toBe(true)
  })

  it('rejects invalid hashes', () => {

    expect(isSafeCommitHash('')).toBe(false)
    expect(isSafeCommitHash('abc123')).toBe(false)
    expect(isSafeCommitHash('a'.repeat(41))).toBe(false)
    expect(isSafeCommitHash('g'.repeat(40))).toBe(false)
    expect(isSafeCommitHash('A'.repeat(40))).toBe(false)
  })
})


describe('SafeCommitHash', () => {

  const validHash = 'a'.repeat(40)

  describe('extract', () => {

    it('consumes exactly 40 hex chars', () => {

      expect(safeCommitHash.extract(validHash)).toBe(40)
    })

    it('returns false if less than 40 chars', () => {

      expect(safeCommitHash.extract('a'.repeat(39))).toBe(false)
    })

    it('returns false if non-hex character', () => {

      expect(safeCommitHash.extract('g'.repeat(40))).toBe(false)
    })
  })

  describe('validate', () => {

    it('accepts valid 40-char hex hash', () => {

      expect(safeCommitHash.validate(validHash)).toBe(acceptAllSymbol)
    })

    it('rejects short hash', () => {

      expect(safeCommitHash.validate('abcdef1')).toBeUndefined()
    })
  })

  it('allowed: matches allow pattern', () => {

    const instance = SafeCommitHash({ allow: [`${validHash}`] })

    expect(instance.validate(validHash)).toBe(validHash)
  })

  it('noMatch: rejects when no allow pattern matches', () => {

    const instance = SafeCommitHash({ allow: [`${validHash}`] })

    expect(instance.validate('b'.repeat(40))).toBeUndefined()
  })

  it('scopedDeny: deny overrides allow', () => {

    const instance = SafeCommitHash({ allow: ['*'], deny: [validHash] })

    expect(instance.validate('b'.repeat(40))).toBeDefined()
    expect(instance.validate(validHash)).toBeUndefined()
  })

  it('globalDeny: rejects on deny-only without allow', () => {

    const instance = SafeCommitHash({ deny: ['a*'] })

    expect(instance.validate(validHash)).toBeUndefined()
  })

  it('invalidInput: rejects unsafe value even with permissive allow', () => {

    const instance = SafeCommitHash({ allow: ['*'] })

    expect(instance.validate('short')).toBeUndefined()
  })
})
