


/**
 * Requires at least one key to be defined in a record.
 * Prevents empty records `{}` at the type level.
 */
export type RequireAtLeastOne<T> = {
  [K in keyof T]: Required<Pick<T, K>> & Partial<Omit<T, K>>
}[keyof T]
