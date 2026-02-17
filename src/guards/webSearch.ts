import { ToolGuardFactory } from '~/guard'



/**
 * Policy factory for the WebSearch tool.
 * Extracts and validates the 'query' property from tool input.
 *
 * @example
 * // Allow any search query
 * WebSearch: WebSearchToolGuard({ allow: ['*'] })
 */
export const WebSearchToolGuard = ToolGuardFactory(['query'])
