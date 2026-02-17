import { type Predicate } from '~/types/Predicate'
import { CharsetExtractableFactory } from './factories/charset'



const DIGIT_CHARACTERS = new Set('0123456789')

export const isSafeNumber: Predicate<string> = value => (
  value.length > 0
  && [...value].every(character => DIGIT_CHARACTERS.has(character))
)

export const SafeNumber = CharsetExtractableFactory(DIGIT_CHARACTERS, isSafeNumber)

export const safeNumber = SafeNumber()
