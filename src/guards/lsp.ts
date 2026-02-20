import { PathExtractableFactory } from '~/extractables/factories/path'
import { ToolGuardFactory } from '~/guard'
import { PathBuildSuggestion } from './pathBuildSuggestion'



/**
 * Policy factory for the LSP tool.
 * Extracts and validates 'operation' and 'filePath' properties from tool input.
 *
 * @example
 * // Allow read-only operations on TypeScript files
 * LSP: LSPToolGuard({
 *   allow: {
 *     operation: ['goToDefinition', 'hover', 'findReferences'],
 *     filePath: ['**\/*.ts', '**\/*.tsx'],
 *   },
 *   deny: {
 *     operation: ['rename'],
 *   },
 * })
 */
export const LSPToolGuard = ToolGuardFactory([
  {
    name: 'filePath',
    validableFactory: PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' }),
    buildSuggestion: PathBuildSuggestion('filePath'),
  },
  'operation',
])
