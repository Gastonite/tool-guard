import { ToolGuardFactory } from '../guard'



/**
 * Policy factory for the Grep tool.
 * Extracts and validates 'pattern' and 'path' properties from tool input.
 *
 * @example
 * // Allow any search pattern but only in src/
 * Grep: GrepToolGuard({
 *   allow: {
 *     pattern: ['*'],
 *     path: ['src/**', 'tests/**'],
 *   },
 *   deny: {
 *     path: ['vendor/**'],
 *   },
 * })
 */
export const GrepToolGuard = ToolGuardFactory([
  {
    name: 'path',
    type: 'path',
  },
  'pattern',
])
