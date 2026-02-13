import { ToolGuardFactory } from '../guard'



/**
 * Policy factory for the MultiEdit tool.
 * Extracts and validates the 'file_path' property from tool input.
 *
 * @example
 * // Only allow editing TypeScript files
 * MultiEdit: MultiEditToolGuard({
 *   allow: ['**\/*.ts'],
 * })
 */
export const MultiEditToolGuard = ToolGuardFactory([
  {
    name: 'file_path',
    type: 'filePath',
  },
])
