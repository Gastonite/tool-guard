import { describe, expect, it } from 'vitest'
import { parseStringPolicies } from './parseStringPolicies'



describe('parseStringPolicies', () => {

  it('returns undefined for empty array', () => {

    expect(parseStringPolicies([])).toBeUndefined()
  })

  it('parses array of strings as allow-only', () => {

    const result = parseStringPolicies([['src/**', 'docs/**']])

    expect(result).toEqual([{ allow: ['src/**', 'docs/**'], deny: [] }])
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

  it('throws on non-string values in arrays', () => {

    expect(() => parseStringPolicies([[123, 'src/**']])).toThrow('Expected string pattern, got number: 123')
  })

  it('throws on non-string values in allow', () => {

    expect(() => parseStringPolicies([{ allow: [42, 'src/**'] }])).toThrow('Expected string pattern, got number: 42')
  })

  it('throws on non-string values in deny', () => {

    expect(() => parseStringPolicies([{ deny: [true, '.env'] }])).toThrow('Expected string pattern, got boolean: true')
  })

  it('handles multiple policies (variadic)', () => {

    const result = parseStringPolicies([['src/**'], ['docs/**']])

    expect(result).toEqual([
      { allow: ['src/**'], deny: [] },
      { allow: ['docs/**'], deny: [] },
    ])
  })

  it('skips non-object non-array policies', () => {

    const result = parseStringPolicies(['string' as unknown, ['src/**']])

    expect(result).toEqual([{ allow: ['src/**'], deny: [] }])
  })

  it('returns undefined when object has empty allow and deny', () => {

    expect(parseStringPolicies([{ allow: [], deny: [] }])).toBeUndefined()
  })
})
