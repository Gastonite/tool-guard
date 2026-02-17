import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { isSafePackage, SafePackage, safePackage } from './safePackage'



describe('isSafePackage', () => {

  it('accepts valid package names', () => {

    expect(isSafePackage('lodash')).toBe(true)
    expect(isSafePackage('my-package')).toBe(true)
    expect(isSafePackage('@types/node')).toBe(true)
    expect(isSafePackage('@scope/package')).toBe(true)
    expect(isSafePackage('pkg@1.0.0')).toBe(true)
    expect(isSafePackage('pkg@^1.0.0')).toBe(true)
  })

  it('rejects invalid package names', () => {

    expect(isSafePackage('')).toBe(false)
    expect(isSafePackage('UPPERCASE')).toBe(false)
    expect(isSafePackage('pkg; rm -rf /')).toBe(false)
    expect(isSafePackage('../../../etc/passwd')).toBe(false)
  })
})


describe('SafePackage', () => {

  describe('extract', () => {

    it('consumes package characters', () => {

      expect(safePackage.extract('lodash')).toBe(6)
    })

    it('stops on space', () => {

      expect(safePackage.extract('lodash next')).toBe(6)
    })

    it('returns false on invalid first character', () => {

      expect(safePackage.extract(' pkg')).toBe(false)
    })
  })

  describe('validate', () => {

    it('accepts simple package', () => {

      expect(safePackage.validate('lodash')).toBe(acceptAllSymbol)
    })

    it('accepts scoped package', () => {

      expect(safePackage.validate('@types/node')).toBe(acceptAllSymbol)
    })

    it('accepts package with version', () => {

      expect(safePackage.validate('@types/node@1.0.0')).toBe(acceptAllSymbol)
    })

    it('rejects invalid package name', () => {

      expect(safePackage.validate('UPPERCASE')).toBeUndefined()
    })
  })

  it('allowed: matches allow pattern', () => {

    const instance = SafePackage(['lodash', '@types/*'])

    expect(instance.validate('lodash')).toBe('lodash')
    expect(instance.validate('@types/node')).toBe('@types/*')
  })

  it('noMatch: rejects when no allow pattern matches', () => {

    const instance = SafePackage(['lodash', '@types/*'])

    expect(instance.validate('express')).toBeUndefined()
  })

  it('scopedDeny: deny overrides allow', () => {

    const instance = SafePackage({ allow: ['*'], deny: ['lodash'] })

    expect(instance.validate('express')).toBeDefined()
    expect(instance.validate('lodash')).toBeUndefined()
  })

  it('globalDeny: rejects on deny-only without allow', () => {

    const instance = SafePackage({ deny: ['lodash'] })

    expect(instance.validate('lodash')).toBeUndefined()
  })

  it('invalidInput: rejects unsafe value even with permissive allow', () => {

    const instance = SafePackage({ allow: ['*'] })

    expect(instance.validate('UPPERCASE')).toBeUndefined()
  })
})
