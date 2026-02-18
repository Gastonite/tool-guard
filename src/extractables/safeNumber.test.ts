import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { isSafeNumber, SafeNumber, safeNumber } from './safeNumber'



describe('isSafeNumber', () => {

  it('accepts valid numbers', () => {

    expect(isSafeNumber('0')).toBe(true)
    expect(isSafeNumber('42')).toBe(true)
    expect(isSafeNumber('123456789')).toBe(true)
  })

  it('rejects invalid numbers', () => {

    expect(isSafeNumber('')).toBe(false)
    expect(isSafeNumber('-5')).toBe(false)
    expect(isSafeNumber('3.14')).toBe(false)
    expect(isSafeNumber('42a')).toBe(false)
    expect(isSafeNumber('1e10')).toBe(false)
  })
})


describe('SafeNumber', () => {

  describe('extract', () => {

    it('consumes digits', () => {

      expect(safeNumber.extract('12345')).toBe(5)
    })

    it('stops on non-digit', () => {

      expect(safeNumber.extract('123abc')).toBe(3)
    })

    it('returns false on non-digit initial', () => {

      expect(safeNumber.extract('abc')).toBe(false)
    })
  })

  describe('validate', () => {

    it('accepts valid number', () => {

      expect(safeNumber.validate('42')).toBe(acceptAllSymbol)
    })

    it('rejects non-digit string', () => {

      expect(safeNumber.validate('abc')).toBeUndefined()
    })
  })

  it('allowed: matches allow pattern', () => {

    const instance = SafeNumber({ allow: ['42'] })

    expect(instance.validate('42')).toBe('42')
  })

  it('noMatch: rejects when no allow pattern matches', () => {

    const instance = SafeNumber({ allow: ['42'] })

    expect(instance.validate('99')).toBeUndefined()
  })

  it('scopedDeny: deny overrides allow', () => {

    const instance = SafeNumber({ allow: ['*'], deny: ['42'] })

    expect(instance.validate('99')).toBeDefined()
    expect(instance.validate('42')).toBeUndefined()
  })

  it('globalDeny: rejects on deny-only without allow', () => {

    const instance = SafeNumber({ deny: ['42'] })

    expect(instance.validate('42')).toBeUndefined()
  })

  it('invalidInput: rejects unsafe value even with permissive allow', () => {

    const instance = SafeNumber({ allow: ['*'] })

    expect(instance.validate('abc')).toBeUndefined()
  })
})
