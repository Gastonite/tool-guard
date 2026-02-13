import { z } from 'zod'



/**
 * Schema for ToolGuardFactory extractors parameter.
 * Always a non-empty array of non-empty strings.
 */
export const extractorsSchema = z.array(
  z.string().min(1, 'Extractor key must be non-empty'),
).nonempty('Extractors must have at least one key')

export type Extractors = z.infer<typeof extractorsSchema>
