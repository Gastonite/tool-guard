import { ToolGuardFactory } from '../guard'



/**
 * Policy factory for the LS tool.
 * Extracts and validates the 'path' property from tool input.
 *
 * @example
 * // Allow listing directories in project only
 * LS: LSToolGuard({
 *   allow: ['src/**', 'tests/**'],
 *   deny: ['node_modules/**'],
 * })
 */
export const LSToolGuard = ToolGuardFactory([
  {
    name: 'path',
    type: 'directoryPath',
  },
])
