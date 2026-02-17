import { describe, expect, it } from 'vitest'
import { ReadMcpResourceToolGuard } from './readMcpResource'



describe('ReadMcpResourceToolGuard', () => {

  it('extracts server and uri from input', () => {

    const policy = ReadMcpResourceToolGuard({
      allow: [{
        server: ['my-server'],
        uri: ['resource://docs/*'],
      }],
    })

    expect(policy({ server: 'my-server', uri: 'resource://docs/readme' })).toEqual({ allowed: true })
    expect(policy({ server: 'other-server', uri: 'resource://docs/readme' }).allowed).toBe(false)
    expect(policy({ server: 'my-server', uri: 'resource://secrets/key' }).allowed).toBe(false)
  })

  it('deny overrides allow', () => {

    const policy = ReadMcpResourceToolGuard({
      allow: [{
        server: ['*'],
        uri: ['*'],
      }],
      deny: [{
        server: ['blocked-server'],
      }],
    })

    expect(policy({ server: 'my-server', uri: 'resource://docs/readme' })).toEqual({ allowed: true })
    expect(policy({ server: 'blocked-server', uri: 'resource://docs/readme' }).allowed).toBe(false)
  })

  it('noMatch — denies when values do not match any allow pattern', () => {

    const guard = ReadMcpResourceToolGuard({
      allow: [{
        server: ['my-server'],
        uri: ['resource://docs/*'],
      }],
    })
    const result = guard({ server: 'other-server', uri: 'resource://docs/readme' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('not in allow list')
  })

  it('globalDeny — denies when values match a global deny', () => {

    const guard = ReadMcpResourceToolGuard({
      deny: [{
        server: ['blocked-server'],
      }],
    })
    const result = guard({ server: 'blocked-server', uri: 'resource://docs/readme' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('blocked by global deny')
  })

  it('invalidInput — denies when properties are missing', () => {

    const guard = ReadMcpResourceToolGuard({
      allow: [{
        server: ['my-server'],
        uri: ['resource://*'],
      }],
    })
    const result = guard({})

    expect(result.allowed).toBe(false)
  })
})
