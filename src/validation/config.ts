import { z } from 'zod'



// ============================================================================
// Tool Policies Schema (for loadConfig)
// ============================================================================

/**
 * Schema for a single tool policy.
 * - `true` → allow all
 * - `false` → deny all
 * - `function` → custom policy function
 */
export const toolGuardSchema = z.union([
  z.boolean(),
  z.function(),
])


/**
 * Schema for the full permissions config.
 * Maps tool names to their policies.
 */
export const toolGuardsSchema = z.record(z.string(), toolGuardSchema)
