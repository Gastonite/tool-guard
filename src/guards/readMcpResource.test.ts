import { describe, expect, it } from 'vitest'
import { ReadMcpResourceToolGuard } from './readMcpResource'



describe('ReadMcpResourceToolGuard', () => {

  it('extracts server and uri from input', () => {

    const policy = ReadMcpResourceToolGuard({
      allow: {
        server: ['my-server'],
        uri: ['resource://docs/*'],
      },
    })

    expect(policy({ server: 'my-server', uri: 'resource://docs/readme' })).toEqual({ allowed: true })
    expect(policy({ server: 'other-server', uri: 'resource://docs/readme' }).allowed).toBe(false)
    expect(policy({ server: 'my-server', uri: 'resource://secrets/key' }).allowed).toBe(false)
  })
})
