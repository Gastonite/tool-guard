import { describe, expect, it } from 'vitest'
import { ListMcpResourcesToolGuard } from './listMcpResources'



describe('ListMcpResourcesToolGuard', () => {

  it('extracts server from input', () => {

    const policy = ListMcpResourcesToolGuard({ allow: ['my-server'] })

    expect(policy({ server: 'my-server' })).toEqual({ allowed: true })
    expect(policy({ server: 'unknown-server' }).allowed).toBe(false)
  })
})
