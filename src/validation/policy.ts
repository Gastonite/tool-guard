import { z } from 'zod'



/**
 * Creates a policy definition schema: `{ allow?: NonEmptyArray<T>, deny?: NonEmptyArray<T> }`
 * with at least one required. Empty arrays throw (config error, not "no restrictions").
 */

export const PolicyDefinitionSchema = <TSchema extends z.ZodTypeAny>(
  patternSchema: TSchema,
) => z.object({

  allow: z.array(patternSchema).nonempty().optional(),
  deny: z.array(patternSchema).nonempty().optional(),
}).refine(
  policy => policy.allow !== undefined || policy.deny !== undefined,
  'Policy must have at least allow or deny',
)

/** Pre-built schema for string-based policy definitions. Used by all extractable factories. */
export const stringPolicyDefinitionSchema = PolicyDefinitionSchema(z.string())
