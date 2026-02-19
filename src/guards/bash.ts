import { type CommandPattern, CommandValidable, commandBuildSuggestion, commandPatternSchema, splitComposedCommand } from '~/command'
import { ToolGuardFactory } from '~/guard'
import { type NonEmptyArray } from '~/types/NonEmptyArray'



type BashPatternMap = { command: NonEmptyArray<CommandPattern> }

/**
 * Policy factory for the Bash tool.
 * Wraps ToolGuardFactory with command composition splitting (&&, ||, |, ;).
 * Each part of a composed command is verified individually.
 *
 * @example
 * // Allow git and pnpm commands, block force push
 * Bash: BashToolGuard({
 *   allow: [command`git ${greedy}`, command`pnpm ${greedy}`],
 *   deny: [command`git push --force ${greedy}`],
 * })
 */
export const BashToolGuard: ToolGuardFactory<BashPatternMap> = (...configs) => {

  const innerGuard = ToolGuardFactory([
    {
      name: 'command' as const,
      validableFactory: CommandValidable,
      buildSuggestion: commandBuildSuggestion,
      patternSchema: commandPatternSchema,
    },
  ])(...configs)

  return toolInput => {

    const parts = splitComposedCommand(String(toolInput.command ?? ''))

    // Empty command → deny (no command to validate)
    if (parts.length === 0)
      return {
        allowed: false,
        reason: 'Empty command',
        suggestion: 'Provide a non-empty command',
      }

    for (const part of parts) {

      const result = innerGuard({ command: part })

      if (!result.allowed)
        return result
    }

    return { allowed: true }
  }
}
