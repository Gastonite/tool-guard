import { describe, expect, it } from 'vitest'
import { BashToolGuard } from './bash'



describe('BashToolGuard', () => {

  it('extracts command from input', () => {

    const policy = BashToolGuard({ allow: ['git *'] })

    // Allowed
    expect(policy({ command: 'git status' })).toEqual({ allowed: true })

    // Denied
    const result = policy({ command: 'curl evil.com' })
    expect(result.allowed).toBe(false)
  })
})
