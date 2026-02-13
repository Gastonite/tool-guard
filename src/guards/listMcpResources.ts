import { ToolGuardFactory } from '../guard'



/**
 * Policy factory for the ListMcpResources tool.
 * Extracts and validates the 'server' property from tool input.
 *
 * @example
 * // Allow listing resources from specific MCP servers
 * ListMcpResources: ListMcpResourcesToolGuard(['my-server', 'another-server'])
 */
export const ListMcpResourcesToolGuard = ToolGuardFactory(['server'])
