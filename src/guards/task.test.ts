import { describe, expect, it } from 'vitest'
import { TaskToolGuard } from './task'



describe('TaskToolGuard', () => {

  it('extracts subagent_type from input', () => {

    const policy = TaskToolGuard({ allow: ['Explore', 'Plan'] })

    expect(policy({ subagent_type: 'Explore' })).toEqual({ allowed: true })
    expect(policy({ subagent_type: 'general-purpose' }).allowed).toBe(false)
  })
})
