import { describe, expect, it } from 'vitest'
import { command, CommandValidable, isCommandPattern, splitComposedCommand, spread } from './command'
import { greedy } from './extractables/greedy'
import { safeBranch } from './extractables/safeBranch'
import { safeFilePath } from './extractables/safeFilePath'
import { safeNumber } from './extractables/safeNumber'
import { acceptAllSymbol } from './policyEvaluator'



describe('command (tagged template)', () => {

  it('creates a CommandPattern with segments and extractors', () => {

    const pattern = command`git checkout ${safeBranch}`

    expect(pattern.kind).toBe('CommandPattern')
    expect(pattern.segments).toEqual(['git checkout ', ''])
    expect(pattern.extractors).toHaveLength(1)
  })

  it('creates a CommandPattern without extractors (fixed command)', () => {

    const pattern = command`git status`

    expect(pattern.kind).toBe('CommandPattern')
    expect(pattern.segments).toEqual(['git status'])
    expect(pattern.extractors).toHaveLength(0)
  })

  it('rejects composition operator && in a segment', () => {

    expect(() => command`git status && git log`).toThrow('&&')
  })

  it('rejects composition operator || in a segment', () => {

    expect(() => command`git status || echo fail`).toThrow('||')
  })

  it('rejects composition operator | in a segment', () => {

    expect(() => command`git log | head`).toThrow('|')
  })

  it('rejects composition operator ; in a segment', () => {

    expect(() => command`git status; rm -rf /`).toThrow(';')
  })

  it('rejects dangerous pattern $( in a segment', () => {

    expect(() => command`echo $(whoami)`).toThrow('$(')
  })
})


describe('isCommandPattern', () => {

  it('returns true for a valid CommandPattern', () => {

    const pattern = command`git status`

    expect(isCommandPattern(pattern)).toBe(true)
  })

  it('returns false for a plain object', () => {

    expect(isCommandPattern({ segments: [], extractors: [] })).toBe(false)
  })

  it('returns false for a string', () => {

    expect(isCommandPattern('git status')).toBe(false)
  })

  it('returns false for undefined', () => {

    expect(isCommandPattern(undefined)).toBe(false)
  })
})


describe('spread', () => {

  const spreadable = spread(safeFilePath)

  it('preserves extract and validate from the original', () => {

    expect(spreadable.extract).toBeTypeOf('function')
    expect(spreadable.validate).toBeTypeOf('function')
  })
})


