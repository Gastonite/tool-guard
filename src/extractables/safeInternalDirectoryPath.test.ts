import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { safeInternalDirectoryPath } from './safeInternalDirectoryPath'



describe('safeInternalDirectoryPath', () => {

  describe('validate (no policies)', () => {

    it('accepts internal directory path', () => {

      expect(safeInternalDirectoryPath.validate('src')).toBe(acceptAllSymbol)
    })

    it('accepts empty string (type: directory)', () => {

      expect(safeInternalDirectoryPath.validate('')).toBe(acceptAllSymbol)
    })

    it('rejects external path', () => {

      expect(safeInternalDirectoryPath.validate('/etc')).toBeUndefined()
    })
  })
})
