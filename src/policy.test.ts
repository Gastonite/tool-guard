import { describe, expect, it } from 'vitest'
import { Field } from './field'
import { Policy } from './policy'



const pathField = Field('path')
const patternField = Field('pattern')



describe('Policy', () => {

  describe('SimplePolicyDefinition', () => {

    it('creates allow rules from simple pattern array', () => {

      const policy = Policy({ allow: ['src/*'] }, [pathField])

      expect(policy.allow).toHaveLength(1)
      expect(policy.deny).toHaveLength(0)
    })

    it('creates deny rules from simple pattern array', () => {

      const policy = Policy({ deny: ['*.env'] }, [pathField])

      expect(policy.allow).toHaveLength(0)
      expect(policy.deny).toHaveLength(1)
    })

    it('creates both allow and deny rules', () => {

      const policy = Policy({ allow: ['src/*'], deny: ['*.env'] }, [pathField])

      expect(policy.allow).toHaveLength(1)
      expect(policy.deny).toHaveLength(1)
    })

    it('allow rule matches correct values', () => {

      const policy = Policy({ allow: ['src/*'] }, [pathField])
      const rule = policy.allow[0]!

      expect(rule({ path: 'src/app.ts' }).matched).toBe(true)
      expect(rule({ path: 'docs/readme.md' }).matched).toBe(false)
    })

    it('deny rule matches correct values', () => {

      const policy = Policy({ deny: ['*env'] }, [pathField])
      const rule = policy.deny[0]!

      expect(rule({ path: '.env' }).matched).toBe(true)
      expect(rule({ path: 'src/app.ts' }).matched).toBe(false)
    })
  })

  describe('StructuredPolicyDefinition', () => {

    it('creates rules from structured allow', () => {

      const policy = Policy(
        { allow: [{ path: ['src/*'] }] },
        [pathField],
      )

      expect(policy.allow).toHaveLength(1)
      expect(policy.deny).toHaveLength(0)
    })

    it('creates rules from structured deny', () => {

      const policy = Policy(
        { deny: [{ path: ['*.env'] }] },
        [pathField],
      )

      expect(policy.allow).toHaveLength(0)
      expect(policy.deny).toHaveLength(1)
    })

    it('creates multiple rules from array', () => {

      const policy = Policy(
        { allow: [{ path: ['src/*'] }, { path: ['docs/*'] }] },
        [pathField],
      )

      expect(policy.allow).toHaveLength(2)
    })

    it('structured rule matches correct values', () => {

      const policy = Policy(
        { allow: [{ path: ['src/*'], pattern: ['TODO'] }] },
        [pathField, patternField],
      )
      const rule = policy.allow[0]!

      expect(rule({ path: 'src/app.ts', pattern: 'TODO' }).matched).toBe(true)
      expect(rule({ path: 'src/app.ts', pattern: 'FIXME' }).matched).toBe(false)
    })
  })

  describe('validation', () => {

    it('throws on empty object (no allow or deny)', () => {

      expect(() => Policy({} as Record<string, unknown>, [pathField])).toThrow()
    })

    it('throws on invalid simple policy (empty allow array)', () => {

      expect(() => Policy({ allow: [] }, [pathField])).toThrow()
    })

    it('throws on invalid simple policy (empty deny array)', () => {

      expect(() => Policy({ deny: [] }, [pathField])).toThrow()
    })

    it('throws on empty rule object in allow (no fields)', () => {

      expect(() => Policy({ allow: [{}] }, [pathField])).toThrow()
    })

    it('throws on empty rule object in deny (no fields)', () => {

      expect(() => Policy({ deny: [{}] }, [pathField])).toThrow()
    })

    it('throws on wildcard string', () => {

      expect(() => Policy('*' as unknown as Record<string, unknown>, [pathField])).toThrow()
    })

    it('throws on single rule object (missing allow/deny wrapper)', () => {

      expect(() => Policy({ path: 'src/*' } as unknown as Record<string, unknown>, [pathField])).toThrow()
    })

    it('throws on array of rules directly', () => {

      expect(() => Policy([{ path: 'src/*' }] as unknown as Record<string, unknown>, [pathField])).toThrow()
    })
  })
})
