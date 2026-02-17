import { type Predicate } from '~/types/Predicate'
import { CharsetExtractableFactory } from './factories/charset'



const PATH_CHARACTERS = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_./-')

export const isSafeBranch: Predicate<string> = value => (
  value !== ''
  && !value.startsWith('-')
  && !value.startsWith('.')
  && [...value].every(character => PATH_CHARACTERS.has(character))
)

export const SafeBranch = CharsetExtractableFactory(PATH_CHARACTERS, isSafeBranch)

export const safeBranch = SafeBranch()
