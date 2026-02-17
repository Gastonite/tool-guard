import { describe, expect, it } from 'vitest'
import { Field } from './field'
import { acceptAllSymbol } from './policyEvaluator'
import { Rule } from './rule'



const pathField = Field('path')
const patternField = Field('pattern')



describe('Rule', () => {

  describe('single field', () => {

    it('matches when value matches pattern', () => {

      const rule = Rule({ path: ['src/*'] }, [pathField])
      const result = rule({ path: 'src/app.ts' })

      expect(result.matched).toBe(true)

      if (result.matched)
        expect(result.match.pattern).toBe('src/*')
    })

    it('fails when value does not match pattern', () => {

      const rule = Rule({ path: ['src/*'] }, [pathField])
      const result = rule({ path: 'docs/readme.md' })

      expect(result.matched).toBe(false)

      if (!result.matched) {

        expect(result.failure.field.name).toBe('path')
        expect(result.failure.value).toBe('docs/readme.md')
      }
    })

    it('uses accept-all when pattern is undefined for field', () => {

      const rule = Rule({ pattern: ['TODO'] }, [pathField, patternField])
      const result = rule({ path: 'anything', pattern: 'TODO' })

      expect(result.matched).toBe(true)

      if (result.matched)
        expect(result.match.pattern).toBe('TODO')
    })
  })

  describe('multi field', () => {

    it('matches when all fields match (AND logic)', () => {

      const rule = Rule(
        { path: ['src/*'], pattern: ['TODO'] },
        [pathField, patternField],
      )
      const result = rule({ path: 'src/app.ts', pattern: 'TODO' })

      expect(result.matched).toBe(true)
    })

    it('fails on first non-matching field', () => {

      const rule = Rule(
        { path: ['src/*'], pattern: ['TODO'] },
        [pathField, patternField],
      )
      const result = rule({ path: 'docs/readme.md', pattern: 'TODO' })

      expect(result.matched).toBe(false)

      if (!result.matched)
        expect(result.failure.field.name).toBe('path')
    })

    it('returns last matched field and pattern on success', () => {

      const rule = Rule(
        { path: ['src/*'], pattern: ['TODO'] },
        [pathField, patternField],
      )
      const result = rule({ path: 'src/app.ts', pattern: 'TODO' })

      expect(result.matched).toBe(true)

      if (result.matched) {

        expect(result.match.field.name).toBe('pattern')
        expect(result.match.pattern).toBe('TODO')
      }
    })
  })

  describe('input coercion', () => {

    it('coerces missing input property to empty string', () => {

      const rule = Rule({ path: [''] }, [pathField])
      const result = rule({})

      expect(result.matched).toBe(true)
    })

    it('coerces non-string input to string', () => {

      const rule = Rule({ path: ['42'] }, [pathField])
      const result = rule({ path: 42 })

      expect(result.matched).toBe(true)
    })
  })

  describe('accept-all (no pattern for field)', () => {

    it('returns acceptAllSymbol when last field has no pattern', () => {

      // pattern has a value, path does not → path uses accept-all
      // Fields ordered [patternField, pathField] so path is last → acceptAllSymbol is the final pattern
      const rule = Rule({ pattern: ['TODO'] }, [patternField, pathField])
      const result = rule({ pattern: 'TODO', path: 'anything' })

      expect(result.matched).toBe(true)

      if (result.matched)
        expect(result.match.pattern).toBe(acceptAllSymbol)
    })
  })
})
