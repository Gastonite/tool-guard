import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { isSafeBranch, SafeBranch, safeBranch } from './safeBranch'



describe('isSafeBranch', () => {

  it('accepts valid branch names', () => {

    expect(isSafeBranch('main')).toBe(true)
    expect(isSafeBranch('develop')).toBe(true)
    expect(isSafeBranch('feature/my-feature')).toBe(true)
    expect(isSafeBranch('release/v1.0.0')).toBe(true)
    expect(isSafeBranch('fix_bug_123')).toBe(true)
  })

  it('rejects invalid branch names', () => {

    expect(isSafeBranch('')).toBe(false)
    expect(isSafeBranch('-malicious')).toBe(false)
    expect(isSafeBranch('.hidden')).toBe(false)
    expect(isSafeBranch('my branch')).toBe(false)
    expect(isSafeBranch('branch;rm')).toBe(false)
  })
})


describe('SafeBranch', () => {

  describe('extract', () => {

    it('consumes path characters', () => {

      expect(safeBranch.extract('feature/foo')).toBe(11)
    })

    it('stops on space', () => {

      expect(safeBranch.extract('main next')).toBe(4)
    })

    it('returns false on invalid first character', () => {

      expect(safeBranch.extract(';rm')).toBe(false)
    })
  })

  describe('validate', () => {

    it('accepts valid branch name', () => {

      expect(safeBranch.validate('main')).toBe(acceptAllSymbol)
      expect(safeBranch.validate('feature/foo')).toBe(acceptAllSymbol)
      expect(safeBranch.validate('v1.0')).toBe(acceptAllSymbol)
    })

    it('rejects branch starting with -', () => {

      expect(safeBranch.validate('-dangerous')).toBeUndefined()
    })

    it('rejects branch starting with .', () => {

      expect(safeBranch.validate('.hidden')).toBeUndefined()
    })
  })

  it('allowed: matches allow pattern', () => {

    const instance = SafeBranch({ allow: ['main', 'feature/*'] })

    expect(instance.validate('main')).toBe('main')
    expect(instance.validate('feature/foo')).toBe('feature/*')
  })

  it('noMatch: rejects when no allow pattern matches', () => {

    const instance = SafeBranch({ allow: ['main', 'feature/*'] })

    expect(instance.validate('develop')).toBeUndefined()
  })

  it('scopedDeny: deny overrides allow', () => {

    const instance = SafeBranch({ allow: ['*'], deny: ['main'] })

    expect(instance.validate('feature/foo')).toBeDefined()
    expect(instance.validate('main')).toBeUndefined()
  })

  it('globalDeny: rejects on deny-only without allow', () => {

    const instance = SafeBranch({ deny: ['main'] })

    expect(instance.validate('main')).toBeUndefined()
  })

  it('invalidInput: rejects unsafe value even with permissive allow', () => {

    const instance = SafeBranch({ allow: ['*'] })

    expect(instance.validate('-dangerous')).toBeUndefined()
  })
})
