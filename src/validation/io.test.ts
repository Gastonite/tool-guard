/**
 * Tests for hook I/O validation
 */

import { describe, it, expect } from 'vitest'
import { validateInput, validateOutput } from './io'



describe('validateInput', () => {

  const validInput = {
    session_id: 'session-123',
    transcript_path: '/path/to/transcript',
    cwd: '/home/user/project',
    permission_mode: 'default',
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'git status' },
    tool_use_id: 'tool-use-456',
  }

  it('validates and transforms valid input', () => {

    const result = validateInput(validInput)

    expect(result.sessionId).toBe('session-123')
    expect(result.transcriptPath).toBe('/path/to/transcript')
    expect(result.cwd).toBe('/home/user/project')
    expect(result.permissionMode).toBe('default')
    expect(result.hookEventName).toBe('PreToolUse')
    expect(result.toolName).toBe('Bash')
    expect(result.toolInput).toEqual({ command: 'git status' })
    expect(result.toolUseId).toBe('tool-use-456')
  })

  it('accepts built-in tool names', () => {

    const toolNames = ['Bash', 'Read', 'Write', 'Edit', 'MultiEdit', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'Task', 'NotebookEdit']

    for (const toolName of toolNames) {

      const input = { ...validInput, tool_name: toolName }
      const result = validateInput(input)
      expect(result.toolName).toBe(toolName)
    }
  })

  it('accepts custom tool names (LSP, MCP, etc.)', () => {

    const customToolNames = ['LSP', 'mcp__ide__executeCode', 'CustomTool']

    for (const toolName of customToolNames) {

      const input = { ...validInput, tool_name: toolName }
      const result = validateInput(input)
      expect(result.toolName).toBe(toolName)
    }
  })

  it('throws on missing required field', () => {

    const { session_id: _sessionId, ...missingSessionId } = validInput
    void _sessionId // Suppress unused variable warning
    expect(() => validateInput(missingSessionId)).toThrow()
  })

  it('throws on wrong type for session_id', () => {

    const invalidInput = { ...validInput, session_id: 123 }
    expect(() => validateInput(invalidInput)).toThrow()
  })

  it('throws on undefined input', () => {

    expect(() => validateInput(undefined)).toThrow()
  })

  it('throws on string input', () => {

    expect(() => validateInput('not an object')).toThrow()
  })
})

describe('validateOutput', () => {

  it('validates allow response', () => {

    const allowResponse = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
      },
    }

    const result = validateOutput(allowResponse)
    expect(result.hookSpecificOutput.permissionDecision).toBe('allow')
  })

  it('validates deny response with reason', () => {

    const denyResponse = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'Not allowed',
      },
    }

    const result = validateOutput(denyResponse)
    expect(result.hookSpecificOutput.permissionDecision).toBe('deny')
    expect(result.hookSpecificOutput.permissionDecisionReason).toBe('Not allowed')
  })

  it('allows deny without reason', () => {

    const denyResponse = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
      },
    }

    const result = validateOutput(denyResponse)
    expect(result.hookSpecificOutput.permissionDecisionReason).toBeUndefined()
  })

  it('throws on invalid hookEventName', () => {

    const invalidResponse = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        permissionDecision: 'allow',
      },
    }

    expect(() => validateOutput(invalidResponse)).toThrow()
  })

  it('throws on invalid permissionDecision', () => {

    const invalidResponse = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'maybe',
      },
    }

    expect(() => validateOutput(invalidResponse)).toThrow()
  })

  it('throws on missing hookSpecificOutput', () => {

    expect(() => validateOutput({})).toThrow()
  })
})
