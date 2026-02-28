import { type SimplePolicyDefinition } from './policy'
import { type Validable } from './validable'



/** Extraction interface: extends Validable with syntactic extraction. */
export type Extractable = (
  & Validable
  & { extract: (input: string) => number | false }
)

/** Creates an Extractable, optionally configured with allow/deny policies. */
export type ExtractableFactory = (...policies: Array<SimplePolicyDefinition<string>>) => Extractable
