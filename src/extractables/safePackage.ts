import { type Predicate } from '~/types/Predicate'
import { CharsetExtractableFactory } from './factories/charset'



const PACKAGE_CHARACTERS = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@/._~^><=+-')
const PACKAGE_NAME_CHARACTERS = new Set('abcdefghijklmnopqrstuvwxyz0123456789-._~')
const PACKAGE_VERSION_CHARACTERS = new Set('abcdefghijklmnopqrstuvwxyz0123456789^~>=<.-')

const containsOnly = (value: string, characters: Set<string>): boolean => (
  [...value].every(character => characters.has(character))
)

export const isSafePackage: Predicate<string> = value => {

  if (value === '')
    return false

  // Split optional version: lodash@1.0.0 → ['lodash', '1.0.0']
  const firstVersionAt = value.startsWith('@')
    ? value.indexOf('@', 1)
    : value.indexOf('@')

  const namePart = firstVersionAt === -1
    ? value
    : value.slice(0, firstVersionAt)

  const versionPart = firstVersionAt === -1
    ? undefined
    : value.slice(firstVersionAt + 1)

  // Validate name: optional @scope/ prefix + name
  const nameSegments = namePart.startsWith('@')
    ? namePart.slice(1).split('/')
    : [namePart]

  if (nameSegments.length > 2 || nameSegments.some(segment => segment === ''))
    return false

  if (!nameSegments.every(segment => containsOnly(segment, PACKAGE_NAME_CHARACTERS)))
    return false

  // Validate version if present
  if (versionPart !== undefined && !containsOnly(versionPart, PACKAGE_VERSION_CHARACTERS))
    return false

  return true
}

export const SafePackage = CharsetExtractableFactory(PACKAGE_CHARACTERS, isSafePackage)

export const safePackage = SafePackage()
