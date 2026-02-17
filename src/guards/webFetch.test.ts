import { describe, expect, it } from 'vitest'
import { WebFetchToolGuard } from './webFetch'



describe('WebFetchToolGuard', () => {

  it('extracts url from input', () => {

    const policy = WebFetchToolGuard({ allow: ['https://example.com/*'] })

    expect(policy({ url: 'https://example.com/api' })).toEqual({ allowed: true })
    expect(policy({ url: 'https://evil.com/api' }).allowed).toBe(false)
  })

  it('deny overrides allow', () => {

    const policy = WebFetchToolGuard({ allow: ['*'], deny: ['https://evil.com*'] })

    expect(policy({ url: 'https://example.com/api' })).toEqual({ allowed: true })
    expect(policy({ url: 'https://evil.com/api' }).allowed).toBe(false)
  })

  it('noMatch — denies when url does not match any allow pattern', () => {

    const guard = WebFetchToolGuard({ allow: ['https://example.com/*'] })
    const result = guard({ url: 'https://evil.com/api' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('not in allow list')
  })

  it('globalDeny — denies when url matches a global deny', () => {

    const guard = WebFetchToolGuard({ deny: ['https://evil.com*'] })
    const result = guard({ url: 'https://evil.com/api' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('blocked by global deny')
  })

  it('invalidInput — denies when url is missing', () => {

    const guard = WebFetchToolGuard({ allow: ['https://*'] })
    const result = guard({})

    expect(result.allowed).toBe(false)
  })
})
