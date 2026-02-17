import { type Predicate } from '~/types/Predicate'
import { CharsetExtractableFactory } from './factories/charset'



const URL_CHARACTERS = new Set(`abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:/.?#[]@!$&'()*+,;=-_%~`)

export const isSafeUrl: Predicate<string> = value => {

  try {

    const url = new URL(value)

    if (url.protocol !== 'http:' && url.protocol !== 'https:')
      return false

    if (url.username || url.password)
      return false

    return true
  } catch {

    return false
  }
}

export const SafeUrl = CharsetExtractableFactory(URL_CHARACTERS, isSafeUrl)

export const safeUrl = SafeUrl()
