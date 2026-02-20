import { describe, expect, it } from 'vitest'
import { acceptAll, acceptAllSymbol, MergedPolicy, PolicyFactory, SimplePolicyFactory } from './policyEvaluator'



const SimpleTestMatcher = (pattern: string) => (value: string) => (
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



describe('PolicyFactory', () => {

  it('returns globalDeny when deny-only policy matches', () => {

    const policyFn = PolicyFactory(SimpleTestMatcher)({ deny: ['secret'] })

    expect(policyFn('secret')).toEqual({ outcome: 'globalDeny', match: 'secret' })
  })

  it('returns noMatch when deny-only policy does not match', () => {

    const policyFn = PolicyFactory(SimpleTestMatcher)({ deny: ['secret'] })

    expect(policyFn('public')).toEqual({ outcome: 'noMatch' })
  })

  it('returns scopedDeny when allow matches but deny also matches', () => {

    const policyFn = PolicyFactory(SimpleTestMatcher)({ allow: ['*'], deny: ['secret'] })

    expect(policyFn('secret')).toEqual({ outcome: 'scopedDeny', match: 'secret' })
  })

  it('returns allowed when allow matches and deny is empty', () => {

    const policyFn = PolicyFactory(SimpleTestMatcher)({ allow: ['foo'] })

    expect(policyFn('foo')).toEqual({ outcome: 'allowed', match: 'foo' })
  })

  it('returns allowed with wildcard pattern', () => {

    const policyFn = PolicyFactory(SimpleTestMatcher)({ allow: ['*'] })

    expect(policyFn('anything')).toEqual({ outcome: 'allowed', match: '*' })
  })

  it('returns noMatch with lastFailure when allow does not match', () => {

    const policyFn = PolicyFactory(SimpleTestMatcher)({ allow: ['foo'] })

    expect(policyFn('bar')).toEqual({ outcome: 'noMatch', lastFailure: 'bar' })
  })

  it('returns noMatch without lastFailure when policy is empty', () => {

    const policyFn = PolicyFactory(SimpleTestMatcher)({})

    expect(policyFn('anything')).toEqual({ outcome: 'noMatch' })
  })
})



describe('MergedPolicy', () => {

  it('returns globalDeny even when a later policy would allow', () => {

    const denyOnly = PolicyFactory(SimpleTestMatcher)({ deny: ['secret'] })
    const allowAll = PolicyFactory(SimpleTestMatcher)({ allow: ['*'] })
    const merged = MergedPolicy(denyOnly, allowAll)

    expect(merged('secret')).toEqual({ outcome: 'globalDeny', match: 'secret' })
  })

  it('returns first scopedDeny even when a later policy would allow', () => {

    const scopedDeny = PolicyFactory(SimpleTestMatcher)({ allow: ['foo'], deny: ['foo'] })
    const allowFoo = PolicyFactory(SimpleTestMatcher)({ allow: ['foo'] })
    const merged = MergedPolicy(scopedDeny, allowFoo)

    expect(merged('foo')).toEqual({ outcome: 'scopedDeny', match: 'foo' })
  })

  it('skips first policy when allow does not match and returns second allowed', () => {

    const first = PolicyFactory(SimpleTestMatcher)({ allow: ['foo'] })
    const second = PolicyFactory(SimpleTestMatcher)({ allow: ['bar'] })
    const merged = MergedPolicy(first, second)

    expect(merged('bar')).toEqual({ outcome: 'allowed', match: 'bar' })
  })

  it('returns noMatch without lastFailure when no policies are provided', () => {

    const merged = MergedPolicy<string, string, string>()

    const result = merged('anything')

    expect(result.outcome).toBe('noMatch')
    expect(result).toEqual({ outcome: 'noMatch', lastFailure: undefined })
  })

  it('returns globalDeny from second deny-only policy', () => {

    const first = PolicyFactory(SimpleTestMatcher)({ deny: ['a'] })
    const second = PolicyFactory(SimpleTestMatcher)({ deny: ['b'] })
    const merged = MergedPolicy(first, second)

    expect(merged('b')).toEqual({ outcome: 'globalDeny', match: 'b' })
  })

  it('returns allowed when allow matches and deny is empty', () => {

    const policy = PolicyFactory(SimpleTestMatcher)({ allow: ['foo'] })
    const merged = MergedPolicy(policy)

    expect(merged('foo')).toEqual({ outcome: 'allowed', match: 'foo' })
  })
})



describe('SimplePolicyFactory', () => {

  const createPolicy = SimplePolicyFactory(SimpleTestMatcher)

  it('returns allowed for matching value and noMatch for non-matching', () => {

    const policyFn = createPolicy({ allow: ['foo'] })

    expect(policyFn('foo')).toEqual({ outcome: 'allowed', match: 'foo' })
    expect(policyFn('bar')).toEqual({ outcome: 'noMatch', lastFailure: 'bar' })
  })

  it('returns globalDeny for matching deny value and noMatch for non-matching', () => {

    const policyFn = createPolicy({ deny: ['secret'] })

    expect(policyFn('secret')).toEqual({ outcome: 'globalDeny', match: 'secret' })
    expect(policyFn('public')).toEqual({ outcome: 'noMatch' })
  })

  it('returns allowed or scopedDeny with allow and deny combined', () => {

    const policyFn = createPolicy({ allow: ['*'], deny: ['secret'] })

    expect(policyFn('foo')).toEqual({ outcome: 'allowed', match: '*' })
    expect(policyFn('secret')).toEqual({ outcome: 'scopedDeny', match: 'secret' })
  })

  it('throws on empty object', () => {

    expect(() => createPolicy({})).toThrow()
  })

  it('throws on empty allow array', () => {

    expect(() => createPolicy({ allow: [] })).toThrow()
  })

  it('throws on invalid schema', () => {

    expect(() => createPolicy({ allow: [42] })).toThrow()
  })
})
