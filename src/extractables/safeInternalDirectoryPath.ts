import { PathExtractableFactory } from './factories/path'



// eslint-disable-next-line import/no-unused-modules -- public API
export const SafeInternalDirectoryPath = PathExtractableFactory({ type: 'directory', scope: 'internal' })


export const safeInternalDirectoryPath = SafeInternalDirectoryPath()
