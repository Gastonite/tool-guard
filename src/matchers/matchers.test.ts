/**
 * Tests for pattern matchers
 */

import { describe, expect, it } from 'vitest'
import { matchPattern } from './matchers'
import { matchGlob } from './matchGlob'



describe('matchGlob', () => {

  it('matches exact strings', () => {

    expect(matchGlob('git status', 'git status')).toBe(true)
    expect(matchGlob('npm install', 'npm install')).toBe(true)
  })

  it('matches wildcards at end', () => {

    expect(matchGlob('git *', 'git status')).toBe(true)
    expect(matchGlob('git *', 'git log --oneline')).toBe(true)
    expect(matchGlob('npm *', 'git status')).toBe(false)
  })

  it('matches wildcards in middle', () => {

    expect(matchGlob('git * --all', 'git log --all')).toBe(true)
    expect(matchGlob('git * --all', 'git branch --all')).toBe(true)
  })

  it('matches multiple wildcards', () => {

    expect(matchGlob('* * *', 'a b c')).toBe(true)
    expect(matchGlob('git * *', 'git add file.ts')).toBe(true)
  })

  it('escapes special regex characters', () => {

    expect(matchGlob('file.ts', 'file.ts')).toBe(true)
    expect(matchGlob('file.ts', 'filexts')).toBe(false) // dot should be literal
    expect(matchGlob('[test]', '[test]')).toBe(true)
  })
})

