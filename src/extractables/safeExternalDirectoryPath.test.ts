import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { safeExternalDirectoryPath } from './safeExternalDirectoryPath'



describe('safeExternalDirectoryPath', () => {

  describe('validate (no policies)', () => {

    it('rejects internal path (scope: external)', () => {

      expect(safeExternalDirectoryPath.validate('src')).toBeUndefined()
    })

    it('accepts external directory path', () => {

      expect(safeExternalDirectoryPath.validate('/etc')).toBe(acceptAllSymbol)
    })

    it('accepts empty string (type: directory, external allows empty)', () => {

      expect(safeExternalDirectoryPath.validate('')).toBe(acceptAllSymbol)
    })
  })
})
