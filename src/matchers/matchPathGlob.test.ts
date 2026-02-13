/**
 * Tests for matchPathGlob — picomatch with built-in path security
 */

import { describe, expect, it } from 'vitest'
import { matchPathGlob } from './matchPathGlob'



describe('matchPathGlob', () => {

  describe('built-in security (internal paths)', () => {

    it('rejects path traversal', () => {

      expect(matchPathGlob('**', '../etc/passwd', 'filePath')).toBe(false)
      expect(matchPathGlob('**', '../../secret', 'filePath')).toBe(false)
      expect(matchPathGlob('**', 'src/../../etc/passwd', 'filePath')).toBe(false)
    })

    it('rejects absolute paths', () => {

      expect(matchPathGlob('**', '/etc/hosts', 'filePath')).toBe(false)
      expect(matchPathGlob('**', '/usr/bin/node', 'filePath')).toBe(false)
    })

    it('accepts valid internal paths', () => {

      expect(matchPathGlob('**', 'src/app.ts', 'filePath')).toBe(true)
      expect(matchPathGlob('**', 'package.json', 'filePath')).toBe(true)
      expect(matchPathGlob('**', 'src/deep/nested/file.ts', 'filePath')).toBe(true)
    })
  })

  describe('empty value handling per extractor type', () => {

    it('filePath rejects empty (a file must have a name)', () => {

      expect(matchPathGlob('*', '', 'filePath')).toBe(false)
      expect(matchPathGlob('**', '', 'filePath')).toBe(false)
    })

    it('directoryPath matches empty with * or **', () => {

      expect(matchPathGlob('*', '', 'directoryPath')).toBe(true)
      expect(matchPathGlob('**', '', 'directoryPath')).toBe(true)
    })

    it('directoryPath rejects empty with specific patterns', () => {

      expect(matchPathGlob('src/*', '', 'directoryPath')).toBe(false)
      expect(matchPathGlob('src/**', '', 'directoryPath')).toBe(false)
      expect(matchPathGlob('**/*.ts', '', 'directoryPath')).toBe(false)
    })

    it('path matches empty with * or **', () => {

      expect(matchPathGlob('*', '', 'path')).toBe(true)
      expect(matchPathGlob('**', '', 'path')).toBe(true)
    })

    it('path rejects empty with specific patterns', () => {

      expect(matchPathGlob('src/*', '', 'path')).toBe(false)
      expect(matchPathGlob('**/*.ts', '', 'path')).toBe(false)
    })
  })

  describe('glob semantics (* vs **)', () => {

    it('* matches single level only', () => {

      expect(matchPathGlob('src/*', 'src/file.ts', 'filePath')).toBe(true)
      expect(matchPathGlob('src/*', 'src/deep/file.ts', 'filePath')).toBe(false)
    })

    it('** matches across / boundaries', () => {

      expect(matchPathGlob('src/**', 'src/file.ts', 'filePath')).toBe(true)
      expect(matchPathGlob('src/**', 'src/deep/file.ts', 'filePath')).toBe(true)
      expect(matchPathGlob('src/**', 'src/deep/nested/file.ts', 'filePath')).toBe(true)
    })

    it('**/*.ext matches nested files with extension', () => {

      expect(matchPathGlob('src/**/*.ts', 'src/app.ts', 'filePath')).toBe(true)
      expect(matchPathGlob('src/**/*.ts', 'src/deep/nested/file.ts', 'filePath')).toBe(true)
      expect(matchPathGlob('src/**/*.ts', 'src/file.js', 'filePath')).toBe(false)
    })
  })

  describe('dotfiles', () => {

    it('matches dotfiles with dot: true', () => {

      expect(matchPathGlob('*', '.env', 'filePath')).toBe(true)
      expect(matchPathGlob('**/.env', 'src/.env', 'filePath')).toBe(true)
    })
  })

  describe('internal path normalization', () => {

    it('normalizes absolute value to relative before matching', () => {

      const projectPath = process.cwd()

      expect(matchPathGlob('src/**', `${projectPath}/src/app.ts`, 'filePath')).toBe(true)
      expect(matchPathGlob('src/*', `${projectPath}/src/app.ts`, 'filePath')).toBe(true)
      expect(matchPathGlob('src/*', `${projectPath}/src/deep/file.ts`, 'filePath')).toBe(false)
    })

    it('normalizes absolute pattern to relative before matching', () => {

      const projectPath = process.cwd()

      expect(matchPathGlob(`${projectPath}/src/**`, 'src/app.ts', 'filePath')).toBe(true)
      expect(matchPathGlob(`${projectPath}/src/*`, 'src/deep/file.ts', 'filePath')).toBe(false)
    })

    it('matches when both pattern and value are absolute', () => {

      const projectPath = process.cwd()

      expect(matchPathGlob(`${projectPath}/src/**`, `${projectPath}/src/app.ts`, 'filePath')).toBe(true)
    })
  })

  describe('external: prefix', () => {

    it('matches absolute paths with absolute pattern', () => {

      expect(matchPathGlob('external:/etc/**', '/etc/hosts', 'filePath')).toBe(true)
      expect(matchPathGlob('external:/usr/bin/*', '/usr/bin/node', 'filePath')).toBe(true)
    })

    it('matches traversal value with traversal pattern', () => {

      expect(matchPathGlob('external:../drive/**', '../drive/file.txt', 'filePath')).toBe(true)
    })

    it('matches traversal value with absolute pattern', () => {

      const projectPath = process.cwd()
      const parentDir = projectPath.slice(0, projectPath.lastIndexOf('/'))

      expect(matchPathGlob(`external:${parentDir}/**`, '../file.txt', 'filePath')).toBe(true)
    })

    it('matches absolute value with traversal pattern', () => {

      const projectPath = process.cwd()
      const parentDir = projectPath.slice(0, projectPath.lastIndexOf('/'))

      expect(matchPathGlob('external:../**', `${parentDir}/file.txt`, 'filePath')).toBe(true)
    })

    it('rejects internal paths with external: prefix', () => {

      expect(matchPathGlob('external:/etc/**', 'src/file.ts', 'filePath')).toBe(false)
    })

    it('rejects absolute paths without external: prefix', () => {

      expect(matchPathGlob('/etc/**', '/etc/hosts', 'filePath')).toBe(false)
    })
  })
})
