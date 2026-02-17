import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { SafeString, safeString } from './safeString'



describe('SafeString', () => {

  describe('extract', () => {

    it('consumes between double quotes', () => {

      expect(safeString.extract('"hello world"')).toBe(13)
    })

    it('consumes between single quotes', () => {

      expect(safeString.extract(`'hello world'`)).toBe(13)
    })

    it('returns false without opening quote', () => {

      expect(safeString.extract('hello world')).toBe(false)
    })

    it('returns false without closing quote', () => {

      expect(safeString.extract('"hello world')).toBe(false)
    })

    it('returns false if charset invalid between quotes', () => {

      expect(safeString.extract('"hello$world"')).toBe(false)
    })

    it('returns false for empty string', () => {

      expect(safeString.extract('')).toBe(false)
    })
  })

  describe('validate', () => {

    it('accepts safe content', () => {

      expect(safeString.validate('"hello world"')).toBe(acceptAllSymbol)
    })

    it('rejects dangerous characters', () => {

      expect(safeString.validate('"hello$world"')).toBeUndefined()
    })
  })

  it('allowed: matches allow pattern', () => {

    const instance = SafeString(['hello*'])

    expect(instance.validate('"hello world"')).toBe('hello*')
  })

  it('noMatch: rejects when no allow pattern matches', () => {

    const instance = SafeString(['hello*'])

    expect(instance.validate('"goodbye"')).toBeUndefined()
  })

  it('scopedDeny: deny overrides allow', () => {

    const instance = SafeString({ allow: ['*'], deny: ['hello*'] })

    expect(instance.validate('"goodbye world"')).toBeDefined()
    expect(instance.validate('"hello world"')).toBeUndefined()
  })

  it('globalDeny: rejects on deny-only without allow', () => {

    const instance = SafeString({ deny: ['hello*'] })

    expect(instance.validate('"hello world"')).toBeUndefined()
  })

  it('invalidInput: rejects unsafe value even with permissive allow', () => {

    const instance = SafeString({ allow: ['*'] })

    expect(instance.validate('"hello$world"')).toBeUndefined()
  })

  describe('quote-aware security', () => {

    it('accepts > inside double quotes', () => {

      expect(safeString.extract('"hello > world"')).toBe(15)
      expect(safeString.validate('"hello > world"')).toBe(acceptAllSymbol)
    })

    it('accepts > inside single quotes', () => {

      expect(safeString.extract(`'hello > world'`)).toBe(15)
      expect(safeString.validate(`'hello > world'`)).toBe(acceptAllSymbol)
    })

    it('rejects $ inside double quotes', () => {

      expect(safeString.extract('"hello$world"')).toBe(false)
    })

    it('accepts $ inside single quotes', () => {

      expect(safeString.extract(`'hello$world'`)).toBe(13)
      expect(safeString.validate(`'hello$world'`)).toBe(acceptAllSymbol)
    })

    it('rejects backtick inside double quotes', () => {

      expect(safeString.extract('"hello`world"')).toBe(false)
    })

    it('accepts backtick inside single quotes', () => {

      expect(safeString.extract(`'hello\`world'`)).toBe(13)
    })

    it('handles backslash escape in double quotes', () => {

      expect(safeString.extract('"say \\"hi\\""')).toBe(12)
      expect(safeString.validate('"say \\"hi\\""')).toBe(acceptAllSymbol)
    })

    it('accepts tab inside quotes', () => {

      expect(safeString.extract(`"hello\tworld"`)).toBe(13)
    })

    it('accepts newline inside quotes', () => {

      expect(safeString.extract(`"hello\nworld"`)).toBe(13)
    })
  })
})
