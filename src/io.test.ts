import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readInput, replyAllow, replyDeny } from './io'



afterEach(() => {

  vi.restoreAllMocks()
})

describe('replyAllow', () => {

  it('outputs allow decision', () => {

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    replyAllow()
    const output = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(output.hookSpecificOutput.permissionDecision).toBe('allow')
  })

  it('outputs correct hook event name', () => {

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    replyAllow()
    const output = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(output.hookSpecificOutput.hookEventName).toBe('PreToolUse')
  })
})

describe('replyDeny', () => {

  it('outputs deny decision', () => {

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    replyDeny('test reason')
    const output = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(output.hookSpecificOutput.permissionDecision).toBe('deny')
  })

  it('includes reason in output', () => {

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    replyDeny('forbidden tool')
    const output = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(output.hookSpecificOutput.permissionDecisionReason).toBe('forbidden tool')
  })

  it('outputs correct hook event name', () => {

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    replyDeny('test')
    const output = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(output.hookSpecificOutput.hookEventName).toBe('PreToolUse')
  })
})

describe('readInput', () => {

  it('parses valid JSON from stdin', async () => {

    const json = JSON.stringify({
      session_id: 'test-session',
      transcript_path: '/tmp/t',
      cwd: '/tmp',
      permission_mode: 'default',
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'git status' },
      tool_use_id: 'test-id',
    })

    const original = process.stdin
    Object.defineProperty(process, 'stdin', {
      value: Readable.from([json]),
      configurable: true,
    })

    const result = await readInput()

    Object.defineProperty(process, 'stdin', {
      value: original,
      configurable: true,
    })

    expect(result.toolName).toBe('Bash')
    expect(result.sessionId).toBe('test-session')
    expect(result.toolInput).toEqual({ command: 'git status' })
  })
})
