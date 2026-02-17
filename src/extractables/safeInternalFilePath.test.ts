import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { safeInternalFilePath } from './safeInternalFilePath'



describe('safeInternalFilePath', () => {

  describe('validate (no policies)', () => {

    it('accepts internal file path', () => {

      expect(safeInternalFilePath.validate('src/app.ts')).toBe(acceptAllSymbol)
    })

    it('rejects external path', () => {

      expect(safeInternalFilePath.validate('/etc/passwd')).toBeUndefined()
    })

    it('rejects empty string (type: file)', () => {

      expect(safeInternalFilePath.validate('')).toBeUndefined()
    })

    it('rejects path traversal', () => {

      expect(safeInternalFilePath.validate('../secret')).toBeUndefined()
    })
  })
})
