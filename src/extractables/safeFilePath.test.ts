import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { SafeFilePath, safeFilePath } from './safeFilePath'



describe('safeFilePath', () => {

  describe('extract', () => {

    it('consumes path characters', () => {

      expect(safeFilePath.extract('src/app.ts')).toBe(10)
    })

    it('stops at space', () => {

      expect(safeFilePath.extract('src/app.ts rest')).toBe(10)
    })

    it('stops at non-path character', () => {

      expect(safeFilePath.extract('src/app$ts')).toBe(7)
    })

    it('returns false on empty string', () => {

      expect(safeFilePath.extract('')).toBe(false)
    })
  })

  describe('validate (no policies)', () => {

    it('accepts internal file path', () => {

      expect(safeFilePath.validate('src/app.ts')).toBe(acceptAllSymbol)
    })

    it('rejects external path', () => {

      expect(safeFilePath.validate('/etc/passwd')).toBeUndefined()
    })

    it('rejects empty string (type: file)', () => {

      expect(safeFilePath.validate('')).toBeUndefined()
    })

    it('rejects path traversal', () => {

      expect(safeFilePath.validate('../secret')).toBeUndefined()
    })
  })

  describe('SafeFilePath with policies', () => {

    it('matches allow pattern', () => {

      const instance = SafeFilePath({ allow: ['src/**'] })

      expect(instance.validate('src/app.ts')).toBe('src/**')
    })

    it('rejects when no allow pattern matches', () => {

      const instance = SafeFilePath({ allow: ['src/**'] })

      expect(instance.validate('docs/guide.md')).toBeUndefined()
    })

    it('deny overrides allow', () => {

      const instance = SafeFilePath({ allow: ['**'], deny: ['**/.env'] })

      expect(instance.validate('src/app.ts')).toBe('**')
      expect(instance.validate('.env')).toBeUndefined()
    })

    it('supports external: prefix', () => {

      const instance = SafeFilePath({ allow: ['src/**', 'external:/etc/hosts'] })

      expect(instance.validate('/etc/hosts')).toBe('/etc/hosts')
      expect(instance.validate('/etc/shadow')).toBeUndefined()
    })
  })
})
