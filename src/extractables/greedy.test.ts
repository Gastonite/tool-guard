import { describe, expect, it } from 'vitest'
import { acceptAllSymbol } from '~/policyEvaluator'
import { Greedy, greedy } from './greedy'



describe('Greedy', () => {

  describe('extract', () => {

    it('consumes printable ASCII', () => {

      expect(greedy.extract('hello world')).toBe(11)
    })

    it('includes tab', () => {

      expect(greedy.extract('hello\tworld')).toBe(11)
    })

    it('stops on newline', () => {

      expect(greedy.extract('hello\nworld')).toBe(5)
    })

    it('stops on redirection operators', () => {

      expect(greedy.extract('hello>world')).toBe(5)
      expect(greedy.extract('hello<world')).toBe(5)
    })

    it('stops on parentheses', () => {

      expect(greedy.extract('hello(world')).toBe(5)
      expect(greedy.extract('hello)world')).toBe(5)
    })

    it('stops on $ character', () => {

      expect(greedy.extract('hello$world')).toBe(5)
    })

    it('stops on backtick character', () => {

      expect(greedy.extract('hello`world')).toBe(5)
    })

    it('stops on & character', () => {

      expect(greedy.extract('hello&world')).toBe(5)
    })

    it('returns false on empty string', () => {

      expect(greedy.extract('')).toBe(false)
    })

    it('consumes double-quoted content with special chars', () => {

      expect(greedy.extract('hello "world > here" rest')).toBe(25)
    })

    it('consumes single-quoted content with special chars', () => {

      expect(greedy.extract(`hello 'world > here' rest`)).toBe(25)
    })

    it('returns false on unclosed double quote', () => {

      expect(greedy.extract('hello "world')).toBe(false)
    })

    it('returns false on unclosed single quote', () => {

      expect(greedy.extract(`hello 'world`)).toBe(false)
    })

    it('handles backslash escape in double quotes', () => {

      expect(greedy.extract('hello "say \\"hi\\"" rest')).toBe(23)
    })

    it('rejects $ inside double quotes', () => {

      expect(greedy.extract('hello "$HOME" rest')).toBe(false)
    })

    it('accepts $ inside single quotes', () => {

      expect(greedy.extract(`hello '$HOME' rest`)).toBe(18)
    })
  })

  describe('validate', () => {

    it('accepts safe string', () => {

      expect(greedy.validate('hello world')).toBe(acceptAllSymbol)
    })

    it('rejects $( (command substitution)', () => {

      expect(greedy.validate('hello $(whoami)')).toBeUndefined()
    })

    it('rejects ${ (variable expansion)', () => {

      expect(greedy.validate('hello ${HOME}')).toBeUndefined()
    })

    it('rejects backtick substitution', () => {

      expect(greedy.validate('hello `whoami`')).toBeUndefined()
    })

    it('rejects & outside quotes', () => {

      expect(greedy.validate('hello & world')).toBeUndefined()
    })

    it('accepts > inside double quotes', () => {

      expect(greedy.validate('hello "> world"')).toBe(acceptAllSymbol)
    })

    it('accepts > inside single quotes', () => {

      expect(greedy.validate(`hello '> world'`)).toBe(acceptAllSymbol)
    })

    it('rejects $ inside double quotes', () => {

      expect(greedy.validate('hello "$HOME"')).toBeUndefined()
    })

    it('accepts $ inside single quotes', () => {

      expect(greedy.validate(`hello '$HOME'`)).toBe(acceptAllSymbol)
    })

    it('rejects unclosed quote', () => {

      expect(greedy.validate('hello "world')).toBeUndefined()
    })

    it('handles backslash escape in double quotes', () => {

      expect(greedy.validate('say "hello \\"world\\""')).toBe(acceptAllSymbol)
    })
  })

  it('allowed: matches allow pattern', () => {

    const instance = Greedy({ allow: ['hello*'] })

    expect(instance.validate('hello world')).toBe('hello*')
  })

  it('noMatch: rejects when no allow pattern matches', () => {

    const instance = Greedy({ allow: ['hello*'] })

    expect(instance.validate('goodbye')).toBeUndefined()
  })

  it('scopedDeny: deny overrides allow', () => {

    const instance = Greedy({ allow: ['*'], deny: ['secret*'] })

    expect(instance.validate('hello world')).toBeDefined()
    expect(instance.validate('secret payload')).toBeUndefined()
  })

  it('globalDeny: rejects on deny-only without allow', () => {

    const instance = Greedy({ deny: ['hello*'] })

    expect(instance.validate('hello world')).toBeUndefined()
  })

  it('invalidInput: rejects unsafe value even with permissive allow', () => {

    const instance = Greedy({ allow: ['*'] })

    expect(instance.validate('hello $(whoami)')).toBeUndefined()
  })
})
