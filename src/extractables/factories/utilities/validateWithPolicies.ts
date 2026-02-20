import { type PolicyResult } from '~/policyEvaluator'
import { type Predicate } from '~/types/Predicate'



export const validateWithPolicies = (
  value: string,
  predicate: Predicate<string>,
  policy: (value: string) => PolicyResult<string, undefined>,
): string | undefined => {

  if (!predicate(value))
    return

  const result = policy(value)

  return result.outcome === 'allowed'
    ? result.match
    : undefined
}
