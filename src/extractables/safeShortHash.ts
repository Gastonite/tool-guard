import { type Predicate } from '~/types/Predicate'
import { CharsetExtractableFactory } from './factories/charset'



const HEXADECIMAL_CHARACTERS = new Set('0123456789abcdef')

export const isSafeShortHash: Predicate<string> = value => (
  value.length >= 7
  && value.length <= 40
  && [...value].every(character => HEXADECIMAL_CHARACTERS.has(character))
)

export const SafeShortHash = CharsetExtractableFactory(HEXADECIMAL_CHARACTERS, isSafeShortHash)

export const safeShortHash = SafeShortHash()
