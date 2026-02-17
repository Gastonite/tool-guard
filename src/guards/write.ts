import { PathExtractableFactory } from '~/extractables/factories/path'
import { ToolGuardFactory } from '~/guard'
import { stringPatternSchema } from '~/validation/stringPattern'
import { PathBuildSuggestion } from './pathBuildSuggestion'



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
    validableFactory: PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' }),
    buildSuggestion: PathBuildSuggestion('file_path'),
    patternSchema: stringPatternSchema,
  },
])
