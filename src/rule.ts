import { type Field } from './field'
import { type MatchResult } from './types/MatchResult'
import { type NonEmptyArray } from './types/NonEmptyArray'
import { type RequireAtLeastOne } from './types/RequireAtLeastOne'
import { type Validator } from './validable'



/**
 * A rule definition for policy matching.
 * At least one property must be defined.
 * Missing properties default to accept-all (no policies).
 * `allow`/`deny` are forbidden to prevent mixing with structured format.
 */
export type RuleDefinition<TPatternMap extends Record<string, unknown> = Record<string, unknown>> = (
  & RequireAtLeastOne<Partial<TPatternMap>>
  & { allow?: never; deny?: never }
)


/**
 * A rule is a function that matches tool input against patterns.
 * - On success: returns last matched field and pattern
 * - On failure: returns first failed field and its value
 */
export type Rule<TKeys extends string> = (
  input: Record<string, unknown>,
) => MatchResult<
  { field: Field<TKeys>; pattern: string | symbol },
  { field: Field<TKeys>; value: string }
>


/**
 * Creates a Rule from input.
 *
 * @param input - RuleDefinition
 * @param fields - Non-empty array of normalized Fields
 * @returns Rule function that matches tool input
 */
export const Rule = <TKeys extends string>(
  input: RuleDefinition<Record<TKeys, unknown>>,
  fields: NonEmptyArray<Field<TKeys>>,
): Rule<TKeys> => {

  const _validators = Object.fromEntries(
    fields.map(field => {

      const patternValue = (input as Record<string, unknown>)[field.name]

      const validator: Validator = patternValue !== undefined
        ? field.validableFactory(patternValue).validate
        : field.validableFactory().validate

      return [field.name, validator]
    }),
  ) as Record<TKeys, Validator>

  return toolInput => {

    let lastField: Field<TKeys> = fields[0]
    let lastPattern: string | symbol = ''

    for (const field of fields) {

      const value = String(toolInput[field.name] ?? '')

      const pattern = _validators[field.name](value)

      if (pattern === undefined)
        return { matched: false, failure: { field, value } }

      lastField = field
      lastPattern = pattern
    }

    return { matched: true, match: { field: lastField, pattern: lastPattern } }
  }
}
