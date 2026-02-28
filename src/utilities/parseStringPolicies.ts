import { type ParsedPolicy } from '~/policyEvaluator'
import { stringPolicyDefinitionSchema } from '~/validation/policy'



/**
 * Parses PolicyInput into separate Array<ParsedPolicy<string>>.
 * One element per argument. Validates each policy with Zod (stringPolicyDefinitionSchema).
 */
export const parseStringPolicies = (policies: Array<unknown>): Array<ParsedPolicy<string>> | undefined => {

  if (policies.length === 0)
    return undefined

  const result: Array<ParsedPolicy<string>> = []

  for (const policy of policies) {

    const parsed = stringPolicyDefinitionSchema.parse(policy)

    const allow = parsed.allow ?? []
    const deny = parsed.deny ?? []

    if (allow.length > 0 || deny.length > 0)
      result.push({ allow, deny })
  }

  return result.length > 0
    ? result
    : undefined
}
