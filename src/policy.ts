import { Rule, type RuleDefinition } from './rule'
import { type Extractor } from './types/Extractor'
import { type NonEmptyArray } from './types/NonEmptyArray'
import { type OneOrMany } from './types/OneOrMany'
import { policyInputSchema, type SimplePolicyDefinition, simplePolicyDefinitionSchema } from './validation/policy'
import { type Pattern } from './validation/rule'



/**
 * Structured policy definition with explicit allow/deny rules.
 */
export type StructuredPolicyDefinition<TKeys extends string> = {
  allow?: '*' | OneOrMany<RuleDefinition<TKeys>>
  deny?: '*' | OneOrMany<RuleDefinition<TKeys>>
}

/**
 * Union of all policy definition forms (object with allow and/or deny).
 */
export type PolicyDefinition<TKeys extends string> = (
  | SimplePolicyDefinition
  | StructuredPolicyDefinition<TKeys>
)

/**
 * Simple policy input: non-generic forms compatible with any TKeys.
 * Use this type for shared policy arrays spread across multiple guards.
 */
export type SimplePolicyInput = Pattern | SimplePolicyDefinition

/**
 * Policy configuration with syntactic sugar.
 * - `'*'` → `{ allow: '*' }` (wildcard all)
 * - `['src/*', 'docs/*']` → `{ allow: ['src/*', 'docs/*'] }` (pattern shorthand)
 * - `{ allow: 'src/*', deny: '*.env' }` → SimplePolicyDefinition
 * - `{ path: 'src/*' }` → `{ allow: [{ path: 'src/*' }] }` (rule shorthand)
 * - `[{ path: 'src/*' }, { pattern: 'TODO' }]` → `{ allow: [...] }` (rules array)
 * - `{ allow: { path: 'src/*' }, deny: '*' }` → structured format
 * - `{ deny: '*.env' }` → deny-only (global deny)
 */
export type PolicyInput<TKeys extends string> = (
  | SimplePolicyInput
  | OneOrMany<RuleDefinition<TKeys>>
  | StructuredPolicyDefinition<TKeys>
)


/**
 * Normalized policy with allow/deny rules.
 */
export type Policy<TKeys extends string> = {
  allow: Array<Rule<TKeys>>
  deny: Array<Rule<TKeys>>
}

/**
 * Creates a normalized Policy from input.
 *
 * @param input - PolicyInput with various syntactic sugar options
 * @param extractors - Non-empty array of property names
 * @returns Normalized Policy with allow/deny arrays
 */
export const Policy = <TKeys extends string>(
  input: PolicyInput<TKeys>,
  extractors: NonEmptyArray<Extractor<TKeys>>,
): Policy<TKeys> => {

  const defaultExtractor = extractors[0].name

  // Pattern shorthand: 'src/*' or ['src/*', 'docs/*']
  if (isPattern(input))
    return {
      allow: [Rule({ [defaultExtractor]: input } as RuleDefinition<TKeys>, extractors)],
      deny: [],
    }

  // SimplePolicyDefinition: { allow?: Pattern, deny?: Pattern }
  if (isSimplePolicyDefinition(input)) {

    simplePolicyDefinitionSchema.parse(input)

    return {
      allow: input.allow
        ? [Rule({ [defaultExtractor]: input.allow } as RuleDefinition<TKeys>, extractors)]
        : [],
      deny: input.deny
        ? [Rule({ [defaultExtractor]: input.deny } as RuleDefinition<TKeys>, extractors)]
        : [],
    }
  }

  // Explicit format: RuleDefinition, RuleDefinition[], or StructuredPolicyDefinition
  policyInputSchema.parse(input)

  // StructuredPolicyDefinition: { allow?: Rules, deny?: Rules }
  if (isStructuredPolicyDefinition(input)) {

    const normalizeRules = (
      rules: '*' | OneOrMany<RuleDefinition<TKeys>> | undefined,
    ): Array<Rule<TKeys>> => {

      if (rules === undefined)
        return []

      if (rules === '*')
        return [Rule('*', extractors)]

      if (Array.isArray(rules))
        return rules.map(r => Rule(r, extractors))

      return [Rule(rules, extractors)]
    }

    return {
      allow: normalizeRules(input.allow),
      deny: normalizeRules(input.deny),
    }
  }

  // RuleDefinition[] (array of rules)
  if (Array.isArray(input)) {

    return {
      allow: input.map(r => Rule(r, extractors)),
      deny: [],
    }
  }

  // Single RuleDefinition
  return {
    allow: [Rule(input, extractors)],
    deny: [],
  }
}


// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if value is a Pattern (string or string array).
 */
const isPattern = (value: unknown): value is Pattern => (
  typeof value === 'string'
  || (
    Array.isArray(value)
    && value.every(v => typeof v === 'string')
  )
)

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
 * All present properties (allow, deny) must be Patterns, not Rule objects.
 */
const isSimplePolicyDefinition = (input: unknown): input is SimplePolicyDefinition => (
  isPolicyDefinition(input)
  && (input.allow === undefined || isPattern(input.allow))
  && (input.deny === undefined || isPattern(input.deny))
)

/**
 * Check if input is a StructuredPolicyDefinition.
 * A policy definition that is not simple (at least one property is a Rule, not a Pattern).
 */
const isStructuredPolicyDefinition = <TKeys extends string>(
  input: PolicyInput<TKeys>,
): input is StructuredPolicyDefinition<TKeys> => (
  isPolicyDefinition(input)
  && !isSimplePolicyDefinition(input)
)
