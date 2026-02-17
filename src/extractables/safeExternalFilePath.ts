import { PathExtractableFactory } from './factories/path'



// eslint-disable-next-line import/no-unused-modules -- public API
export const SafeExternalFilePath = PathExtractableFactory({ type: 'file', scope: 'external' })


export const safeExternalFilePath = SafeExternalFilePath()
