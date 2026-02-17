import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { safeExternalFilePath } from './safeExternalFilePath'



describe('safeExternalFilePath', () => {

  describe('validate (no policies)', () => {

    it('rejects internal path (scope: external)', () => {

      expect(safeExternalFilePath.validate('src/app.ts')).toBeUndefined()
    })

    it('accepts external path', () => {

      expect(safeExternalFilePath.validate('/etc/hosts')).toBe(acceptAllSymbol)
    })

    it('rejects empty string (type: file)', () => {

      expect(safeExternalFilePath.validate('')).toBeUndefined()
    })
  })
})
