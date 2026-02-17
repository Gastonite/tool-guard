import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { SafePath, safePath } from './safePath'



describe('safePath', () => {

  describe('validate (no policies)', () => {

    it('accepts internal file path', () => {

      expect(safePath.validate('src/app.ts')).toBe(acceptAllSymbol)
    })

    it('accepts empty string (no type restriction)', () => {

      expect(safePath.validate('')).toBe(acceptAllSymbol)
    })

    it('rejects external path', () => {

      expect(safePath.validate('/etc/passwd')).toBeUndefined()
    })
  })

  describe('SafePath with policies', () => {

    it('matches allow pattern', () => {

      const instance = SafePath(['src/**'])

      expect(instance.validate('src/app.ts')).toBe('src/**')
    })

    it('supports external: prefix', () => {

      const instance = SafePath(['external:/tmp/**'])

      expect(instance.validate('/tmp/file.txt')).toBe('/tmp/**')
    })
  })
})
