import { type ToolGuardsConfig, type ValidationResult } from './guard'



/**
 * Check if a tool action is allowed based on permissions config.
 *
 * Logic:
 * 1. If tool not in config → DENY
 * 2. If policy is boolean → return allowed/denied directly
 * 3. If policy is function → execute and return result
 *
 * @param toolName - Name of the tool (e.g., 'Bash', 'Read')
 * @param toolInput - The tool's input object
 * @param policies - The permissions configuration
 * @returns Validation result with allowed status and reason/suggestion if denied
 */
export const checkPermissions = (
  toolName: string,
  toolInput: Record<string, unknown>,
  policies: ToolGuardsConfig,
): ValidationResult => {

  const policy = policies[toolName]

  // No policy → denied
  if (policy === undefined)
    return {
      allowed: false,
      reason: `No policy for tool '${toolName}'`,
      suggestion: `Add '${toolName}' to permissions config`,
    }

  // Boolean → allowed/denied directly
  if (typeof policy === 'boolean')
    return policy
      ? { allowed: true }
      : { allowed: false, reason: 'Denied by policy', suggestion: `Set '${toolName}' to true` }

  // ToolGuard function → execute
  return policy(toolInput)
}