describe('splitComposedCommand', () => {

  it('splits by &&', () => {

    expect(splitComposedCommand('git add . && git commit')).toEqual(['git add .', 'git commit'])
  })

  it('splits by ||', () => {

    expect(splitComposedCommand('git pull || echo fail')).toEqual(['git pull', 'echo fail'])
  })

  it('splits by |', () => {

    expect(splitComposedCommand('git log | head')).toEqual(['git log', 'head'])
  })

  it('splits by ;', () => {

    expect(splitComposedCommand('echo a; echo b')).toEqual(['echo a', 'echo b'])
  })

  it('splits by mixed operators', () => {

    expect(splitComposedCommand('a && b || c; d | e')).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('respects double quotes (does not split inside)', () => {

    expect(splitComposedCommand('echo "a && b"')).toEqual(['echo "a && b"'])
  })

  it('respects single quotes (does not split inside)', () => {

    expect(splitComposedCommand(`echo 'a | b'`)).toEqual([`echo 'a | b'`])
  })

  it('respects backticks (does not split inside)', () => {

    expect(splitComposedCommand('echo `cmd | other`')).toEqual(['echo `cmd | other`'])
  })

  it('respects backticks with && inside', () => {

    expect(splitComposedCommand('echo `a && b` && c')).toEqual(['echo `a && b`', 'c'])
  })

  it('handles double quotes inside single quotes', () => {

    expect(splitComposedCommand(`echo '"a && b"'`)).toEqual([`echo '"a && b"'`])
  })

  it('handles escaped double quotes', () => {

    expect(splitComposedCommand('echo \\"a && b')).toEqual(['echo \\"a', 'b'])
  })

  it('trims parts', () => {

    expect(splitComposedCommand('  a  &&  b  ')).toEqual(['a', 'b'])
  })

  it('returns empty array for empty string', () => {

    expect(splitComposedCommand('')).toEqual([])
  })

  it('returns single element for simple command', () => {

    expect(splitComposedCommand('git status')).toEqual(['git status'])
  })

  it('does not split by newline', () => {

    expect(splitComposedCommand('git status\nrm -rf /')).toEqual(['git status\nrm -rf /'])
  })

  it('handles && followed by & correctly', () => {

    expect(splitComposedCommand('a && b & c')).toEqual(['a', 'b & c'])
  })

  it('excludes empty parts from splitting', () => {

    expect(splitComposedCommand('a && && b')).toEqual(['a', 'b'])
  })

  it('preserves newlines (not a split operator)', () => {

    expect(splitComposedCommand('a\n\nb\n')).toEqual(['a\n\nb'])
  })

  it('splits on quote after even backslashes', () => {

    // Real string: echo "hello\\" && rm
    // The " after \\ (2 backslashes, even) is a real closing quote
    expect(splitComposedCommand('echo "hello\\\\" && rm')).toEqual(['echo "hello\\\\"', 'rm'])
  })

  it('does not split on quote after odd backslashes', () => {

    // Real string: echo "hello\\\" && rm"
    // The first " after \\\ (3 backslashes, odd) is escaped → quote stays open
    expect(splitComposedCommand('echo "hello\\\\\\" && rm"')).toEqual(['echo "hello\\\\\\" && rm"'])
  })
})


describe('matchCommandPattern (via CommandValidable)', () => {

  describe('fixed command', () => {

    const validable = CommandValidable({ allow: [command`git status`] })

    it('matches exactly', () => {

      expect(validable.validate('git status')).toBeDefined()
    })

    it('rejects a different command', () => {

      expect(validable.validate('git log')).toBeUndefined()
    })

    it('rejects when extra text remains', () => {

      expect(validable.validate('git status --short')).toBeUndefined()
    })
  })

  describe('single extractor slot', () => {

    const validable = CommandValidable({ allow: [command`git checkout ${safeBranch}`] })

    it('matches with valid extractor value', () => {

      expect(validable.validate('git checkout main')).toBeDefined()
    })

    it('rejects when extractor validation fails', () => {

      // Branch starting with - is invalid
      expect(validable.validate('git checkout -dangerous')).toBeUndefined()
    })
  })

  describe('two extractors', () => {

    const validable = CommandValidable({ allow: [command`git log -n ${safeNumber} ${safeBranch}`] })

    it('matches when both extractors succeed', () => {

      expect(validable.validate('git log -n 10 main')).toBeDefined()
    })

    it('rejects when intermediate segment does not match', () => {

      expect(validable.validate('git log -x 10 main')).toBeUndefined()
    })
  })

  it('matches with spread extractor (multiple tokens separated by space)', () => {

    const pattern = command`git add ${spread(safeFilePath)}`
    const validable = CommandValidable({ allow: [pattern] })

    expect(validable.validate('git add src/foo.ts')).toBeDefined()
    expect(validable.validate('git add src/foo.ts src/bar.ts')).toBeDefined()
  })

  it('matches with greedy extractor', () => {

    const pattern = command`echo ${greedy}`
    const validable = CommandValidable({ allow: [pattern] })

    expect(validable.validate('echo hello world')).toBeDefined()
  })

  it('greedy backtracks to match trailing segment', () => {

    const pattern = command`echo ${greedy} done`
    const validable = CommandValidable({ allow: [pattern] })

    expect(validable.validate('echo hello world done')).toBeDefined()
  })

  it('rejects when no extractors match the input', () => {

    const pattern = command`git checkout ${safeNumber}`
    const validable = CommandValidable({ allow: [pattern] })

    // safeNumber expects digits, 'main' is not digits
    expect(validable.validate('git checkout main')).toBeUndefined()
  })
})


describe('CommandValidable', () => {

  it('returns acceptAll without policies', () => {

    const validable = CommandValidable()

    expect(validable.validate('anything')).toBe(acceptAllSymbol)
  })

  describe('with allow patterns', () => {

    const validable = CommandValidable({ allow: [command`git status`] })

    it('accepts matching command', () => {

      expect(validable.validate('git status')).toBeDefined()
    })

    it('rejects non-matching command', () => {

      expect(validable.validate('rm -rf /')).toBeUndefined()
    })
  })

  it('deny overrides allow', () => {

    const allowed = command`git checkout ${safeBranch}`
    const denied = command`git checkout main`
    const validable = CommandValidable({ allow: [allowed], deny: [denied] })

    expect(validable.validate('git checkout feature/foo')).toBeDefined()
    expect(validable.validate('git checkout main')).toBeUndefined()
  })

  it('composes multiple policies (variadic)', () => {

    const statusPattern = command`git status`
    const checkoutPattern = command`git checkout ${safeBranch}`
    const validable = CommandValidable({ allow: [statusPattern] }, { allow: [checkoutPattern] })

    expect(validable.validate('git status')).toBeDefined()
    expect(validable.validate('git checkout main')).toBeDefined()
    expect(validable.validate('rm -rf /')).toBeUndefined()
  })
})
