import { ToolGuardFactory } from '~/guard'



/**
 * Policy factory for the Task tool.
 * Extracts and validates the 'subagent_type' property from tool input.
 *
 * @example
 * // Only allow Explore and Plan agents
 * Task: TaskToolGuard({
 *   allow: ['Explore', 'Plan'],
 *   deny: ['general-purpose'],  // Block general-purpose agent
 * })
 */
export const TaskToolGuard = ToolGuardFactory(['subagent_type'])
