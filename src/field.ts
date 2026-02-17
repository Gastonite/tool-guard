import { z } from 'zod'
import { type NonEmptyArray } from './types/NonEmptyArray'
import { DefaultValidable, type ValidableFactory } from './validable'
import { fieldDefinitionSchema } from './validation/field'
import { stringPatternSchema } from './validation/stringPattern'



// ─── Types (user-facing) ──────────────────────────────────────────────────────

/** FieldDefinition without factory — matching via matchGlobPattern (string patterns). */
export type StringFieldDefinition<TKeys extends string> = {
  name: TKeys
}

/** FieldDefinition with factory — all or nothing, all props required. */
export type CustomFieldDefinition<TKeys extends string, TPattern = unknown> = {
  name: TKeys
  validableFactory: ValidableFactory<TPattern>
  buildSuggestion: (value: string) => string
  patternSchema: z.ZodType<TPattern>
}

/** FieldDefinition: string shorthand, StringFieldDefinition or CustomFieldDefinition. */
export type FieldDefinition<TKeys extends string> = (
  | TKeys
  | StringFieldDefinition<TKeys>
  | CustomFieldDefinition<TKeys>
)


/**
 * Infers the pattern type for each Field from a tuple of FieldDefinition.
 * patternSchema carries the type of a SINGLE pattern, NonEmptyArray is built automatically.
 */
export type InferPatternMap<TDefs extends ReadonlyArray<FieldDefinition<string>>> = {
  [TDef in TDefs[number] as TDef extends { name: infer TName extends string }
    ? TName
    : TDef extends string
      ? TDef
      : never]: TDef extends { patternSchema: z.ZodType<infer TPattern> }
    ? NonEmptyArray<TPattern>
    : NonEmptyArray<string>
}

// ─── Field ──────────────────────────────────────────────────────────────────

/** Normalized Field: 4 props always present. */
export type Field<TKeys extends string> = {
  name: TKeys
  buildSuggestion: (value: string) => string
  validableFactory: ValidableFactory
  patternsSchema: z.ZodType
}

/** Normalizes a FieldDefinition into a Field (4 props always present). */
export const Field = <TKeys extends string>(
  definition: FieldDefinition<TKeys>,
): Field<TKeys> => {

  fieldDefinitionSchema.parse(definition)

  if (typeof definition === 'string')
    definition = { name: definition }

  if ('validableFactory' in definition)
    return {
      name: definition.name,
      buildSuggestion: definition.buildSuggestion,
      validableFactory: definition.validableFactory,
      patternsSchema: z.array(definition.patternSchema).nonempty(),
    }

  return {
    name: definition.name,
    buildSuggestion: value => `Add '${value}' to allow.${definition.name}`,
    validableFactory: DefaultValidable,
    patternsSchema: z.array(stringPatternSchema).nonempty(),
  }
}
