import { PathExtractableFactory } from '~/extractables/factories/path'
import { ToolGuardFactory } from '~/guard'
import { stringPatternSchema } from '~/validation/stringPattern'
import { PathBuildSuggestion } from './pathBuildSuggestion'



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
    validableFactory: PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' }),
    buildSuggestion: PathBuildSuggestion('file_path'),
    patternSchema: stringPatternSchema,
  },
])
