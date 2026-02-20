import { z } from 'zod'
import { type Field } from './field'
import { PolicyFactory } from './policyEvaluator'
import { type NonEmptyArray } from './types/NonEmptyArray'
import { type RequireAtLeastOne } from './types/RequireAtLeastOne'
import { type Validator } from './validable'
import { PolicyDefinitionSchema } from './validation/policy'



// ─── RuleDefinition (moved from rule.ts) ────────────────────────────────────

/**
 * A rule definition for policy matching.
 * At least one property must be defined.
 * Missing properties default to accept-all (no policies).
 * `allow`/`deny` are forbidden to prevent mixing with structured format.
 */
export type RuleDefinition<TPatternMap extends Record<string, unknown> = Record<string, unknown>> = (
  & RequireAtLeastOne<Partial<TPatternMap>>
  & { allow?: never; deny?: never }
)


// ─── Policy Definition Types ────────────────────────────────────────────────

/**
 * Base policy definition: optional allow/deny lists of `T`.
 * Used directly for pattern-based policies (string, CommandPattern, etc.)
 * and via `StructuredPolicyDefinition` for rule-based policies.
 */
export type PolicyDefinition<T> = {
  allow?: NonEmptyArray<T>
  deny?: NonEmptyArray<T>
}

/** Alias for rule-based policies (allow/deny lists of `RuleDefinition`). */
export type StructuredPolicyDefinition<
  TPatternMap extends Record<string, unknown> = Record<string, unknown>,
> = (
  PolicyDefinition<RuleDefinition<TPatternMap>>
)

/**
 * Union of all policy definition forms: either a PolicyDefinition
 * (allow/deny with patterns) or a StructuredPolicyDefinition (allow/deny
 * with rule definitions).
 *
 * - `{ allow: ['src/*'], deny: ['*.env'] }` → PolicyDefinition (simple)
 * - `{ allow: [{ path: ['src/*'] }], deny: [{ path: ['*.env'] }] }` → StructuredPolicyDefinition
 * - `{ deny: ['*.env'] }` → deny-only (global deny)
 *
 * The concrete pattern type depends on the Field (string for Read/Edit/etc.,
 * CommandPattern for Bash). Runtime validation via field.patternSchema handles
 * field-dependent patterns.
 */
export type PolicyInput<TKeys extends string> = (
  | PolicyDefinition<unknown>
  | StructuredPolicyDefinition<Record<TKeys, unknown>>
)


// ─── StructuredPolicyFactory ────────────────────────────────────────────────

/**
 * Factory-of-factory for guard-style policies.
 *
 * Takes fields, builds a structuredSchema from their patternSchemas.
 * Returns a factory: `(definition) → policyFn`.
 *
 * Simple definitions are transformed to structured, then a single construction path:
 * validate with structuredSchema → create matchers via PolicyFactory.
 *
 * The Matcher inlines the AND logic across fields (ex-Rule):
 * for each field, call validableFactory (matching-only, no validation).
 */
export const StructuredPolicyFactory = <TKeys extends string>(
  fields: NonEmptyArray<Field<TKeys>>,
) => {

  // Schema built ONCE from fields' patternSchemas
  const fieldNames = fields.map(field => field.name)
  const ruleDefinitionSchema = z.object(
    Object.fromEntries(
      fields.map(field => [field.name, z.array(field.patternSchema).nonempty().optional()]),
    ) as Record<string, z.ZodOptional<z.ZodArray<z.ZodTypeAny>>>,
  ).refine(
    obj => fieldNames.some(name => (obj as Record<string, unknown>)[name] !== undefined),
    { message: 'Rule definition must have at least one field' },
  )
  const structuredSchema = PolicyDefinitionSchema(ruleDefinitionSchema)

  // Matcher: RuleDefinition → (toolInput) → MatchResult
  // AND logic across fields (replaces Rule)
  // validableFactory is matching-only — structuredSchema already validated
  const Matcher = (ruleDef: RuleDefinition<Record<TKeys, unknown>>) => {

    const _fieldMatchers = fields.map(field => {

      const patternValue = (ruleDef as Record<string, unknown>)[field.name]

      const validator: Validator = patternValue !== undefined
        ? field.validableFactory({ allow: patternValue } as PolicyDefinition<unknown>).validate
        : field.validableFactory().validate

      return { field, validator }
    })

    return (toolInput: Record<string, unknown>) => {

      let lastField: Field<TKeys> = fields[0]
      let lastPattern: string | symbol = ''

      for (const { field, validator } of _fieldMatchers) {

        const value = field.valueSchema.parse(toolInput[field.name] ?? '')
        const pattern = validator(value)

        if (pattern === undefined)
          return {
            matched: false as const,
            failure: { field, value },
          }

        lastField = field
        lastPattern = pattern
      }

      return {
        matched: true as const,
        match: { field: lastField, pattern: lastPattern },
      }
    }
  }

  const factory = PolicyFactory(Matcher)

  return (definition: PolicyInput<TKeys>) => {

    // Try structured first, fallback to simple → structured transformation.
    // Cast: Zod infers Record<string, unknown[]|undefined>, but PolicyFactory expects RuleDefinition.
    // Schema already validated the shape — safe to cast.

    try {

      return factory(structuredSchema.parse(definition) as {
        allow?: Array<RuleDefinition<Record<TKeys, unknown>>>
        deny?: Array<RuleDefinition<Record<TKeys, unknown>>>
      })
    } catch {

      return factory(structuredSchema.parse(_toStructured(definition, fields[0].name)) as {
        allow?: Array<RuleDefinition<Record<TKeys, unknown>>>
        deny?: Array<RuleDefinition<Record<TKeys, unknown>>>
      })
    }
  }
}


// ============================================================================
// Helpers
// ============================================================================

/**
 * Transform a PolicyDefinition (simple) into a StructuredPolicyDefinition.
 * `{ allow: ['src/*'], deny: ['*.env'] }` → `{ allow: [{ path: ['src/*'] }], deny: [{ path: ['*.env'] }] }`
 */
const _toStructured = <TKeys extends string>(
  definition: PolicyDefinition<unknown>,
  defaultFieldName: TKeys,
): StructuredPolicyDefinition<Record<TKeys, unknown>> => ({
  allow: definition.allow
    ? [{ [defaultFieldName]: definition.allow } as RuleDefinition<Record<TKeys, unknown>>]
    : undefined,
  deny: definition.deny
    ? [{ [defaultFieldName]: definition.deny } as RuleDefinition<Record<TKeys, unknown>>]
    : undefined,
})
