import { z } from 'zod'



/**
 * Zod schema for hook input (JSON from stdin).
 * Validates Claude Code's hook format and transforms snake_case to camelCase.
 */
const hookInputSchema = z.object({

  /** Unique session identifier */
  session_id: z.string(),

  /** Path to conversation transcript */
  transcript_path: z.string(),

  /** Current working directory */
  cwd: z.string(),

  /** Current permission mode */
  permission_mode: z.string(),

  /** Hook event name (should be "PreToolUse") */
  hook_event_name: z.string(),

  /** Name of the tool being used (any string, not restricted to built-in tools) */
  tool_name: z.string(),

  /** Tool-specific input parameters */
  tool_input: z.record(z.string(), z.unknown()),

  /** Unique identifier for this tool use */
  tool_use_id: z.string(),

}).transform(input => ({
  sessionId: input.session_id,
  transcriptPath: input.transcript_path,
  cwd: input.cwd,
  permissionMode: input.permission_mode,
  hookEventName: input.hook_event_name,
  toolName: input.tool_name,
  toolInput: input.tool_input,
  toolUseId: input.tool_use_id,
}))

export type HookInput = z.infer<typeof hookInputSchema>

/** Schema for hook response format for PreToolUse events */
const hookResponseSchema = z.object({
  hookSpecificOutput: z.object({
    hookEventName: z.literal('PreToolUse'),
    permissionDecision: z.enum(['allow', 'deny']),
    permissionDecisionReason: z.string().optional(),
  }),
})

export type HookResponse = z.infer<typeof hookResponseSchema>

/**
 * Validate and transform hook input data.
 * @param data - Raw JSON data from stdin
 * @returns Validated HookInput with camelCase field names
 * @throws ZodError if validation fails
 */
export const validateInput = (data: unknown): HookInput => hookInputSchema.parse(data)

/**
 * Validate hook response data.
 * @param data - Response object to validate
 * @returns Validated HookResponse
 * @throws ZodError if validation fails
 */
export const validateOutput = (data: unknown): HookResponse => hookResponseSchema.parse(data)
