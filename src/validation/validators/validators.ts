import { validateSafeBranch } from './safeBranch'
import { validateSafeCommitHash } from './safeCommitHash'
import { validateExternalFilePath } from './safeExternalFilePath'
import { validateFilePath } from './safeFilePath'
import { validateInternalFilePath } from './safeInternalFilePath'
import { validateSafeNumber } from './safeNumber'
import { validateSafePackage } from './safePackage'
import { validateSafeShortHash } from './safeShortHash'
import { validateSafeString } from './safeString'
import { validateSafeUrl } from './safeUrl'



/** Validator function type */
export type Validator = (value: string) => boolean

/** Available validator names */
export type ValidatorName = (
  | 'SAFE_BRANCH'
  | 'SAFE_COMMIT_HASH'
  | 'SAFE_EXTERNAL_FILE_PATH'
  | 'SAFE_FILE_PATH'
  | 'SAFE_INTERNAL_FILE_PATH'
  | 'SAFE_NUMBER'
  | 'SAFE_PACKAGE'
  | 'SAFE_SHORT_HASH'
  | 'SAFE_STRING'
  | 'SAFE_URL'
)

/**
 * Registry mapping placeholder names to their validator functions.
 * Used by getValidator() for dynamic lookup.
 */
const _validators: Record<string, Validator> = {
  SAFE_BRANCH: validateSafeBranch,
  SAFE_COMMIT_HASH: validateSafeCommitHash,
  SAFE_EXTERNAL_FILE_PATH: validateExternalFilePath,
  SAFE_FILE_PATH: validateFilePath,
  SAFE_INTERNAL_FILE_PATH: validateInternalFilePath,
  SAFE_NUMBER: validateSafeNumber,
  SAFE_PACKAGE: validateSafePackage,
  SAFE_SHORT_HASH: validateSafeShortHash,
  SAFE_STRING: validateSafeString,
  SAFE_URL: validateSafeUrl,
}

/**
 * Get a validator function by placeholder name.
 * @param name - The validator name (e.g., 'SAFE_FILE_PATH')
 * @returns The validator function, or undefined if not found
 */
export const getValidator = (name: string): Validator | undefined => _validators[name]
