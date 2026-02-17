import { PathExtractableFactory } from '~/extractables/factories/path'
import { ToolGuardFactory } from '~/guard'
import { stringPatternSchema } from '~/validation/stringPattern'
import { PathBuildSuggestion } from './pathBuildSuggestion'



/**
 * Policy factory for the LS tool.
 * Extracts and validates the 'path' property from tool input.
 *
 * @example
 * // Allow listing directories in project only
 * LS: LSToolGuard({
 *   allow: ['src/**', 'tests/**'],
 *   deny: ['node_modules/**'],
 * })
 */
export const LSToolGuard = ToolGuardFactory([
  {
    name: 'path',
    validableFactory: PathExtractableFactory({ type: 'directory', scope: 'internalUnlessExternalPrefixed' }),
    buildSuggestion: PathBuildSuggestion('path'),
    patternSchema: stringPatternSchema,
  },
])
