import { z } from 'zod'



/**
 * Schema for rule definition (record of field-dependent patterns).
 * Pattern format varies by Field (string for Read/Edit, CommandPattern for Bash).
 * Content validation is handled per-field via field.patternsSchema at Rule construction.
 */
export const ruleDefinitionSchema = z.record(z.string(), z.unknown())
