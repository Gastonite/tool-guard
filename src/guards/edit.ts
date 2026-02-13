import { ToolGuardFactory } from '../guard'



/**
 * Policy factory for the Edit tool.
 * Extracts and validates the 'file_path' property from tool input.
 *
 * @example
 * // Only allow editing TypeScript files in src/
 * Edit: EditToolGuard({
 *   allow: ['src/**\/*.ts'],
 * })
 */
export const EditToolGuard = ToolGuardFactory([
  {
    name: 'file_path',
    type: 'filePath',
  },
])
