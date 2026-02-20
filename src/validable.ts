import { GlobMatcher } from './globPolicy'
import { type PolicyDefinition } from './policy'
import { acceptAll, type acceptAllSymbol, MergedPolicy, PolicyFactory } from './policyEvaluator'


// eslint-disable-next-line @typescript-eslint/no-explicit-any -- bivariance: allows Validable<string> assignable to Validable (erased in Field)
type DefaultValidableValue = any

/** Validation function: accepts a value, returns the matched pattern or undefined. */
export type Validator<TValue = DefaultValidableValue> = (value: TValue) => string | typeof acceptAllSymbol | undefined

/** Minimal interface: just validate. Sufficient for Field/Rule. */
export type Validable<TValue = DefaultValidableValue> = {
  validate: Validator<TValue>
}

/** Creates a Validable from policies. Used by CustomFieldDefinition and by the user. */
export type ValidableFactory<TPattern = unknown, TValue = DefaultValidableValue> = (...policies: Array<PolicyDefinition<TPattern>>) => Validable<TValue>

/** Glob-based ValidableFactory for string fields. Matching-only, no validation. */
export const GlobValidable: ValidableFactory<string, string> = (...policies) => {

  if (policies.length === 0)
    return acceptAll

  const merged = MergedPolicy(
    ...policies.map(PolicyFactory(GlobMatcher)),
  )

  return {
    validate: value => {

      const result = merged(value)

      return result.outcome === 'allowed'
        ? result.match
        : undefined
    },
  }
}
