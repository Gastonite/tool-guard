import { z } from 'zod'
import { ruleDefinitionSchema } from './rule'



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
