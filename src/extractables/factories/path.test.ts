import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { PathExtractableFactory } from './path'



describe('PathExtractableFactory', () => {

  describe('scope: internalUnlessExternalPrefixed', () => {

    it('accepts internal paths by default (no policies)', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' })
      const validable = factory()

      expect(validable.validate('src/app.ts')).toBe(acceptAllSymbol)
    })

    it('rejects external paths by default (no policies)', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' })
      const validable = factory()

      expect(validable.validate('/etc/passwd')).toBeUndefined()
    })

    it('allows internal paths matching non-prefixed allow pattern', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' })
      const validable = factory(['src/**'])

      expect(validable.validate('src/app.ts')).toBe('src/**')
      expect(validable.validate('docs/guide.md')).toBeUndefined()
    })

    it('denies internal paths matching non-prefixed deny pattern', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' })
      const validable = factory({ allow: ['**'], deny: ['**/.env'] })

      expect(validable.validate('src/app.ts')).toBe('**')
      expect(validable.validate('.env')).toBeUndefined()
    })

    it('allows external paths matching external:-prefixed allow pattern', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' })
      const validable = factory(['src/**', 'external:/etc/hosts'])

      expect(validable.validate('/etc/hosts')).toBe('/etc/hosts')
    })

    it('rejects external paths not matching any external:-prefixed allow pattern', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' })
      const validable = factory(['src/**', 'external:/etc/hosts'])

      expect(validable.validate('/etc/passwd')).toBeUndefined()
    })

    it('denies external paths matching external:-prefixed deny pattern', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' })
      const validable = factory({ allow: ['external:/etc/**'], deny: ['external:/etc/shadow'] })

      expect(validable.validate('/etc/hosts')).toBe('/etc/**')
      expect(validable.validate('/etc/shadow')).toBeUndefined()
    })

    it('ignores external:-prefixed patterns for internal paths', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' })
      const validable = factory(['external:/etc/**'])

      expect(validable.validate('src/app.ts')).toBeUndefined()
    })

    it('ignores non-prefixed patterns for external paths', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' })
      const validable = factory(['**'])

      expect(validable.validate('/etc/passwd')).toBeUndefined()
    })
  })

  describe('scope: false (no restriction)', () => {

    it('accepts any path without policies', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: false })
      const validable = factory()

      expect(validable.validate('src/app.ts')).toBe(acceptAllSymbol)
      expect(validable.validate('/etc/passwd')).toBe(acceptAllSymbol)
    })

    it('matches internal and external paths with same patterns', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: false })
      const validable = factory(['**'])

      expect(validable.validate('src/app.ts')).toBe('**')
      expect(validable.validate('/etc/passwd')).toBe('**')
    })
  })

  describe('scope: internal (strict)', () => {

    it('rejects external paths even with allow **', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internal' })
      const validable = factory(['**'])

      expect(validable.validate('src/app.ts')).toBe('**')
      expect(validable.validate('/etc/passwd')).toBeUndefined()
    })
  })

  describe('scope: external (strict)', () => {

    it('rejects internal paths even with allow **', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'external' })
      const validable = factory(['**'])

      expect(validable.validate('src/app.ts')).toBeUndefined()
      expect(validable.validate('/etc/passwd')).toBeDefined()
    })
  })

  describe('external: prefix validation', () => {

    it('throws when external: prefix used with scope internal', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internal' })

      expect(() => factory(['external:/etc/hosts'])).toThrow('external:')
    })

    it('throws when external: prefix used with scope external', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'external' })

      expect(() => factory(['external:/etc/hosts'])).toThrow('external:')
    })

    it('throws when external: prefix used with scope false', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: false })

      expect(() => factory(['external:/etc/hosts'])).toThrow('external:')
    })

    it('does not throw when external: prefix used with internalUnlessExternalPrefixed', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' })

      expect(() => factory(['external:/etc/hosts'])).not.toThrow()
    })

    it('throws when external: prefix is in deny patterns on wrong scope', () => {

      const factory = PathExtractableFactory({ type: 'file', scope: 'internal' })

      expect(() => factory({ deny: ['external:/etc/shadow'] })).toThrow('external:')
    })
  })
})
