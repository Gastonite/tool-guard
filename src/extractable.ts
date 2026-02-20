import { type PolicyDefinition } from './policy'
import { type Validable } from './validable'



/** Extraction interface: extends Validable with syntactic extraction. */
export type Extractable = (
  & Validable<string>
  & { extract: (input: string) => number | false }
)

/** Creates an Extractable, optionally configured with allow/deny policies. */
export type ExtractableFactory = (...policies: Array<PolicyDefinition<string>>) => Extractable
