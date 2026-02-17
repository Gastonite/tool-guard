import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { SafeDirectoryPath, safeDirectoryPath } from './safeDirectoryPath'



describe('safeDirectoryPath', () => {

  describe('extract', () => {

    it('consumes path characters', () => {

      expect(safeDirectoryPath.extract('src/components')).toBe(14)
    })

    it('returns false on empty string', () => {

      expect(safeDirectoryPath.extract('')).toBe(false)
    })
  })

  describe('validate (no policies)', () => {

    it('accepts internal directory path', () => {

      expect(safeDirectoryPath.validate('src/components')).toBe(acceptAllSymbol)
    })

    it('accepts empty string (type: directory)', () => {

      expect(safeDirectoryPath.validate('')).toBe(acceptAllSymbol)
    })

    it('rejects external path', () => {

      expect(safeDirectoryPath.validate('/etc')).toBeUndefined()
    })

    it('rejects path traversal', () => {

      expect(safeDirectoryPath.validate('../parent')).toBeUndefined()
    })
  })

  describe('SafeDirectoryPath with policies', () => {

    it('matches allow pattern', () => {

      const instance = SafeDirectoryPath(['src/**'])

      expect(instance.validate('src/components')).toBe('src/**')
    })

    it('rejects when no allow pattern matches', () => {

      const instance = SafeDirectoryPath(['src/**'])

      expect(instance.validate('docs')).toBeUndefined()
    })
  })
})
