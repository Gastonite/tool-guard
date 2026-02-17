import { describe, expect, it } from 'vitest'
import { ListMcpResourcesToolGuard } from './listMcpResources'



describe('ListMcpResourcesToolGuard', () => {

  it('extracts server from input', () => {

    const policy = ListMcpResourcesToolGuard({ allow: ['my-server'] })

    expect(policy({ server: 'my-server' })).toEqual({ allowed: true })
    expect(policy({ server: 'unknown-server' }).allowed).toBe(false)
  })

  it('deny overrides allow', () => {

    const policy = ListMcpResourcesToolGuard({ allow: ['*'], deny: ['blocked-server'] })

    expect(policy({ server: 'my-server' })).toEqual({ allowed: true })
    expect(policy({ server: 'blocked-server' }).allowed).toBe(false)
  })

  it('noMatch — denies when server does not match any allow pattern', () => {

    const guard = ListMcpResourcesToolGuard({ allow: ['my-server'] })
    const result = guard({ server: 'unknown-server' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('not in allow list')
  })

  it('globalDeny — denies when server matches a global deny', () => {

    const guard = ListMcpResourcesToolGuard({ deny: ['blocked-server'] })
    const result = guard({ server: 'blocked-server' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('blocked by global deny')
  })

  it('invalidInput — denies when server is missing', () => {

    const guard = ListMcpResourcesToolGuard({ allow: ['my-server'] })
    const result = guard({})

    expect(result.allowed).toBe(false)
  })
})
