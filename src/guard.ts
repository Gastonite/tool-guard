import { type PolicyInput, Policy } from './policy'
import { type Rule } from './rule'
import { type Extractor, type ExtractorType } from './types/Extractor'
import { type NonEmptyArray } from './types/NonEmptyArray'
import { resolveProjectPath } from './utilities/resolveProjectPath'
import { extractorsSchema } from './validation/guard'



/**
 * Result of a policy validation.
 * Discriminated union: reason and suggestion required when denied.
 */
export type ValidationResult = (
  | { allowed: true }
  | { allowed: false; reason: string; suggestion: string }
)

/**
 * A tool guard is a function that validates tool input.
 * Returns whether the tool usage is allowed or denied with reason.
 */
export type ToolGuard = (toolInput: Record<string, unknown>) => ValidationResult

/**
 * Map of tool names to their guards.
 * Accepts boolean (syntactic sugar) or ToolGuard function.
 */
export type ToolGuardsConfig = Record<string, boolean | ToolGuard>

/**
 * Helper function for type-safe config definition.
 * Provides autocomplete and type checking in user config files.
 */
export const defineGuard = <T extends ToolGuardsConfig>(config: T): T => config


/**
 * Input type for ToolGuardFactory.
 * Decoupled from PolicyInput to allow independent evolution.
 */
export type ToolGuardFactoryInput<TKeys extends string> = PolicyInput<TKeys>

/**
 * A factory that creates ToolGuard functions from policy config.
 */
export type ToolGuardFactory<TKeys extends string> = (
  ...configs: Array<ToolGuardFactoryInput<TKeys>>
) => ToolGuard


/**
 * Extractor definition: string shorthand or object with type.
 * - `'file_path'` → `{ name: 'file_path' }`
 * - `{ name: 'file_path', type: 'path' }` → path extractor with picomatch + security
 */
export type ExtractorDefinition<TKeys extends string> = TKeys | { name: TKeys; type: ExtractorType }

/**
 * Creates a ToolGuardFactory for the given extractors.
 *
 * @param definitions - Non-empty array of extractor definitions.
 *                      First element is the "default extractor" used for simple format.
 *
 * @example
 * // Path guard with built-in security
 * const ReadToolGuard = ToolGuardFactory([{ name: 'file_path', type: 'path' }])
 * ReadToolGuard({ allow: ['src/**'], deny: ['**\/.env'] })
 *
 * @example
 * // Multi-prop guard with mixed types
 * const GrepToolGuard = ToolGuardFactory([{ name: 'path', type: 'path' }, 'pattern'])
 * GrepToolGuard({ allow: ['src/**'] })  // → applies to 'path', 'pattern' defaults to '*'
 */
export const ToolGuardFactory = <const TKeys extends string>(
  definitions: NonEmptyArray<ExtractorDefinition<TKeys>>,
): ToolGuardFactory<TKeys> => {

  const extractors = definitions.map((definition): Extractor<TKeys> => {

    if (typeof definition === 'string')
      return { name: definition }
    return definition
  }) as NonEmptyArray<Extractor<TKeys>>

  extractorsSchema.parse(extractors.map(extractor => extractor.name))

  return (...inputs) => {

    const scopedPolicies: Array<Policy<TKeys>> = []
    const globalDenies: Array<Rule<TKeys>> = []

    try {

      for (const input of inputs) {

        const policy = Policy(input, extractors)

        if (policy.allow.length === 0)
          globalDenies.push(...policy.deny)
        else
          scopedPolicies.push(policy)
      }
    } catch (error) {

      return () => ({
        allowed: false,
        reason: `Invalid policy config: ${(
          error instanceof Error
            ? error.message
            : 'Invalid input'
        )}`,
        suggestion: 'Check your guard.config.ts syntax',
      })
    }

    return toolInput => {

      // Phase 1: first-match on scoped policies
      let allowed = false
      let lastFailure: { extractor: Extractor<TKeys>; value: string } | undefined

      for (const policy of scopedPolicies) {

        let policyAllows = false

        for (const rule of policy.allow) {

          const result = rule(toolInput)
          if (result.matches) {

            policyAllows = true
            break
          }

          lastFailure = result
        }

        if (!policyAllows)
          continue

        // Allow matched — check scoped deny
        for (const rule of policy.deny) {

          const result = rule(toolInput)
          if (result.matches)
            return {
              allowed: false,
              reason: `${result.extractor.name} blocked by deny pattern: '${result.pattern}'`,
              suggestion: `Remove '${result.pattern}' from deny.${result.extractor.name}`,
            }
        }

        allowed = true
        break
      }

      if (!allowed)
        return {
          allowed: false,
          reason: lastFailure
            ? `${lastFailure.extractor.name} not in allow list`
            : 'No allow rules defined',
          suggestion: lastFailure
            ? buildSuggestion(lastFailure)
            : 'Add rules to allow',
        }

      // Phase 2: global deny filter (deny-only policies)
      for (const rule of globalDenies) {

        const result = rule(toolInput)
        if (result.matches)
          return {
            allowed: false,
            reason: `${result.extractor.name} blocked by global deny: '${result.pattern}'`,
            suggestion: `Remove '${result.pattern}' from deny.${result.extractor.name}`,
          }
      }

      return { allowed: true }
    }
  }
}


// ============================================================================
// Helpers
// ============================================================================

/**
 * Build a contextual suggestion for allow failures.
 * Path extractors suggest glob patterns, others suggest the exact value.
 */
const buildSuggestion = (failure: { extractor: Extractor<string>; value: string }): string => {

  const { name, type } = failure.extractor

  if (!type)
    return `Add '${failure.value}' to allow.${name}`

  if (!failure.value)
    return `Add '*' to allow.${name}`

  const resolved = resolveProjectPath(failure.value)

  // Internal path: suggest relative pattern
  if (resolved.internal) {

    const lastSlashIndex = resolved.relativePath.lastIndexOf('/')
    const globPattern = lastSlashIndex === -1
      ? '*'
      : `${resolved.relativePath.slice(0, lastSlashIndex)}/*`

    return `Add '${resolved.relativePath}' or '${globPattern}' to allow.${name}`
  }

  // External path: suggest external: with resolved absolute
  const lastSlashIndex = resolved.absolutePath.lastIndexOf('/')
  const globPattern = `external:${resolved.absolutePath.slice(0, lastSlashIndex)}/*`

  return `Add 'external:${resolved.absolutePath}' or '${globPattern}' to allow.${name}`
}
