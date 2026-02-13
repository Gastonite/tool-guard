import { ToolGuardFactory } from '../guard'



/**
 * Policy factory for the WebFetch tool.
 * Extracts and validates the 'url' property from tool input.
 *
 * @example
 * // Only allow fetching from specific domains
 * WebFetch: WebFetchToolGuard({
 *   allow: ['https://docs.anthropic.com/*', 'https://github.com/*'],
 * })
 */
export const WebFetchToolGuard = ToolGuardFactory(['url'])
