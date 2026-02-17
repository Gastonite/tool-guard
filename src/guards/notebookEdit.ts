import { PathExtractableFactory } from '~/extractables/factories/path'
import { ToolGuardFactory } from '~/guard'
import { stringPatternSchema } from '~/validation/stringPattern'
import { PathBuildSuggestion } from './pathBuildSuggestion'



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
    validableFactory: PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' }),
    buildSuggestion: PathBuildSuggestion('notebook_path'),
    patternSchema: stringPatternSchema,
  },
])
