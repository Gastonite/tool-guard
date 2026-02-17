import { type Predicate } from '~/types/Predicate'
import { FixedLengthExtractableFactory } from './factories/fixedLength'



const HEXADECIMAL_CHARACTERS = new Set('0123456789abcdef')

export const isSafeCommitHash: Predicate<string> = value => (
  value.length === 40
  && [...value].every(character => HEXADECIMAL_CHARACTERS.has(character))
)

export const SafeCommitHash = FixedLengthExtractableFactory(HEXADECIMAL_CHARACTERS, 40, isSafeCommitHash)

export const safeCommitHash = SafeCommitHash()
