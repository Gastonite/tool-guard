import { PathExtractableFactory } from '~/extractables/factories/path'
import { ToolGuardFactory } from '~/guard'
import { stringPatternSchema } from '~/validation/stringPattern'
import { PathBuildSuggestion } from './pathBuildSuggestion'



/**
 * Policy factory for the Glob tool.
 * Extracts and validates 'pattern' and 'path' properties from tool input.
 *
 * @example
 * // Allow glob searches only in src/ and tests/
 * Glob: GlobToolGuard({
 *   allow: {
 *     pattern: ['**\/*.ts', '**\/*.json'],
 *     path: ['src/**', 'tests/**'],
 *   },
 * })
 */
export const GlobToolGuard = ToolGuardFactory([
  {
    name: 'path',
    validableFactory: PathExtractableFactory({ type: 'directory', scope: 'internalUnlessExternalPrefixed' }),
    buildSuggestion: PathBuildSuggestion('path'),
    patternSchema: stringPatternSchema,
  },
  'pattern',
])
