import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { safeExternalPath } from './safeExternalPath'



describe('safeExternalPath', () => {

  describe('validate (no policies)', () => {

    it('rejects internal path', () => {

      expect(safeExternalPath.validate('src/app.ts')).toBeUndefined()
    })

    it('accepts external path', () => {

      expect(safeExternalPath.validate('/etc/hosts')).toBe(acceptAllSymbol)
    })
  })
})
