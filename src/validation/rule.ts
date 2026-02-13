import { z } from 'zod'



/**
 * Schema for pattern (glob pattern or array of patterns).
 * Accepts string or string array.
 * Empty array is allowed (fail-safe: denies all).
 */
export const patternSchema = z.union([
  z.string().min(1, 'Pattern must be a non-empty string'),
  z.array(z.string().min(1, 'Pattern items must be non-empty strings')),
])

export type Pattern = z.infer<typeof patternSchema>



/**
 * Schema for rule definition (record of patterns).
 * At least one property must be defined, but we can't enforce that statically
 * with Zod for dynamic keys. Runtime check handles this.
 */
export const ruleDefinitionSchema = z.record(z.string(), patternSchema)

/**
 * Schema for rule input (wildcard or rule definition).
 */
export const ruleInputSchema = z.union([z.literal('*'), ruleDefinitionSchema])
