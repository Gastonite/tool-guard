import { type NonEmptyArray } from './NonEmptyArray'



/**
 * One or more values: single value or non-empty array.
 */
export type OneOrMany<T> = T | NonEmptyArray<T>
