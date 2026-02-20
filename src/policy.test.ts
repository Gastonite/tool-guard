import { describe, expect, it } from 'vitest'
import { Field } from './field'
import { type PolicyInput, StructuredPolicyFactory } from './policy'



const pathField = Field('path')
const patternField = Field('pattern')
const GuardPolicy = StructuredPolicyFactory([pathField])



describe('StructuredPolicyFactory', () => {

  describe('PolicyDefinition (simple)', () => {

    it('returns allowed when allow pattern matches', () => {

      const evaluate = GuardPolicy({ allow: ['src/*'] })

      expect(evaluate({ path: 'src/app.ts' }).outcome).toBe('allowed')
    })

    it('returns noMatch when allow pattern does not match', () => {

      const evaluate = GuardPolicy({ allow: ['src/*'] })

      expect(evaluate({ path: 'docs/readme.md' }).outcome).toBe('noMatch')
    })

    it('returns globalDeny when deny-only pattern matches', () => {

      const evaluate = GuardPolicy({ deny: ['*env'] })

      expect(evaluate({ path: '.env' }).outcome).toBe('globalDeny')
    })

    it('returns noMatch when deny-only pattern does not match', () => {

      const evaluate = GuardPolicy({ deny: ['*env'] })

      expect(evaluate({ path: 'src/app.ts' }).outcome).toBe('noMatch')
    })

    it('returns scopedDeny when allow and deny both match', () => {

      const evaluate = GuardPolicy({ allow: ['*'], deny: ['*env'] })

      expect(evaluate({ path: '.env' }).outcome).toBe('scopedDeny')
    })

    it('returns allowed when allow matches and deny does not', () => {

      const evaluate = GuardPolicy({ allow: ['*'], deny: ['*env'] })

      expect(evaluate({ path: 'src/app.ts' }).outcome).toBe('allowed')
    })
  })

  describe('StructuredPolicyDefinition', () => {

    it('returns allowed when structured allow pattern matches', () => {

      const evaluate = GuardPolicy({ allow: [{ path: ['src/*'] }] })

      expect(evaluate({ path: 'src/app.ts' }).outcome).toBe('allowed')
    })

    it('returns globalDeny when structured deny pattern matches', () => {

      const evaluate = GuardPolicy({ deny: [{ path: ['*env'] }] })

      expect(evaluate({ path: '.env' }).outcome).toBe('globalDeny')
    })

    it('returns allowed when any of multiple allow rules matches', () => {

      const evaluate = GuardPolicy({ allow: [{ path: ['src/*'] }, { path: ['docs/*'] }] })

      expect(evaluate({ path: 'docs/readme.md' }).outcome).toBe('allowed')
    })

    it('returns allowed when all fields match in multi-field AND logic', () => {

      const GuardPolicy2 = StructuredPolicyFactory([pathField, patternField])
      const evaluate = GuardPolicy2({ allow: [{ path: ['src/*'], pattern: ['TODO'] }] })

      expect(evaluate({ path: 'src/app.ts', pattern: 'TODO' }).outcome).toBe('allowed')
    })

    it('returns noMatch when one field does not match in multi-field AND logic', () => {

      const GuardPolicy2 = StructuredPolicyFactory([pathField, patternField])
      const evaluate = GuardPolicy2({ allow: [{ path: ['src/*'], pattern: ['TODO'] }] })

      expect(evaluate({ path: 'src/app.ts', pattern: 'FIXME' }).outcome).toBe('noMatch')
    })

    it('accepts any value for a field without pattern constraint (accept-all)', () => {

      const GuardPolicy2 = StructuredPolicyFactory([pathField, patternField])
      const evaluate = GuardPolicy2({ allow: [{ path: ['src/*'] }] })

      expect(evaluate({ path: 'src/app.ts', pattern: 'anything' }).outcome).toBe('allowed')
    })
  })

  describe('validation', () => {

    it('throws on empty object', () => {

      expect(() => GuardPolicy({} as unknown as PolicyInput<'path'>)).toThrow()
    })

    it('throws on empty allow array', () => {

      expect(() => GuardPolicy({ allow: [] } as unknown as PolicyInput<'path'>)).toThrow()
    })

    it('throws on empty deny array', () => {

      expect(() => GuardPolicy({ deny: [] } as unknown as PolicyInput<'path'>)).toThrow()
    })

    it('throws on empty rule object in allow', () => {

      expect(() => GuardPolicy({ allow: [{}] } as unknown as PolicyInput<'path'>)).toThrow()
    })

    it('throws on empty rule object in deny', () => {

      expect(() => GuardPolicy({ deny: [{}] } as unknown as PolicyInput<'path'>)).toThrow()
    })

    it('throws on wildcard string', () => {

      expect(() => GuardPolicy('*' as unknown as PolicyInput<'path'>)).toThrow()
    })

    it('throws on single rule object (missing allow/deny wrapper)', () => {

      expect(() => GuardPolicy({ path: 'src/*' } as unknown as PolicyInput<'path'>)).toThrow()
    })

    it('throws on array of rules directly', () => {

      expect(() => GuardPolicy([{ path: 'src/*' }] as unknown as PolicyInput<'path'>)).toThrow()
    })
  })

  describe('simple and structured produce same result', () => {

    it('returns same outcome for matching allow input', () => {

      const simple = GuardPolicy({ allow: ['src/*'], deny: ['*env'] })
      const structured = GuardPolicy({ allow: [{ path: ['src/*'] }], deny: [{ path: ['*env'] }] })

      expect(simple({ path: 'src/app.ts' }).outcome).toBe(structured({ path: 'src/app.ts' }).outcome)
    })

    it('returns same outcome for matching deny input', () => {

      const simple = GuardPolicy({ allow: ['src/*'], deny: ['*env'] })
      const structured = GuardPolicy({ allow: [{ path: ['src/*'] }], deny: [{ path: ['*env'] }] })

      expect(simple({ path: '.env' }).outcome).toBe(structured({ path: '.env' }).outcome)
    })

    it('returns same outcome for non-matching input', () => {

      const simple = GuardPolicy({ allow: ['src/*'], deny: ['*env'] })
      const structured = GuardPolicy({ allow: [{ path: ['src/*'] }], deny: [{ path: ['*env'] }] })

      expect(simple({ path: 'docs/readme.md' }).outcome).toBe(structured({ path: 'docs/readme.md' }).outcome)
    })
  })
})
