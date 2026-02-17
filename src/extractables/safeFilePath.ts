import { PathExtractableFactory } from './factories/path'



export const SafeFilePath = PathExtractableFactory({ type: 'file', scope: 'internalUnlessExternalPrefixed' })

export const safeFilePath = SafeFilePath()
