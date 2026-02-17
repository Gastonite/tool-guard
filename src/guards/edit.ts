import { PathExtractableFactory } from '~/extractables/factories/path'
import { ToolGuardFactory } from '~/guard'
import { stringPatternSchema } from '~/validation/stringPattern'
import { PathBuildSuggestion } from './pathBuildSuggestion'



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
    validableFactory: PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' }),
    buildSuggestion: PathBuildSuggestion('file_path'),
    patternSchema: stringPatternSchema,
  },
])