describe('matchPattern', () => {

  describe('glob fallback (no placeholders)', () => {

    it('matches exact strings', () => {

      expect(matchPattern('git status', 'git status')).toBe(true)
      expect(matchPattern('npm install', 'npm install')).toBe(true)
    })

    it('matches wildcards', () => {

      expect(matchPattern('git *', 'git status')).toBe(true)
      expect(matchPattern('git *', 'git log --oneline')).toBe(true)
      expect(matchPattern('npm *', 'git status')).toBe(false)
    })

    it('matches file patterns', () => {

      expect(matchPattern('*.ts', 'app.ts')).toBe(true)
      expect(matchPattern('*.ts', 'app.js')).toBe(false)
      expect(matchPattern('src/*.ts', 'src/app.ts')).toBe(true)
    })
  })

  describe('extractorType (picomatch)', () => {

    it('uses picomatch when extractorType is filePath', () => {

      expect(matchPattern('src/**', 'src/deep/file.ts', 'filePath')).toBe(true)
      expect(matchPattern('src/**/*.ts', 'src/deep/nested/file.ts', 'filePath')).toBe(true)
    })

    it('uses picomatch when extractorType is directoryPath', () => {

      expect(matchPattern('src/**', 'src/deep', 'directoryPath')).toBe(true)
    })

    it('uses picomatch when extractorType is path', () => {

      expect(matchPattern('src/**', 'src/deep/file.ts', 'path')).toBe(true)
    })

    it('* does not cross / boundaries with extractorType', () => {

      expect(matchPattern('src/*', 'src/file.ts', 'filePath')).toBe(true)
      expect(matchPattern('src/*', 'src/deep/file.ts', 'filePath')).toBe(false)
    })

    it('* crosses / boundaries without extractorType (default glob)', () => {

      expect(matchPattern('src/*', 'src/deep/file.ts')).toBe(true)
    })

    it('rejects path traversal with extractorType', () => {

      expect(matchPattern('**', '../etc/passwd', 'filePath')).toBe(false)
    })

    it('rejects absolute paths with extractorType', () => {

      expect(matchPattern('**', '/etc/hosts', 'filePath')).toBe(false)
    })

    it('ignores SAFE_* placeholders with extractorType', () => {

      expect(matchPattern('SAFE_INTERNAL_FILE_PATH', 'src/file.ts', 'filePath')).toBe(false)
    })
  })

  describe('SAFE_STRING', () => {

    it('matches valid quoted strings', () => {

      expect(matchPattern('git commit -m SAFE_STRING', 'git commit -m "fix bug"')).toBe(true)
      expect(matchPattern('echo SAFE_STRING', 'echo "hello world"')).toBe(true)
    })

    it('rejects unquoted strings', () => {

      expect(matchPattern('git commit -m SAFE_STRING', 'git commit -m fix bug')).toBe(false)
    })

    it('rejects dangerous characters (backticks, $, etc)', () => {

      expect(matchPattern('echo SAFE_STRING', 'echo "`whoami`"')).toBe(false)
      expect(matchPattern('echo SAFE_STRING', 'echo "$(id)"')).toBe(false)
    })
  })

  describe('SAFE_FILE_PATH', () => {

    it('matches valid file paths', () => {

      expect(matchPattern('cat SAFE_FILE_PATH', 'cat src/app.ts')).toBe(true)
      expect(matchPattern('rm SAFE_FILE_PATH', 'rm old-file.txt')).toBe(true)
    })

    it('rejects paths with dangerous chars', () => {

      expect(matchPattern('cat SAFE_FILE_PATH', 'cat file; rm -rf /')).toBe(false)
      expect(matchPattern('cat SAFE_FILE_PATH', 'cat file`id`')).toBe(false)
    })
  })

  describe('...SAFE_FILE_PATH (spread)', () => {

    it('matches multiple file paths', () => {

      expect(matchPattern('git add ...SAFE_FILE_PATH', 'git add src/a.ts src/b.ts')).toBe(true)
      expect(matchPattern('git add ...SAFE_FILE_PATH', 'git add file.ts')).toBe(true)
    })

    it('rejects if any path is invalid', () => {

      expect(matchPattern('git add ...SAFE_FILE_PATH', 'git add good.ts bad;file.ts')).toBe(false)
    })
  })

  describe('multiple SAFE_FILE_PATH', () => {

    it('matches multiple file paths', () => {

      expect(matchPattern('git diff SAFE_FILE_PATH SAFE_FILE_PATH', 'git diff src/a.ts src/b.ts')).toBe(true)
      expect(matchPattern('cp SAFE_FILE_PATH SAFE_FILE_PATH', 'cp old.ts new.ts')).toBe(true)
    })

    it('rejects if any path is invalid', () => {

      expect(matchPattern('cp SAFE_FILE_PATH SAFE_FILE_PATH', 'cp good.ts bad;file.ts')).toBe(false)
    })
  })

  describe('SAFE_COMMIT_HASH', () => {

    it('matches valid commit hashes', () => {

      const hash = 'a'.repeat(40)
      expect(matchPattern('git show SAFE_COMMIT_HASH', `git show ${hash}`)).toBe(true)
    })

    it('matches multiple commit hashes', () => {

      const hash1 = 'a'.repeat(40)
      const hash2 = 'b'.repeat(40)
      expect(matchPattern('git diff SAFE_COMMIT_HASH..SAFE_COMMIT_HASH', `git diff ${hash1}..${hash2}`)).toBe(true)
    })

    it('rejects invalid hashes', () => {

      expect(matchPattern('git show SAFE_COMMIT_HASH', 'git show abc123')).toBe(false)
    })
  })

  describe('SAFE_NUMBER', () => {

    it('matches valid numbers', () => {

      expect(matchPattern('head -n SAFE_NUMBER', 'head -n 10')).toBe(true)
      expect(matchPattern('tail -n SAFE_NUMBER', 'tail -n 100')).toBe(true)
    })

    it('matches with suffix', () => {

      expect(matchPattern('head -n SAFE_NUMBER file.txt', 'head -n 10 file.txt')).toBe(true)
    })

    it('matches multiple numbers', () => {

      expect(matchPattern('seq SAFE_NUMBER SAFE_NUMBER', 'seq 1 10')).toBe(true)
    })

    it('rejects invalid numbers', () => {

      expect(matchPattern('head -n SAFE_NUMBER', 'head -n -5')).toBe(false)
      expect(matchPattern('head -n SAFE_NUMBER', 'head -n abc')).toBe(false)
    })
  })

  describe('SAFE_BRANCH', () => {

    it('matches valid branch names', () => {

      expect(matchPattern('git checkout SAFE_BRANCH', 'git checkout main')).toBe(true)
      expect(matchPattern('git checkout SAFE_BRANCH', 'git checkout feature/new')).toBe(true)
    })

    it('matches with suffix', () => {

      expect(matchPattern('git checkout SAFE_BRANCH --force', 'git checkout main --force')).toBe(true)
    })

    it('matches multiple branches', () => {

      expect(matchPattern('git merge SAFE_BRANCH --into SAFE_BRANCH', 'git merge feature --into main')).toBe(true)
    })

    it('rejects dangerous branch names', () => {

      expect(matchPattern('git checkout SAFE_BRANCH', 'git checkout -b malicious')).toBe(false)
      expect(matchPattern('git checkout SAFE_BRANCH', 'git checkout ; rm -rf /')).toBe(false)
    })
  })

  describe('mixed placeholders', () => {

    it('matches different placeholder types in same pattern', () => {

      expect(matchPattern(
        'git commit -m SAFE_STRING -- SAFE_FILE_PATH',
        'git commit -m "fix bug" -- src/app.ts',
      )).toBe(true)
    })

    it('matches string then number', () => {

      expect(matchPattern(
        'echo SAFE_STRING | head -n SAFE_NUMBER',
        'echo "hello" | head -n 5',
      )).toBe(true)
    })

    it('rejects if any placeholder is invalid', () => {

      expect(matchPattern(
        'git commit -m SAFE_STRING -- SAFE_FILE_PATH',
        'git commit -m "fix" -- bad;file.ts',
      )).toBe(false)
    })
  })
})
