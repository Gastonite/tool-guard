import { type ParsedPolicy } from '~/policyEvaluator'



/**
 * Parses PolicyInput into separate Array<ParsedPolicy<string>>.
 * One element per argument. Handles 2 forms: Array<string>, { allow?, deny? }.
 */
export const parseStringPolicies = (policies: Array<unknown>): Array<ParsedPolicy<string>> | undefined => {

  if (policies.length === 0)
    return undefined

  const assertStrings = (value: unknown): Array<string> => {

    if (!Array.isArray(value))
      return []

    for (const item of value)
      if (typeof item !== 'string')
        throw new Error(`Expected string pattern, got ${typeof item}: ${String(item)}`)

    return value as Array<string>
  }

  const result: Array<ParsedPolicy<string>> = []

  for (const policy of policies) {

    if (Array.isArray(policy)) {

      const strings = assertStrings(policy)

      if (strings.length > 0)
        result.push({ allow: strings, deny: [] })

      continue
    }

    // eslint-disable-next-line no-restricted-syntax -- null check required: typeof null === 'object'
    if (typeof policy === 'object' && policy !== null) {

      const policyObject = policy as Record<string, unknown>
      const allow = assertStrings(policyObject.allow)
      const deny = assertStrings(policyObject.deny)

      if (allow.length > 0 || deny.length > 0)
        result.push({ allow, deny })
    }
  }

  return result.length > 0
    ? result
    : undefined
}
