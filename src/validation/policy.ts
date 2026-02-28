import { z } from 'zod'
import { ruleDefinitionSchema } from './rule'
import { stringPatternSchema } from './stringPattern'



/**
 * Schema for policy rules (non-empty array of rule definitions).
 */
// eslint-disable-next-line  import/no-unused-modules -- public API
export const policyRulesSchema = z.array(ruleDefinitionSchema).nonempty()


/**
 * Schema for policy definition ({ allow, deny } with at least one required).
 */
export const policyDefinitionSchema = z.object({

  allow: policyRulesSchema.optional(),
  deny: policyRulesSchema.optional(),
}).refine(
  policy => policy.allow !== undefined || policy.deny !== undefined,
  'Policy must have at least allow or deny',
)


/**
 * Schema for string-based policy definition ({ allow?, deny? } with at least one required).
 * Used by all extractable factories for runtime validation.
 */

export const stringPolicyDefinitionSchema = z.object({

  allow: z.array(stringPatternSchema).optional(),
  deny: z.array(stringPatternSchema).optional(),
}).refine(
  policy => policy.allow !== undefined || policy.deny !== undefined,
  'Policy must have at least allow or deny',
)
