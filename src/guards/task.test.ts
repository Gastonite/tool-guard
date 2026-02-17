import { describe, expect, it } from 'vitest'
import { TaskToolGuard } from './task'



describe('TaskToolGuard', () => {

  it('extracts subagent_type from input', () => {

    const policy = TaskToolGuard({ allow: ['Explore', 'Plan'] })

    expect(policy({ subagent_type: 'Explore' })).toEqual({ allowed: true })
    expect(policy({ subagent_type: 'general-purpose' }).allowed).toBe(false)
  })

  it('deny overrides allow', () => {

    const policy = TaskToolGuard({ allow: ['*'], deny: ['general-purpose'] })

    expect(policy({ subagent_type: 'Explore' })).toEqual({ allowed: true })
    expect(policy({ subagent_type: 'general-purpose' }).allowed).toBe(false)
  })

  it('noMatch — denies when subagent_type does not match any allow pattern', () => {

    const guard = TaskToolGuard({ allow: ['Explore'] })
    const result = guard({ subagent_type: 'general-purpose' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('not in allow list')
  })

  it('globalDeny — denies when subagent_type matches a global deny', () => {

    const guard = TaskToolGuard({ deny: ['general-purpose'] })
    const result = guard({ subagent_type: 'general-purpose' })

    expect(result.allowed).toBe(false)
    expect((result as { reason: string }).reason).toContain('blocked by global deny')
  })

  it('invalidInput — denies when subagent_type is missing', () => {

    const guard = TaskToolGuard({ allow: ['Explore'] })
    const result = guard({})

    expect(result.allowed).toBe(false)
  })
})
