import { describe, expect, it } from 'vitest'
import { extractorsSchema } from './guard'
import { policyInputSchema, simplePolicyDefinitionSchema } from './policy'
import { patternSchema } from './rule'



describe('extractorsSchema', () => {

  describe('array mode', () => {

    it('accepts non-empty array of strings', () => {

      expect(extractorsSchema.safeParse(['path']).success).toBe(true)
      expect(extractorsSchema.safeParse(['path', 'pattern']).success).toBe(true)
    })

    it('rejects empty array', () => {

      const result = extractorsSchema.safeParse([])
      expect(result.success).toBe(false)
    })

    it('rejects array with empty strings', () => {

      expect(extractorsSchema.safeParse(['']).success).toBe(false)
      expect(extractorsSchema.safeParse(['path', '']).success).toBe(false)
    })
  })

  describe('invalid types', () => {

    it('rejects string (must be array)', () => {

      expect(extractorsSchema.safeParse('path').success).toBe(false)
    })

    it('rejects number', () => {

      expect(extractorsSchema.safeParse(123).success).toBe(false)
    })

    it('rejects null', () => {

      // eslint-disable-next-line no-restricted-syntax -- testing null
      expect(extractorsSchema.safeParse(null).success).toBe(false)
    })

    it('rejects undefined', () => {

      expect(extractorsSchema.safeParse(undefined).success).toBe(false)
    })

    it('rejects object', () => {

      expect(extractorsSchema.safeParse({ key: 'value' }).success).toBe(false)
    })
  })
})


describe('patternSchema', () => {

  describe('single pattern (string)', () => {

    it('accepts non-empty string', () => {

      expect(patternSchema.safeParse('src/*').success).toBe(true)
      expect(patternSchema.safeParse('*').success).toBe(true)
    })

    it('rejects empty string', () => {

      expect(patternSchema.safeParse('').success).toBe(false)
    })
  })

  describe('multiple patterns (array)', () => {

    it('accepts non-empty array', () => {

      expect(patternSchema.safeParse(['src/*']).success).toBe(true)
      expect(patternSchema.safeParse(['src/*', 'docs/*']).success).toBe(true)
    })

    it('accepts empty array (fail-safe: denies all)', () => {

      // Empty array is valid - it means "allow nothing" which is safe
      expect(patternSchema.safeParse([]).success).toBe(true)
    })

    it('rejects array with empty strings', () => {

      expect(patternSchema.safeParse(['']).success).toBe(false)
      expect(patternSchema.safeParse(['src/*', '']).success).toBe(false)
    })
  })
})


describe('simplePolicyDefinitionSchema', () => {

  describe('allow only', () => {

    it('accepts string pattern', () => {

      expect(simplePolicyDefinitionSchema.safeParse({ allow: 'src/*' }).success).toBe(true)
    })

    it('accepts array of patterns', () => {

      expect(simplePolicyDefinitionSchema.safeParse({ allow: ['src/*', 'docs/*'] }).success).toBe(true)
    })
  })

  describe('allow and deny', () => {

    it('accepts string patterns', () => {

      const config = { allow: 'src/*', deny: '*secret*' }
      expect(simplePolicyDefinitionSchema.safeParse(config).success).toBe(true)
    })

    it('accepts array patterns', () => {

      const config = { allow: ['src/*'], deny: ['*.env'] }
      expect(simplePolicyDefinitionSchema.safeParse(config).success).toBe(true)
    })
  })

  describe('validation', () => {

    it('rejects empty allow string', () => {

      expect(simplePolicyDefinitionSchema.safeParse({ allow: '' }).success).toBe(false)
    })

    it('accepts empty allow array (fail-safe)', () => {

      // Empty array means "allow nothing" - this is safe behavior
      expect(simplePolicyDefinitionSchema.safeParse({ allow: [] }).success).toBe(true)
    })

    it('rejects empty deny string', () => {

      const config = { allow: 'src/*', deny: '' }
      expect(simplePolicyDefinitionSchema.safeParse(config).success).toBe(false)
    })
  })
})


describe('policyInputSchema', () => {

  describe('wildcard', () => {

    it('accepts "*"', () => {

      expect(policyInputSchema.safeParse('*').success).toBe(true)
    })
  })

  describe('single rule', () => {

    it('accepts rule object', () => {

      expect(policyInputSchema.safeParse({ path: 'src/*' }).success).toBe(true)
      expect(policyInputSchema.safeParse({ pattern: 'TODO', path: 'src/*' }).success).toBe(true)
    })
  })

  describe('array of rules', () => {

    it('accepts non-empty array', () => {

      const rules = [{ path: 'src/*' }, { pattern: 'TODO' }]
      expect(policyInputSchema.safeParse(rules).success).toBe(true)
    })

    it('rejects empty array', () => {

      expect(policyInputSchema.safeParse([]).success).toBe(false)
    })
  })

  describe('PolicyConfig', () => {

    it('accepts allow only', () => {

      expect(policyInputSchema.safeParse({ allow: '*' }).success).toBe(true)
      expect(policyInputSchema.safeParse({ allow: { path: 'src/*' } }).success).toBe(true)
    })

    it('accepts allow and deny', () => {

      const config = {
        allow: { pattern: '*', path: 'src/*' },
        deny: { pattern: 'password' },
      }
      expect(policyInputSchema.safeParse(config).success).toBe(true)
    })
  })
})
