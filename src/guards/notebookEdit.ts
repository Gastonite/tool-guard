import { ToolGuardFactory } from '../guard'



/**
 * Policy factory for the NotebookEdit tool.
 * Extracts and validates the 'notebook_path' property from tool input.
 *
 * @example
 * // Only allow editing notebooks in the notebooks/ directory
 * NotebookEdit: NotebookEditToolGuard({
 *   allow: ['notebooks/**\/*.ipynb'],
 * })
 */
export const NotebookEditToolGuard = ToolGuardFactory([
  {
    name: 'notebook_path',
    type: 'filePath',
  },
])
