import { describe, expect, it } from 'vitest'
import { toolGuardsSchema, toolGuardSchema } from './config'



describe('toolGuardSchema', () => {

  describe('boolean', () => {

    it('accepts true', () => {

      expect(toolGuardSchema.safeParse(true).success).toBe(true)
    })

    it('accepts false', () => {

      expect(toolGuardSchema.safeParse(false).success).toBe(true)
    })
  })

  describe('function', () => {

    it('accepts function', () => {

      const policy = () => ({ allowed: true })
      expect(toolGuardSchema.safeParse(policy).success).toBe(true)
    })

    it('accepts arrow function', () => {

      expect(toolGuardSchema.safeParse(() => true).success).toBe(true)
    })
  })

  describe('invalid types', () => {

    it('rejects string', () => {

      expect(toolGuardSchema.safeParse('allow').success).toBe(false)
    })

    it('rejects number', () => {

      expect(toolGuardSchema.safeParse(123).success).toBe(false)
    })

    it('rejects null', () => {

      // eslint-disable-next-line no-restricted-syntax -- testing null
      expect(toolGuardSchema.safeParse(null).success).toBe(false)
    })

    it('rejects object', () => {

      expect(toolGuardSchema.safeParse({ allow: true }).success).toBe(false)
    })
  })
})


describe('toolGuardsSchema', () => {

  it('accepts empty object', () => {

    expect(toolGuardsSchema.safeParse({}).success).toBe(true)
  })

  it('accepts boolean policies', () => {

    const config = { Read: true, Write: false }
    expect(toolGuardsSchema.safeParse(config).success).toBe(true)
  })

  it('accepts function policies', () => {

    const config = {
      Read: () => ({ allowed: true }),
      Write: () => ({ allowed: false, reason: 'denied', suggestion: 'ask' }),
    }
    expect(toolGuardsSchema.safeParse(config).success).toBe(true)
  })

  it('accepts mixed policies', () => {

    const config = {
      Read: true,
      Write: false,
      Bash: () => ({ allowed: true }),
    }
    expect(toolGuardsSchema.safeParse(config).success).toBe(true)
  })

  it('rejects invalid policy values', () => {

    const config = { Read: 'allow' }
    expect(toolGuardsSchema.safeParse(config).success).toBe(false)
  })
})
