import { describe, expect, it } from 'vitest'
import { matchGlobPattern } from './globPolicyEvaluator'



describe('matchGlobPattern', () => {

  it('matches exact strings', () => {

    expect(matchGlobPattern('git status', 'git status')).toBe(true)
    expect(matchGlobPattern('npm install', 'npm install')).toBe(true)
  })

  it('matches wildcards at end', () => {

    expect(matchGlobPattern('git *', 'git status')).toBe(true)
    expect(matchGlobPattern('git *', 'git log --oneline')).toBe(true)
    expect(matchGlobPattern('npm *', 'git status')).toBe(false)
  })

  it('matches wildcards in middle', () => {

    expect(matchGlobPattern('git * --all', 'git log --all')).toBe(true)
    expect(matchGlobPattern('git * --all', 'git branch --all')).toBe(true)
  })

  it('matches multiple wildcards', () => {

    expect(matchGlobPattern('* * *', 'a b c')).toBe(true)
    expect(matchGlobPattern('git * *', 'git add file.ts')).toBe(true)
  })

  it('escapes special regex characters', () => {

    expect(matchGlobPattern('file.ts', 'file.ts')).toBe(true)
    expect(matchGlobPattern('file.ts', 'filexts')).toBe(false)
    expect(matchGlobPattern('[test]', '[test]')).toBe(true)
  })

  it('matches wildcard-only pattern', () => {

    expect(matchGlobPattern('*', 'anything')).toBe(true)
  })

  it('matches empty pattern against empty value', () => {

    expect(matchGlobPattern('', '')).toBe(true)
  })

  it('does not match empty pattern against non-empty value', () => {

    expect(matchGlobPattern('', 'hello')).toBe(false)
  })

  it('handles a*a pattern requiring at least three characters (OneOrMany)', () => {

    expect(matchGlobPattern('a*a', 'aa')).toBe(false)
    expect(matchGlobPattern('a*a', 'a')).toBe(false)
    expect(matchGlobPattern('a*a', 'aba')).toBe(true)
  })

  it('handles *a* pattern (each wildcard consumes 1+ char)', () => {

    expect(matchGlobPattern('*a*', 'a')).toBe(false)
    expect(matchGlobPattern('*a*', 'bab')).toBe(true)
    expect(matchGlobPattern('*a*', 'bbb')).toBe(false)
  })

  it('handles multiple adjacent wildcards (collapsed to single OneOrMany)', () => {

    expect(matchGlobPattern('a**b', 'ab')).toBe(false)
    expect(matchGlobPattern('a**b', 'aXb')).toBe(true)
    expect(matchGlobPattern('a**b', 'aXXb')).toBe(true)
  })

  it('handles pattern with only wildcards (OneOrMany)', () => {

    expect(matchGlobPattern('*', '')).toBe(false)
    expect(matchGlobPattern('*', 'anything')).toBe(true)
    expect(matchGlobPattern('**', '')).toBe(false)
    expect(matchGlobPattern('**', 'anything')).toBe(true)
  })

  it('does not match when wildcard would consume zero characters (OneOrMany)', () => {

    expect(matchGlobPattern('*', '')).toBe(false)
    expect(matchGlobPattern('**', '')).toBe(false)
    expect(matchGlobPattern('a*', 'a')).toBe(false)
    expect(matchGlobPattern('*a', 'a')).toBe(false)
    expect(matchGlobPattern('a*a', 'aa')).toBe(false)
  })
})
