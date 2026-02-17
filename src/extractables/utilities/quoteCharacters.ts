import { type Predicate } from '~/types/Predicate'



const isPrintableAsciiCharacter: Predicate<number> = code => code >= 32 && code <= 126

/**
 * Characters safe inside bash quotes: printable ASCII (32–126), tab (9), and newline (10).
 * Tab and newline are literal inside quotes — they don't trigger command separation.
 */
export const isSafeQuotedCharacter: Predicate<number> = code => (
  isPrintableAsciiCharacter(code) || code === 9 || code === 10
)

/**
 * Characters still dangerous inside bash double quotes:
 * - `$` triggers variable expansion (`$HOME`, `${var}`, `$(cmd)`)
 * - backtick triggers legacy command substitution
 *
 * Single quotes neutralize both — no exclusions needed there.
 */
export const EXCLUDED_DOUBLE_QUOTE_CHARACTERS = new Set([
  '$', // variable expansion, still active inside double quotes
  '`', // command substitution, still active inside double quotes
])
