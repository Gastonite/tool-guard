import picomatch from 'picomatch'
import { type ExtractableFactory } from '~/extractable'
import { acceptAllSymbol, PolicyEvaluator } from '~/policyEvaluator'
import { type Predicate } from '~/types/Predicate'
import { parseStringPolicies } from '~/utilities/parseStringPolicies'
import { resolveProjectPath } from '~/utilities/resolveProjectPath'
import { CharsetExtractableFactory } from './charset'



const PATH_CHARACTERS = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_./-')
const EXTERNAL_PREFIX = 'external:'

export type PathExtractableOptions = {
  type?: 'file' | 'directory'
  scope: 'internal' | 'external' | 'internalUnlessExternalPrefixed' | false
}

/**
 * Built-in ExtractableFactory for paths, configurable via options.
 * Returns an Extractable usable in command templates and ToolGuards.
 */
export const PathExtractableFactory = (options: PathExtractableOptions): ExtractableFactory => {

  const isSafePath: Predicate<string> = value => {

    if (options.type === 'file' && value === '')
      return false

    if (value === '')
      return true

    if (![...value].every(character => PATH_CHARACTERS.has(character)))
      return false

    if (options.scope === false)
      return true

    if (options.scope === 'internal')
      return resolveProjectPath(value).internal

    if (options.scope === 'external')
      return !resolveProjectPath(value).internal

    // internalUnlessExternalPrefixed : accept both internal and external
    return true
  }

  const baseFactory = CharsetExtractableFactory(PATH_CHARACTERS, isSafePath)

  return (...policies) => {

    const parsedPolicies = parseStringPolicies(policies)

    if (parsedPolicies !== undefined && options.scope !== 'internalUnlessExternalPrefixed') {

      const externalPrefixed = parsedPolicies
        .flatMap(policy => [...policy.allow, ...policy.deny])
        .find(pattern => pattern.startsWith(EXTERNAL_PREFIX))

      if (externalPrefixed)
        throw new Error(`Pattern '${externalPrefixed}' uses 'external:' prefix but scope is '${String(options.scope)}'. The 'external:' prefix is only valid with scope 'internalUnlessExternalPrefixed'.`)
    }

    const base = baseFactory(...policies)

    if (parsedPolicies === undefined) {

      return {
        extract: base.extract,
        validate: value => {

          if (!isSafePath(value))
            return undefined

          if (options.scope === 'internalUnlessExternalPrefixed' && !resolveProjectPath(value).internal)
            return undefined

          return acceptAllSymbol
        },
      }
    }

    type ResolvedPathInfo = {
      normalizedValue: string
      internal: boolean
    }

    const testMatch = (pattern: string, info: ResolvedPathInfo): { matched: true; match: string } | { matched: false; failure: undefined } => {

      if (options.scope === 'internalUnlessExternalPrefixed') {

        if (info.internal && pattern.startsWith(EXTERNAL_PREFIX))
          return { matched: false, failure: undefined }

        if (!info.internal && !pattern.startsWith(EXTERNAL_PREFIX))
          return { matched: false, failure: undefined }

        const effectivePattern = pattern.startsWith(EXTERNAL_PREFIX)
          ? pattern.slice(EXTERNAL_PREFIX.length)
          : pattern

        return matchesPathPattern(effectivePattern, info.normalizedValue)
          ? { matched: true, match: effectivePattern }
          : { matched: false, failure: undefined }
      }

      return matchesPathPattern(pattern, info.normalizedValue)
        ? { matched: true, match: pattern }
        : { matched: false, failure: undefined }
    }

    const evaluator = PolicyEvaluator(parsedPolicies, testMatch)

    return {
      extract: base.extract,
      validate: value => {

        if (!isSafePath(value))
          return undefined

        const resolved = resolveProjectPath(value)
        const info: ResolvedPathInfo = {

          normalizedValue: resolved.internal
            ? resolved.relativePath
            : resolved.absolutePath,
          internal: resolved.internal,
        }

        const result = evaluator(info)

        return result.outcome === 'allowed'
          ? result.match
          : undefined
      },
    }
  }
}

// eslint-disable-next-line  import/no-unused-modules -- public API
export const matchesPathPattern = (pattern: string, value: string): boolean => (
  picomatch(pattern, { dot: true })(value)
)
