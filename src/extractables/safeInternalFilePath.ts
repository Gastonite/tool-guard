import { PathExtractableFactory } from './factories/path'



// eslint-disable-next-line import/no-unused-modules -- public API
export const SafeInternalFilePath = PathExtractableFactory({ type: 'file', scope: 'internal' })


export const safeInternalFilePath = SafeInternalFilePath()
