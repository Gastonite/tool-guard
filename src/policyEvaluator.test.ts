import { describe, expect, it } from 'vitest'
import { acceptAll, acceptAllSymbol, PolicyEvaluator } from './policyEvaluator'



const simpleTestMatch = (pattern: string, value: string) => (
  pattern === '*' || pattern === value
    ? { matched: true as const, match: pattern }
    : { matched: false as const, failure: value }
)


describe('acceptAll', () => {

  it('returns acceptAllSymbol for any value', () => {

    expect(acceptAll.validate('anything')).toBe(acceptAllSymbol)
  })

  it('returns acceptAllSymbol for empty string', () => {

    expect(acceptAll.validate('')).toBe(acceptAllSymbol)
  })
})


describe('PolicyEvaluator', () => {

  describe('globalDeny', () => {

    it('returns globalDeny when deny-only policy matches', () => {

      const evaluate = PolicyEvaluator(
        [{ allow: [], deny: ['secret'] }],
        simpleTestMatch,
      )

      expect(evaluate('secret')).toEqual({ outcome: 'globalDeny', match: 'secret' })
    })

    it('returns noMatch when deny-only policy does not match', () => {

      const evaluate = PolicyEvaluator(
        [{ allow: [], deny: ['secret'] }],
        simpleTestMatch,
      )

      expect(evaluate('public')).toEqual({ outcome: 'noMatch' })
    })
  })


  describe('scopedDeny', () => {

    it('returns scopedDeny when allow matches but deny also matches', () => {

      const evaluate = PolicyEvaluator(
        [{ allow: ['*'], deny: ['secret'] }],
        simpleTestMatch,
      )

      expect(evaluate('secret')).toEqual({ outcome: 'scopedDeny', match: 'secret' })
    })
  })


  describe('allowed', () => {

    it('returns allowed when allow matches and deny is empty', () => {

      const evaluate = PolicyEvaluator(
        [{ allow: ['foo'], deny: [] }],
        simpleTestMatch,
      )

      expect(evaluate('foo')).toEqual({ outcome: 'allowed', match: 'foo' })
    })

    it('returns allowed with wildcard pattern', () => {

      const evaluate = PolicyEvaluator(
        [{ allow: ['*'], deny: [] }],
        simpleTestMatch,
      )

      expect(evaluate('anything')).toEqual({ outcome: 'allowed', match: '*' })
    })
  })


  describe('noMatch', () => {

    it('returns noMatch with lastFailure when allow does not match', () => {

      const evaluate = PolicyEvaluator(
        [{ allow: ['foo'], deny: [] }],
        simpleTestMatch,
      )

      expect(evaluate('bar')).toEqual({ outcome: 'noMatch', lastFailure: 'bar' })
    })

    it('returns noMatch without lastFailure when policies array is empty', () => {

      const evaluate = PolicyEvaluator(
        [],
        simpleTestMatch,
      )

      expect(evaluate('anything')).toEqual({ outcome: 'noMatch' })
    })
  })


  describe('globalDeny takes priority over allow', () => {

    it('returns globalDeny even when a scoped policy would allow', () => {

      const evaluate = PolicyEvaluator(
        [
          { allow: [], deny: ['secret'] },
          { allow: ['*'], deny: [] },
        ],
        simpleTestMatch,
      )

      expect(evaluate('secret')).toEqual({ outcome: 'globalDeny', match: 'secret' })
    })
  })


  describe('first-match semantics', () => {

    it('uses the first scoped policy that matches allow', () => {

      const evaluate = PolicyEvaluator(
        [
          { allow: ['foo'], deny: ['foo'] },
          { allow: ['foo'], deny: [] },
        ],
        simpleTestMatch,
      )

      expect(evaluate('foo')).toEqual({ outcome: 'scopedDeny', match: 'foo' })
    })
  })


  describe('skip policy when allow does not match', () => {

    it('skips first policy and matches second', () => {

      const evaluate = PolicyEvaluator(
        [
          { allow: ['foo'], deny: [] },
          { allow: ['bar'], deny: [] },
        ],
        simpleTestMatch,
      )

      expect(evaluate('bar')).toEqual({ outcome: 'allowed', match: 'bar' })
    })
  })


  describe('empty policies array', () => {

    it('returns noMatch for any value', () => {

      const evaluate = PolicyEvaluator(
        [],
        simpleTestMatch,
      )

      expect(evaluate('anything')).toEqual({ outcome: 'noMatch' })
    })
  })


  describe('multiple global denies', () => {

    it('matches across multiple deny-only policies', () => {

      const evaluate = PolicyEvaluator(
        [
          { allow: [], deny: ['a'] },
          { allow: [], deny: ['b'] },
        ],
        simpleTestMatch,
      )

      expect(evaluate('b')).toEqual({ outcome: 'globalDeny', match: 'b' })
    })
  })


  describe('scoped policy with empty deny', () => {

    it('always allows when allow matches and deny is empty', () => {

      const evaluate = PolicyEvaluator(
        [{ allow: ['foo'], deny: [] }],
        simpleTestMatch,
      )

      expect(evaluate('foo')).toEqual({ outcome: 'allowed', match: 'foo' })
    })
  })
})
