import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { isSafeUrl, SafeUrl, safeUrl } from './safeUrl'



describe('isSafeUrl', () => {

  it('accepts valid URLs', () => {

    expect(isSafeUrl('https://example.com')).toBe(true)
    expect(isSafeUrl('http://localhost:3000')).toBe(true)
    expect(isSafeUrl('https://api.github.com/repos/user/repo')).toBe(true)
  })

  it('rejects invalid URLs', () => {

    expect(isSafeUrl('')).toBe(false)
    expect(isSafeUrl('not-a-url')).toBe(false)
    expect(isSafeUrl('file:///etc/passwd')).toBe(false)
    expect(isSafeUrl('ftp://example.com')).toBe(false)
    expect(isSafeUrl('https://user:pass@example.com')).toBe(false)
  })
})


describe('SafeUrl', () => {

  describe('extract', () => {

    it('consumes URL-safe characters', () => {

      expect(safeUrl.extract('https://example.com/path')).toBe(24)
    })

    it('stops on space', () => {

      expect(safeUrl.extract('https://example.com next')).toBe(19)
    })

    it('returns false on invalid first character', () => {

      expect(safeUrl.extract(' http')).toBe(false)
    })
  })

  describe('validate', () => {

    it('accepts http URL', () => {

      expect(safeUrl.validate('http://example.com')).toBe(acceptAllSymbol)
    })

    it('accepts https URL', () => {

      expect(safeUrl.validate('https://example.com')).toBe(acceptAllSymbol)
    })

    it('rejects ftp URL', () => {

      expect(safeUrl.validate('ftp://example.com')).toBeUndefined()
    })

    it('rejects URL with credentials', () => {

      expect(safeUrl.validate('https://user:pass@example.com')).toBeUndefined()
    })
  })

  it('allowed: matches allow pattern', () => {

    const instance = SafeUrl(['https://example.com*'])

    expect(instance.validate('https://example.com/path')).toBe('https://example.com*')
  })

  it('noMatch: rejects when no allow pattern matches', () => {

    const instance = SafeUrl(['https://example.com*'])

    expect(instance.validate('https://evil.com')).toBeUndefined()
  })

  it('scopedDeny: deny overrides allow', () => {

    const instance = SafeUrl({ allow: ['*'], deny: ['https://evil.com*'] })

    expect(instance.validate('https://example.com')).toBeDefined()
    expect(instance.validate('https://evil.com/api')).toBeUndefined()
  })

  it('globalDeny: rejects on deny-only without allow', () => {

    const instance = SafeUrl({ deny: ['https://evil.com*'] })

    expect(instance.validate('https://evil.com')).toBeUndefined()
  })

  it('invalidInput: rejects unsafe value even with permissive allow', () => {

    const instance = SafeUrl({ allow: ['*'] })

    expect(instance.validate('ftp://example.com')).toBeUndefined()
  })
})
