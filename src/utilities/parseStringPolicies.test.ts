import { describe, expect, it } from 'vitest'
import { parseStringPolicies } from './parseStringPolicies'



describe('parseStringPolicies', () => {

  it('returns undefined for empty array', () => {

    expect(parseStringPolicies([])).toBeUndefined()
  })

  it('parses object with allow and deny', () => {

    const result = parseStringPolicies([{ allow: ['**'], deny: ['.env'] }])

    expect(result).toEqual([{ allow: ['**'], deny: ['.env'] }])
  })

  it('parses object with allow only', () => {

    const result = parseStringPolicies([{ allow: ['src/**'] }])

    expect(result).toEqual([{ allow: ['src/**'], deny: [] }])
  })

  it('parses object with deny only', () => {

    const result = parseStringPolicies([{ deny: ['.env'] }])

    expect(result).toEqual([{ allow: [], deny: ['.env'] }])
  })

  it('handles multiple policies (variadic)', () => {

    const result = parseStringPolicies([{ allow: ['src/**'] }, { allow: ['docs/**'] }])

    expect(result).toEqual([
      { allow: ['src/**'], deny: [] },
      { allow: ['docs/**'], deny: [] },
    ])
  })

  it('returns undefined when object has empty allow and deny', () => {

    expect(parseStringPolicies([{ allow: [], deny: [] }])).toBeUndefined()
  })

  it('throws on array shorthand', () => {

    expect(() => parseStringPolicies([['src/**', 'docs/**']])).toThrow()
  })

  it('throws on string policy', () => {

    expect(() => parseStringPolicies(['string' as unknown])).toThrow()
  })

  it('throws on non-string values in allow', () => {

    expect(() => parseStringPolicies([{ allow: [42] }])).toThrow()
  })

  it('throws on non-string values in deny', () => {

    expect(() => parseStringPolicies([{ deny: [true] }])).toThrow()
  })

  it('throws on empty object (no allow, no deny)', () => {

    expect(() => parseStringPolicies([{}])).toThrow()
  })
})
