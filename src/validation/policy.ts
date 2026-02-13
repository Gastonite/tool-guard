import { z } from 'zod'
import { patternSchema, ruleDefinitionSchema, ruleInputSchema } from './rule'



/**
 * Schema for policy rules (single rule input, or array of rule definitions).
 */
// eslint-disable-next-line import/no-unused-modules
export const policyRulesSchema = z.union([
  ruleInputSchema,
  z.tuple([ruleDefinitionSchema]).rest(ruleDefinitionSchema),
])


/**
 * Schema for policy definition ({ allow, deny } with at least one required).
 */
const policyDefinitionSchema = z.object({

  allow: policyRulesSchema.optional(),
  deny: policyRulesSchema.optional(),
}).refine(
  policy => policy.allow !== undefined || policy.deny !== undefined,
  'Policy must have at least allow or deny',
)

/**
 * Schema for policy input.
 * Accepts rules directly or { allow, deny } config.
 */
export const policyInputSchema = z.union([
  policyRulesSchema,
  policyDefinitionSchema,
])


/**
 * Schema for simple format input { allow: Pattern, deny?: Pattern }.
 * Used for auto-conversion to multi-prop format.
 */
export const simplePolicyDefinitionSchema = z.object({

  allow: patternSchema.optional(),
  deny: patternSchema.optional(),
}).refine(
  policy => policy.allow !== undefined || policy.deny !== undefined,
  'Simple policy must have at least allow or deny',
)

export type SimplePolicyDefinition = z.infer<typeof simplePolicyDefinitionSchema>
