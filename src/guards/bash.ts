import { ToolGuardFactory } from '../guard'



/**
 * Policy factory for the Bash tool.
 * Extracts and validates the 'command' property from tool input.
 *
 * @example
 * // Allow git and pnpm commands, block force push
 * Bash: BashToolGuard({
 *   allow: ['git *', 'pnpm *'],
 *   deny: ['git push --force *'],
 * })
 *
 * // Simple allow-only syntax
 * Bash: BashToolGuard(['git status', 'pnpm test'])
 */
export const BashToolGuard = ToolGuardFactory(['command'])
