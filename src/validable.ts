import { GlobPolicyEvaluator } from './globPolicyEvaluator'
import { acceptAll, type acceptAllSymbol } from './policyEvaluator'
import { parseStringPolicies } from './utilities/parseStringPolicies'



/** Validation function: accepts a value, returns the matched pattern or undefined. */
export type Validator = (value: string) => string | typeof acceptAllSymbol | undefined

/** Minimal interface: just validate. Sufficient for Field/Rule. */
export type Validable = {
  validate: Validator
}

/** Creates a Validable from policies. Used by CustomFieldDefinition and by the user. */
export type ValidableFactory<TPattern = unknown> = (...policies: Array<TPattern>) => Validable

/** Default ValidableFactory for StringFieldDefinition: wraps matchGlobPattern. */
export const DefaultValidable: ValidableFactory = (...policies) => {

  const parsedPolicies = parseStringPolicies(policies)

  if (parsedPolicies === undefined)
    return acceptAll

  const evaluator = GlobPolicyEvaluator(parsedPolicies)

  return {
    validate: value => {

      const result = evaluator(value)

      return result.outcome === 'allowed'
        ? result.match
        : undefined
    },
  }
}
