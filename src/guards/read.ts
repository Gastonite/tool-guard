import { ToolGuardFactory } from '../guard'



/**
 * Policy factory for the Read tool.
 * Extracts and validates the 'file_path' property from tool input.
 *
 * @example
 * // Allow reading all files except sensitive ones
 * Read: ReadToolGuard({
 *   allow: ['**\/*'],
 *   deny: ['**\/.env', '~/.ssh/*'],
 * })
 */
export const ReadToolGuard = ToolGuardFactory([
  {
    name: 'file_path',
    type: 'filePath',
  },
])
