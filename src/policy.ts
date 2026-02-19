import { z } from 'zod'
import { type Field } from './field'
import { Rule, type RuleDefinition } from './rule'
import { type NonEmptyArray } from './types/NonEmptyArray'
import { policyDefinitionSchema } from './validation/policy'



/**
 * Simple policy definition with pattern values.
 * Generic: `SimplePolicyDefinition<string>` for extractables, `SimplePolicyDefinition` (unknown) for guards.
 */

export type SimplePolicyDefinition<TPattern = unknown> = {
  allow?: Array<TPattern>
  deny?: Array<TPattern>
}

/**
 * Structured policy definition with explicit allow/deny rules.
 */
export type StructuredPolicyDefinition<TPatternMap extends Record<string, unknown> = Record<string, unknown>> = {
  allow?: NonEmptyArray<RuleDefinition<TPatternMap>>
  deny?: NonEmptyArray<RuleDefinition<TPatternMap>>
}

/**
 * Union of all policy definition forms: either a SimplePolicyDefinition
 * (allow/deny with patterns) or a StructuredPolicyDefinition (allow/deny
 * with rule definitions).
 *
 * - `{ allow: ['src/*'], deny: ['*.env'] }` → SimplePolicyDefinition
 * - `{ allow: [{ path: ['src/*'] }], deny: [{ path: ['*.env'] }] }` → StructuredPolicyDefinition
 * - `{ deny: ['*.env'] }` → deny-only (global deny)
 *
 * The concrete pattern type depends on the Field (string for Read/Edit/etc.,
 * CommandPattern for Bash). Runtime validation via field.isPattern handles
 * field-dependent patterns.
 */

export type PolicyDefinition<TKeys extends string> = (
  | SimplePolicyDefinition
  | StructuredPolicyDefinition<Record<TKeys, unknown>>
)

/**
 * Normalized policy with allow/deny rules.
 */
export type Policy<TKeys extends string> = {
  allow: Array<Rule<TKeys>>
  deny: Array<Rule<TKeys>>
}

/**
 * Creates a normalized Policy from a SimplePolicyDefinition or
 * StructuredPolicyDefinition input.
 *
 * @param definition - PolicyDefinition (simple or structured)
 * @param fields - Non-empty array of normalized Fields
 * @returns Normalized Policy with allow/deny arrays
 */
export const Policy = <TKeys extends string>(
  definition: PolicyDefinition<TKeys>,
  fields: NonEmptyArray<Field<TKeys>>,
): Policy<TKeys> => {

  // SimplePolicyDefinition: { allow?: Pattern, deny?: Pattern }
  if (isSimplePolicyDefinition(definition, fields[0].patternsSchema)) {

    z.object({
      allow: fields[0].patternsSchema.optional(),
      deny: fields[0].patternsSchema.optional(),
    }).refine(
      policy => policy.allow !== undefined || policy.deny !== undefined,
      'Simple policy must have at least allow or deny',
    ).parse(definition)

    const simplePolicyDefinition = definition as SimplePolicyDefinition
    const defaultFieldName = fields[0].name

    return {
      allow: simplePolicyDefinition.allow
        ? [Rule({ [defaultFieldName]: simplePolicyDefinition.allow } as RuleDefinition<Record<TKeys, unknown>>, fields)]
        : [],
      deny: simplePolicyDefinition.deny
        ? [Rule({ [defaultFieldName]: simplePolicyDefinition.deny } as RuleDefinition<Record<TKeys, unknown>>, fields)]
        : [],
    }
  }

  // Explicit format: StructuredPolicyDefinition
  policyDefinitionSchema.parse(definition)

  // StructuredPolicyDefinition: { allow?: Rules, deny?: Rules }
  if (isStructuredPolicyDefinition(definition)) {

    // Cast needed: TS generic inference loses TKeys through isPolicyDefinition narrowing
    const structuredPolicyDefinition = definition as StructuredPolicyDefinition<Record<TKeys, unknown>>

    const normalizeRules = (
      rules: NonEmptyArray<RuleDefinition<Record<TKeys, unknown>>> | undefined,
    ): Array<Rule<TKeys>> => {

      if (rules === undefined)
        return []

      return rules.map(rule => Rule(rule, fields))
    }

    return {
      allow: normalizeRules(structuredPolicyDefinition.allow),
      deny: normalizeRules(structuredPolicyDefinition.deny),
    }
  }

  // Should never reach here — all valid PolicyDefinition forms are handled above
  throw new Error('Invalid policy input')
}


// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if input is a policy definition (object with allow and/or deny).
 * Discriminant: RuleDefinition forbids allow/deny keys, so their presence identifies a policy.
 */
const isPolicyDefinition = <TKeys extends string>(value: unknown): value is PolicyDefinition<TKeys> => (
  typeof value === 'object'
  // eslint-disable-next-line no-restricted-syntax -- null check required: typeof null === 'object'
  && value !== null
  && ('allow' in value || 'deny' in value)
)

/**
 * Check if input is a SimplePolicyDefinition.
 * All present properties (allow, deny) must be field-compatible patterns.
 */
const isEmptyArray = (value: unknown): boolean => (
  Array.isArray(value) && value.length === 0
)

const isPattern = (value: unknown, schema: z.ZodType): boolean => (
  schema.safeParse(value).success
)

const isSimplePolicyDefinition = (
  input: unknown,
  patternSchema: z.ZodType,
): input is SimplePolicyDefinition => (
  isPolicyDefinition(input)
  && (input.allow === undefined || isPattern(input.allow, patternSchema) || isEmptyArray(input.allow))
  && (input.deny === undefined || isPattern(input.deny, patternSchema) || isEmptyArray(input.deny))
)

/**
 * Check if a value has the shape of a RuleDefinition.
 * Object with at least one key, without allow/deny.
 */
const isRuleDefinitionShape = (value: unknown): boolean => (
  typeof value === 'object'
  // eslint-disable-next-line no-restricted-syntax -- null check required: typeof null === 'object'
  && value !== null
  && !Array.isArray(value)
  && !('allow' in value)
  && !('deny' in value)
  && Object.keys(value).length > 0
)

/**
 * Check if a value is a valid rule input: RuleDefinition or Array<RuleDefinition>.
 */
const isRuleInput = (value: unknown): boolean => (
  isRuleDefinitionShape(value)
  || (Array.isArray(value) && value.length > 0 && value.every(isRuleDefinitionShape))
)

/**
 * Check if input is a StructuredPolicyDefinition.
 * Positive structural check: allow/deny values must be rule inputs, not patterns.
 */
const isStructuredPolicyDefinition = <TKeys extends string>(
  definition: PolicyDefinition<TKeys>,
): definition is StructuredPolicyDefinition<Record<TKeys, unknown>> => (
  isPolicyDefinition(definition)
  && (definition.allow === undefined || isRuleInput(definition.allow))
  && (definition.deny === undefined || isRuleInput(definition.deny))
)
