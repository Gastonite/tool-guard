import { PathExtractableFactory } from './factories/path'



// eslint-disable-next-line import/no-unused-modules -- public API
export const SafeExternalPath = PathExtractableFactory({ scope: 'external' })


export const safeExternalPath = SafeExternalPath()
