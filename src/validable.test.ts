import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from './policyEvaluator'
import { DefaultValidable } from './validable'



describe('DefaultValidable', () => {

  it('returns acceptAll when no policies provided', () => {

    const validable = DefaultValidable()

    expect(validable.validate('anything')).toBe(acceptAllSymbol)
  })

  it('matches value against allow pattern', () => {

    const validable = DefaultValidable({ allow: ['src/**'] })

    expect(validable.validate('src/app.ts')).toBe('src/**')
  })

  it('rejects when no allow pattern matches', () => {

    const validable = DefaultValidable({ allow: ['src/**'] })

    expect(validable.validate('docs/readme.md')).toBeUndefined()
  })

  it('deny overrides allow', () => {

    const validable = DefaultValidable({ allow: ['*'], deny: ['secret'] })

    expect(validable.validate('hello')).toBe('*')
    expect(validable.validate('secret')).toBeUndefined()
  })

  it('handles multiple policies (variadic)', () => {

    const validable = DefaultValidable({ allow: ['src/**'] }, { allow: ['docs/**'] })

    expect(validable.validate('src/app.ts')).toBe('src/**')
    expect(validable.validate('docs/readme.md')).toBe('docs/**')
    expect(validable.validate('test/app.test.ts')).toBeUndefined()
  })
})
