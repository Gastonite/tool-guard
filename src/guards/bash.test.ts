import { describe, expect, it } from 'vitest'
import { command } from '~/command'
import { greedy } from '~/extractables/greedy'
import { BashToolGuard } from './bash'



describe('BashToolGuard', () => {

  it('validates command against CommandPattern', () => {

    const policy = BashToolGuard({ allow: [command`git ${greedy}`] })

    expect(policy({ command: 'git status' })).toEqual({ allowed: true })

    const result = policy({ command: 'curl evil.com' })
    expect(result.allowed).toBe(false)
  })

  it('supports multiple command patterns', () => {

    const policy = BashToolGuard({
      allow: [command`git ${greedy}`, command`pnpm ${greedy}`],
    })

    expect(policy({ command: 'git status' })).toEqual({ allowed: true })
    expect(policy({ command: 'pnpm test' })).toEqual({ allowed: true })
    expect(policy({ command: 'curl evil.com' }).allowed).toBe(false)
  })

  it('splits composed commands and validates each part', () => {

    const policy = BashToolGuard({
      allow: [command`git ${greedy}`, command`pnpm ${greedy}`],
    })

    expect(policy({ command: 'git status && pnpm test' })).toEqual({ allowed: true })
    expect(policy({ command: 'git status && curl evil.com' }).allowed).toBe(false)
  })

  it('deny pattern rejects a matching command', () => {

    const policy = BashToolGuard({
      allow: [command`git ${greedy}`],
      deny: [command`git push --force ${greedy}`],
    })

    expect(policy({ command: 'git status' })).toEqual({ allowed: true })
    expect(policy({ command: 'git push --force origin main' }).allowed).toBe(false)
  })

  it('rejects when one sub-command in composed command is rejected', () => {

    const policy = BashToolGuard({
      allow: [command`git ${greedy}`],
    })

    expect(policy({ command: 'git status; curl evil.com' }).allowed).toBe(false)
  })

  it('respects quotes in composed commands', () => {

    const policy = BashToolGuard({
      allow: [command`git ${greedy}`],
    })

    expect(policy({ command: 'git commit -m "fix && cleanup"' })).toEqual({ allowed: true })
  })

  it('denies empty command', () => {

    const policy = BashToolGuard({
      allow: [command`git ${greedy}`],
    })

    expect(policy({ command: '' }).allowed).toBe(false)
  })
})
