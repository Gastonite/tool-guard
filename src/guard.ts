import { type z } from 'zod'
import { Field, type FieldDefinition, type InferPatternMap } from './field'
import { type PolicyInput, StructuredPolicyFactory, type StructuredPolicyDefinition } from './policy'
import { acceptAllSymbol, MergedPolicy, type PolicyResult } from './policyEvaluator'
import { type NonEmptyArray } from './types/NonEmptyArray'
import { type validationResultSchema } from './validation/config'



/**
 * Result of a policy validation.
 * Discriminated union: reason and suggestion required when denied.
 * Inferred from `validationResultSchema` (single source of truth).
 */
export type ValidationResult = z.infer<typeof validationResultSchema>

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
 * User-facing input type for ToolGuardFactory.
 * Typed with the inferred pattern map for compile-time safety.
 */
export type ToolGuardFactoryInput<TPatternMap extends Record<string, unknown>> = (
  | { allow?: TPatternMap[keyof TPatternMap]; deny?: TPatternMap[keyof TPatternMap] }
  | StructuredPolicyDefinition<TPatternMap>
)

/**
 * A factory that creates ToolGuard functions from policy config.
 */
export type ToolGuardFactory<TPatternMap extends Record<string, unknown>> = (
  ...configs: Array<ToolGuardFactoryInput<TPatternMap>>
) => ToolGuard


/**
 * Creates a ToolGuardFactory for the given fields.
 *
 * @param definitions - Non-empty array of field definitions.
 *                      First element is the "default field" used for simple format.
 *
 * @example
 * // String field with glob matching
 * const ReadToolGuard = ToolGuardFactory([{ name: 'file_path' }])
 * ReadToolGuard({ allow: ['src/**'], deny: ['**\/.env'] })
 *
 * @example
 * // Multi-prop guard with mixed types
 * const GrepToolGuard = ToolGuardFactory([{ name: 'path' }, 'pattern'])
 * GrepToolGuard({ allow: ['src/**'] })  // → applies to 'path', 'pattern' defaults to '*'
 */
export const ToolGuardFactory = <
  const TDefinitions extends NonEmptyArray<FieldDefinition<string>>,
>(
  definitions: TDefinitions,
): ToolGuardFactory<InferPatternMap<TDefinitions>> => {

  const fields = definitions.map(Field) as NonEmptyArray<Field<string>>
  const GuardPolicy = StructuredPolicyFactory(fields)

  // Internally, `guard` accepts the generic PolicyDefinition<string> (loose types).
  // Externally, users see ToolGuardFactory<InferPatternMap<TDefinitions>> (precise types
  // inferred from field definitions — e.g. NonEmptyArray<CommandPattern> for Bash).
  // The cast on the return bridges this gap: TypeScript can't prove compatibility
  // between the loose internal type and the precise external type, but Zod validates
  // the actual pattern types at runtime via field.patternSchema.
  const guard = (...configs: Array<PolicyInput<string>>): ToolGuard => {

    let merged: (toolInput: Record<string, unknown>) => PolicyResult<
      { field: Field<string>; pattern: string | symbol },
      { field: Field<string>; value: unknown }
    >

    try {

      merged = MergedPolicy(...configs.map(GuardPolicy))
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

      const result = merged(toolInput)

      switch (result.outcome) {

        case 'globalDeny': {

          const { pattern } = result.match
          const displayPattern = pattern === acceptAllSymbol
            ? '(accept-all)'
            : `'${String(pattern)}'`

          return {
            allowed: false,
            reason: `${result.match.field.name} blocked by global deny: ${displayPattern}`,
            suggestion: `Remove ${displayPattern} from deny.${result.match.field.name}`,
          }
        }

        case 'scopedDeny': {

          const { pattern } = result.match
          const displayPattern = pattern === acceptAllSymbol
            ? '(accept-all)'
            : `'${String(pattern)}'`

          return {
            allowed: false,
            reason: `${result.match.field.name} blocked by deny pattern: ${displayPattern}`,
            suggestion: `Remove ${displayPattern} from deny.${result.match.field.name}`,
          }
        }

        case 'allowed':
          return { allowed: true }

        case 'noMatch':
          return {
            allowed: false,
            reason: result.lastFailure
              ? `${result.lastFailure.field.name} not in allow list`
              : 'No allow rules defined',
            suggestion: result.lastFailure
              ? result.lastFailure.field.buildSuggestion(String(result.lastFailure.value))
              : 'Add rules to allow',
          }
      }
    }
  }

  return guard as ToolGuardFactory<InferPatternMap<TDefinitions>>
}
