import { PathExtractableFactory } from '~/extractables/factories/path'
import { ToolGuardFactory } from '~/guard'
import { stringPatternSchema } from '~/validation/stringPattern'
import { PathBuildSuggestion } from './pathBuildSuggestion'



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
    validableFactory: PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' }),
    buildSuggestion: PathBuildSuggestion('file_path'),
    patternSchema: stringPatternSchema,
  },
])
