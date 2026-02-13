import { ToolGuardFactory } from '../guard'



/**
 * Policy factory for the NotebookRead tool.
 * Extracts and validates the 'notebook_path' property from tool input.
 *
 * @example
 * // Allow reading notebooks in specific directories
 * NotebookRead: NotebookReadToolGuard({
 *   allow: ['notebooks/**', 'analysis/**'],
 * })
 */
export const NotebookReadToolGuard = ToolGuardFactory([
  {
    name: 'notebook_path',
    type: 'filePath',
  },
])
