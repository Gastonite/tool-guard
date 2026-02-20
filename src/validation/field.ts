import { z } from 'zod'
import { type ValidableFactory } from '~/validable'
import { isFunction } from '../utilities/isFunction'



// eslint-disable-next-line  import/no-unused-modules -- public API
export const stringFieldDefinitionSchema = z.object({
  name: z.string().min(1, 'Field name must be a non-empty string'),
})

// eslint-disable-next-line  import/no-unused-modules -- public API
export const customFieldDefinitionSchema = stringFieldDefinitionSchema.extend({
  validableFactory: z.custom<ValidableFactory>(isFunction, 'validableFactory must be a function'),
  buildSuggestion: z.custom<(value: string) => string>(isFunction, 'buildSuggestion must be a function'),
  patternSchema: z.custom<z.ZodType>(value => value instanceof z.ZodType, 'patternSchema must be a ZodType'),
  valueSchema: z.custom<z.ZodType>(value => value instanceof z.ZodType, 'valueSchema must be a ZodType').optional(),
})

export const fieldDefinitionSchema = z.union([
  z.string().min(1, 'Field name must be a non-empty string'),
  customFieldDefinitionSchema,
  stringFieldDefinitionSchema,
])
