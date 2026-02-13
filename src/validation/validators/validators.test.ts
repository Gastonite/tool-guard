/**
 * Tests for validators
 */

import { describe, it, expect } from 'vitest'
import { validateSafeBranch } from './safeBranch'
import { validateSafeCommitHash } from './safeCommitHash'
import { validateFilePath } from './safeFilePath'
import { validateSafeNumber } from './safeNumber'
import { validateSafePackage } from './safePackage'
import { validateSafeShortHash } from './safeShortHash'
import { validateSafeString } from './safeString'
import { validateSafeUrl } from './safeUrl'



describe('validateSafeString', () => {

  it('accepts valid quoted strings', () => {

    expect(validateSafeString('"hello world"')).toBe(true)
    expect(validateSafeString('"Hello, World!"')).toBe(true)
    expect(validateSafeString('"fix: bug #123"')).toBe(true)
    expect(validateSafeString('""')).toBe(true) // empty
    expect(validateSafeString('"line1\nline2"')).toBe(true) // newline
  })

  it('rejects unquoted strings', () => {

    expect(validateSafeString('hello')).toBe(false)
    expect(validateSafeString('\'hello\'')).toBe(false) // single quotes
    expect(validateSafeString('hello"')).toBe(false) // missing start quote
  })

  it('accepts safe punctuation inside quotes', () => {

    expect(validateSafeString('"; safe inside quotes"')).toBe(true) // semicolon is safe inside quotes
    expect(validateSafeString('"fix: update; refactor"')).toBe(true)
  })

  it('rejects dangerous characters', () => {

    expect(validateSafeString('"`whoami`"')).toBe(false) // backtick
    expect(validateSafeString('"$(id)"')).toBe(false) // command substitution
    expect(validateSafeString('"a | b"')).toBe(false) // pipe
    expect(validateSafeString('"a & b"')).toBe(false) // ampersand
    expect(validateSafeString('"a > b"')).toBe(false) // redirect
  })
})

describe('validateFilePath', () => {

  it('accepts valid file paths', () => {

    expect(validateFilePath('file.ts')).toBe(true)
    expect(validateFilePath('src/app.ts')).toBe(true)
    expect(validateFilePath('my-file_name.ts')).toBe(true)
    expect(validateFilePath('path/to/deep/file.tsx')).toBe(true)
    expect(validateFilePath('.gitignore')).toBe(true)
    expect(validateFilePath('file.test.ts')).toBe(true)
  })

  it('rejects invalid paths', () => {

    expect(validateFilePath('')).toBe(false) // empty
    expect(validateFilePath('my file.ts')).toBe(false) // space
    expect(validateFilePath('file;rm.ts')).toBe(false) // semicolon
    expect(validateFilePath('file`id`.ts')).toBe(false) // backtick
    expect(validateFilePath('file$(pwd).ts')).toBe(false) // command sub
    expect(validateFilePath('file|cat.ts')).toBe(false) // pipe
  })
})

describe('validateSafeNumber', () => {

  it('accepts valid numbers', () => {

    expect(validateSafeNumber('0')).toBe(true)
    expect(validateSafeNumber('42')).toBe(true)
    expect(validateSafeNumber('123456789')).toBe(true)
  })

  it('rejects invalid numbers', () => {

    expect(validateSafeNumber('')).toBe(false)
    expect(validateSafeNumber('-5')).toBe(false) // negative
    expect(validateSafeNumber('3.14')).toBe(false) // decimal
    expect(validateSafeNumber('42a')).toBe(false) // with letters
    expect(validateSafeNumber('1e10')).toBe(false) // scientific
  })
})

describe('validateSafeCommitHash', () => {

  it('accepts valid SHA-1 hashes', () => {

    expect(validateSafeCommitHash('a'.repeat(40))).toBe(true)
    expect(validateSafeCommitHash('0123456789abcdef0123456789abcdef01234567')).toBe(true)
  })

  it('rejects invalid hashes', () => {

    expect(validateSafeCommitHash('')).toBe(false)
    expect(validateSafeCommitHash('abc123')).toBe(false) // too short
    expect(validateSafeCommitHash('a'.repeat(41))).toBe(false) // too long
    expect(validateSafeCommitHash('g'.repeat(40))).toBe(false) // invalid char
    expect(validateSafeCommitHash('A'.repeat(40))).toBe(false) // uppercase
  })
})

describe('validateSafeShortHash', () => {

  it('accepts valid short hashes', () => {

    expect(validateSafeShortHash('abc1234')).toBe(true) // 7 chars
    expect(validateSafeShortHash('abc123def4')).toBe(true) // 10 chars
    expect(validateSafeShortHash('a'.repeat(40))).toBe(true) // full hash
  })

  it('rejects invalid short hashes', () => {

    expect(validateSafeShortHash('abc123')).toBe(false) // too short (6)
    expect(validateSafeShortHash('a'.repeat(41))).toBe(false) // too long
    expect(validateSafeShortHash('ghijklm')).toBe(false) // invalid chars
  })
})

describe('validateSafeBranch', () => {

  it('accepts valid branch names', () => {

    expect(validateSafeBranch('main')).toBe(true)
    expect(validateSafeBranch('develop')).toBe(true)
    expect(validateSafeBranch('feature/my-feature')).toBe(true)
    expect(validateSafeBranch('release/v1.0.0')).toBe(true)
    expect(validateSafeBranch('fix_bug_123')).toBe(true)
  })

  it('rejects invalid branch names', () => {

    expect(validateSafeBranch('')).toBe(false) // empty
    expect(validateSafeBranch('-malicious')).toBe(false) // starts with dash
    expect(validateSafeBranch('.hidden')).toBe(false) // starts with dot
    expect(validateSafeBranch('my branch')).toBe(false) // space
    expect(validateSafeBranch('branch;rm')).toBe(false) // semicolon
  })
})

describe('validateSafeUrl', () => {

  it('accepts valid URLs', () => {

    expect(validateSafeUrl('https://example.com')).toBe(true)
    expect(validateSafeUrl('http://localhost:3000')).toBe(true)
    expect(validateSafeUrl('https://api.github.com/repos/user/repo')).toBe(true)
  })

  it('rejects invalid URLs', () => {

    expect(validateSafeUrl('')).toBe(false)
    expect(validateSafeUrl('not-a-url')).toBe(false)
    expect(validateSafeUrl('file:///etc/passwd')).toBe(false) // file protocol
    expect(validateSafeUrl('ftp://example.com')).toBe(false) // ftp protocol
    expect(validateSafeUrl('https://user:pass@example.com')).toBe(false) // credentials
  })
})

describe('validateSafePackage', () => {

  it('accepts valid package names', () => {

    expect(validateSafePackage('lodash')).toBe(true)
    expect(validateSafePackage('my-package')).toBe(true)
    expect(validateSafePackage('@types/node')).toBe(true)
    expect(validateSafePackage('@scope/package')).toBe(true)
    expect(validateSafePackage('pkg@1.0.0')).toBe(true)
    expect(validateSafePackage('pkg@^1.0.0')).toBe(true)
  })

  it('rejects invalid package names', () => {

    expect(validateSafePackage('')).toBe(false)
    expect(validateSafePackage('UPPERCASE')).toBe(false)
    expect(validateSafePackage('pkg; rm -rf /')).toBe(false)
    expect(validateSafePackage('../../../etc/passwd')).toBe(false)
  })
})
