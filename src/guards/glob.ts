import { ToolGuardFactory } from '../guard'



/**
 * Policy factory for the Glob tool.
 * Extracts and validates 'pattern' and 'path' properties from tool input.
 *
 * @example
 * // Allow glob searches only in src/ and tests/
 * Glob: GlobToolGuard({
 *   allow: {
 *     pattern: ['**\/*.ts', '**\/*.json'],
 *     path: ['src/**', 'tests/**'],
 *   },
 * })
 */
export const GlobToolGuard = ToolGuardFactory([
  {
    name: 'path',
    type: 'directoryPath',
  },
  'pattern',
])
