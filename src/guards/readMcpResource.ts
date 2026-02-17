import { ToolGuardFactory } from '~/guard'



/**
 * Policy factory for the ReadMcpResource tool.
 * Extracts and validates 'server' and 'uri' properties from tool input.
 *
 * @example
 * // Allow reading specific resources from specific servers
 * ReadMcpResource: ReadMcpResourceToolGuard({
 *   allow: {
 *     server: ['my-server'],
 *     uri: ['resource://documents/*'],
 *   },
 * })
 */
export const ReadMcpResourceToolGuard = ToolGuardFactory(['server', 'uri'])
