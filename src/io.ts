import { type HookInput, validateInput, validateOutput } from './validation/io'



/**
 * Read and validate hook input from stdin (JSON format).
 * Called by Claude Code for each tool use via the hook system.
 * @returns Validated hook input with camelCase field names
 */
export const readInput = async (): Promise<HookInput> => {

  let data = ''

  for await (const chunk of process.stdin)
    data += chunk

  return validateInput(JSON.parse(data))
}

/**
 * Write allow decision to stdout (JSON format for Claude Code hook system).
 */
export const replyAllow = (): void => {

  console.log(JSON.stringify(validateOutput({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
    },
  })))
}

/**
 * Write deny decision to stdout (JSON format for Claude Code hook system).
 * @param reason - Human-readable explanation for the denial
 */
export const replyDeny = (reason: string): void => {

  console.log(JSON.stringify(validateOutput({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  })))
}
