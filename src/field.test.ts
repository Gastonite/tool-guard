import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { Field } from './field'
import { acceptAll } from './policyEvaluator'



describe('Field', () => {

  describe('string shorthand', () => {

    const field = Field('path')

    it('normalizes string to Field with all 4 props', () => {

      expect(field.name).toBe('path')
      expect(field.buildSuggestion).toBeTypeOf('function')
      expect(field.validableFactory).toBeTypeOf('function')
      expect(field.patternSchema).toBeDefined()
    })

    it('patternSchema accepts string patterns', () => {

      expect(field.patternSchema.safeParse('src/*').success).toBe(true)
      expect(field.patternSchema.safeParse('docs/*').success).toBe(true)
    })

    it('patternSchema rejects non-string values', () => {

      expect(field.patternSchema.safeParse(['src/*']).success).toBe(false)
      expect(field.patternSchema.safeParse(42).success).toBe(false)
    })

    it('buildSuggestion includes value and field name', () => {

      expect(field.buildSuggestion('src/foo.ts')).toContain('src/foo.ts')
      expect(field.buildSuggestion('src/foo.ts')).toContain('allow.path')
    })

    it('validableFactory without policies returns acceptAll', () => {

      const validable = field.validableFactory()

      expect(validable).toBe(acceptAll)
    })

    it('validableFactory with policies matches via glob', () => {

      const validable = field.validableFactory({ allow: ['src/*'] })

      expect(validable.validate('src/foo.ts')).toBe('src/*')
      expect(validable.validate('docs/bar.md')).toBeUndefined()
    })
  })

  describe('StringFieldDefinition', () => {

    it('normalizes object with name to Field', () => {

      const field = Field({ name: 'pattern' })

      expect(field.name).toBe('pattern')
      expect(field.buildSuggestion('TODO')).toContain('allow.pattern')
    })
  })

  describe('validation', () => {

    it('throws on empty string name', () => {

      expect(() => Field('')).toThrow('Field name must be a non-empty string')
    })

    it('throws on empty string name in object form', () => {

      expect(() => Field({ name: '' })).toThrow('Field name must be a non-empty string')
    })
  })

  describe('CustomFieldDefinition', () => {

    it('uses custom validableFactory and buildSuggestion', () => {

      const customFactory = (..._policies: Array<unknown>) => acceptAll
      const customSuggestion = (value: string) => `custom: ${value}`

      const field = Field({
        name: 'command',
        validableFactory: customFactory,
        buildSuggestion: customSuggestion,
        patternSchema: z.string(),
      })

      expect(field.name).toBe('command')
      expect(field.validableFactory).toBe(customFactory)
      expect(field.buildSuggestion('test')).toBe('custom: test')
    })

    it('passes through custom patternSchema directly', () => {

      const field = Field({
        name: 'command',
        validableFactory: () => acceptAll,
        buildSuggestion: () => '',
        patternSchema: z.number(),
      })

      expect(field.patternSchema.safeParse(42).success).toBe(true)
      expect(field.patternSchema.safeParse('not a number').success).toBe(false)
    })

    it('defaults patternSchema to z.string() when omitted', () => {

      const field = Field({
        name: 'command',
        validableFactory: () => acceptAll,
        buildSuggestion: () => '',
      })

      expect(field.patternSchema.safeParse('any string').success).toBe(true)
      expect(field.patternSchema.safeParse(42).success).toBe(false)
    })
  })
})
