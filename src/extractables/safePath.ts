import { PathExtractableFactory } from './factories/path'



export const SafePath = PathExtractableFactory({ scope: 'internalUnlessExternalPrefixed' })


export const safePath = SafePath()
