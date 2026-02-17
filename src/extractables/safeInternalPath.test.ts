import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { safeInternalPath } from './safeInternalPath'



describe('safeInternalPath', () => {

  describe('validate (no policies)', () => {

    it('accepts internal path', () => {

      expect(safeInternalPath.validate('src/app.ts')).toBe(acceptAllSymbol)
    })

    it('accepts empty string', () => {

      expect(safeInternalPath.validate('')).toBe(acceptAllSymbol)
    })

    it('rejects external path', () => {

      expect(safeInternalPath.validate('/etc/passwd')).toBeUndefined()
    })
  })
})
