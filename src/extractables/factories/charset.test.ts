import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { CharsetExtractableFactory } from './charset'



describe('CharsetExtractableFactory', () => {

  const charset = new Set('abc123')
  const alwaysValid = () => true
  const factory = CharsetExtractableFactory(charset, alwaysValid)

  describe('extract', () => {

    it('consumes characters in charset', () => {

      const extractable = factory()

      expect(extractable.extract('abc123')).toBe(6)
    })

    it('stops at first character not in charset', () => {

      const extractable = factory()

      expect(extractable.extract('abc!123')).toBe(3)
    })

    it('returns false on empty string', () => {

      const extractable = factory()

      expect(extractable.extract('')).toBe(false)
    })

    it('returns false when first character is not in charset', () => {

      const extractable = factory()

      expect(extractable.extract('xyz')).toBe(false)
    })
  })

  describe('validate (no policies)', () => {

    it('returns acceptAllSymbol when predicate passes', () => {

      const extractable = factory()

      expect(extractable.validate('abc')).toBe(acceptAllSymbol)
    })

    it('returns undefined when predicate fails', () => {

      const rejectAll = () => false
      const rejectFactory = CharsetExtractableFactory(charset, rejectAll)
      const extractable = rejectFactory()

      expect(extractable.validate('abc')).toBeUndefined()
    })
  })

  describe('validate (with policies)', () => {

    it('matches allow pattern', () => {

      const extractable = factory({ allow: ['a*'] })

      expect(extractable.validate('abc')).toBe('a*')
    })

    it('rejects when predicate fails even with matching policy', () => {

      const rejectAll = () => false
      const rejectFactory = CharsetExtractableFactory(charset, rejectAll)
      const extractable = rejectFactory({ allow: ['*'] })

      expect(extractable.validate('abc')).toBeUndefined()
    })

    it('rejects when no allow pattern matches', () => {

      const extractable = factory({ allow: ['x*'] })

      expect(extractable.validate('abc')).toBeUndefined()
    })
  })
})
