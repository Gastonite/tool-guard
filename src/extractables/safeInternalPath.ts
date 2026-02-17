import { PathExtractableFactory } from './factories/path'



// eslint-disable-next-line import/no-unused-modules -- public API
export const SafeInternalPath = PathExtractableFactory({ scope: 'internal' })


export const safeInternalPath = SafeInternalPath()
