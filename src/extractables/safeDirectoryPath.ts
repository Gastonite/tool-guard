import { PathExtractableFactory } from './factories/path'



export const SafeDirectoryPath = PathExtractableFactory({ type: 'directory', scope: 'internalUnlessExternalPrefixed' })


export const safeDirectoryPath = SafeDirectoryPath()
