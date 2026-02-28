import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { FixedLengthExtractableFactory } from './fixedLength'



describe('FixedLengthExtractableFactory', () => {

  const hexChars = new Set('0123456789abcdef')
  const alwaysValid = () => true
  const factory = FixedLengthExtractableFactory(hexChars, 8, alwaysValid)

  describe('extract', () => {

    it('consumes exactly N characters', () => {

      const extractable = factory()

      expect(extractable.extract('abcd1234rest')).toBe(8)
    })

    it('returns false when input is shorter than length', () => {

      const extractable = factory()

      expect(extractable.extract('abc')).toBe(false)
    })

    it('returns false when character not in charset within length', () => {

      const extractable = factory()

      expect(extractable.extract('abcdXXXX')).toBe(false)
    })
  })

  describe('validate (no policies)', () => {

    it('returns acceptAllSymbol when predicate passes', () => {

      const extractable = factory()

      expect(extractable.validate('abcd1234')).toBe(acceptAllSymbol)
    })

    it('returns undefined when predicate fails', () => {

      const rejectAll = () => false
      const rejectFactory = FixedLengthExtractableFactory(hexChars, 8, rejectAll)
      const extractable = rejectFactory()

      expect(extractable.validate('abcd1234')).toBeUndefined()
    })
  })

  describe('validate (with policies)', () => {

    it('matches allow pattern', () => {

      const extractable = factory({ allow: ['abcd*'] })

      expect(extractable.validate('abcd1234')).toBe('abcd*')
    })

    it('rejects when no allow pattern matches', () => {

      const extractable = factory({ allow: ['xxxx*'] })

      expect(extractable.validate('abcd1234')).toBeUndefined()
    })
  })
})
