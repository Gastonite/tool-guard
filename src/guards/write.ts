import { ToolGuardFactory } from '../guard'



/**
 * Policy factory for the Write tool.
 * Extracts and validates the 'file_path' property from tool input.
 *
 * @example
 * // Only allow writing to source files
 * Write: WriteToolGuard({
 *   allow: ['src/**\/*.ts', '*.json'],
 * })
 */
export const WriteToolGuard = ToolGuardFactory([
  {
    name: 'file_path',
    type: 'filePath',
  },
])
