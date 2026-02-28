# Guard factories

Each guard factory pre-configures the fields to validate for a specific Claude Code tool.

---

## Reference table

| Guard | Fields | Import |
|-------|--------|--------|
| `BashToolGuard` | `command` | `tool-guard/guards/bash` |
| `ReadToolGuard` | `file_path` | `tool-guard/guards/read` |
| `WriteToolGuard` | `file_path` | `tool-guard/guards/write` |
| `EditToolGuard` | `file_path` | `tool-guard/guards/edit` |
| `MultiEditToolGuard` | `file_path` | `tool-guard/guards/multiEdit` |
| `GlobToolGuard` | `path`, `pattern` | `tool-guard/guards/glob` |
| `GrepToolGuard` | `path`, `pattern` | `tool-guard/guards/grep` |
| `LSToolGuard` | `path` | `tool-guard/guards/ls` |
| `LSPToolGuard` | `filePath`, `operation` | `tool-guard/guards/lsp` |
| `NotebookEditToolGuard` | `notebook_path` | `tool-guard/guards/notebookEdit` |
| `NotebookReadToolGuard` | `notebook_path` | `tool-guard/guards/notebookRead` |
| `WebFetchToolGuard` | `url` | `tool-guard/guards/webFetch` |
| `WebSearchToolGuard` | `query` | `tool-guard/guards/webSearch` |
| `TaskToolGuard` | `subagent_type` | `tool-guard/guards/task` |
| `ListMcpResourcesToolGuard` | `server` | `tool-guard/guards/listMcpResources` |
| `ReadMcpResourceToolGuard` | `server`, `uri` | `tool-guard/guards/readMcpResource` |

---

## File tools

All validate the `file_path` property from tool input.

```typescript
import { ReadToolGuard } from 'tool-guard/guards/read'
import { WriteToolGuard } from 'tool-guard/guards/write'
import { EditToolGuard } from 'tool-guard/guards/edit'
import { MultiEditToolGuard } from 'tool-guard/guards/multiEdit'

// Allow reading all files except sensitive ones
ReadToolGuard({ allow: ['**/*'], deny: ['**/.env', '~/.ssh/*'] })

// Only allow writing to source files
WriteToolGuard({ allow: ['src/**/*.ts', '*.json'] })

// Only allow editing TypeScript files in src/
EditToolGuard({ allow: ['src/**/*.ts'] })

// Allow editing any TypeScript file
MultiEditToolGuard({ allow: ['**/*.ts'] })
```

---

## Search tools

Glob and Grep validate both `pattern` and `path`. LS validates only `path`.

```typescript
import { GlobToolGuard } from 'tool-guard/guards/glob'
import { GrepToolGuard } from 'tool-guard/guards/grep'
import { LSToolGuard } from 'tool-guard/guards/ls'

// Allow glob searches only in src/ and tests/
GlobToolGuard({
  allow: { pattern: ['**/*.ts', '**/*.json'], path: ['src/**', 'tests/**'] },
})

// Allow any search pattern but only in src/
GrepToolGuard({
  allow: { pattern: ['*'], path: ['src/**', 'tests/**'] },
  deny: { path: ['vendor/**'] },
})

// Allow listing directories in project only
LSToolGuard({ allow: ['src/**', 'tests/**'], deny: ['node_modules/**'] })
```

---

## Bash

Validates the `command` property. Uses [command templates](./command-templates.md) instead of glob patterns.

```typescript
import { BashToolGuard } from 'tool-guard/guards/bash'
import { command, spread } from 'tool-guard/command'
import { greedy } from 'tool-guard/extractables/greedy'

// Allow git and pnpm commands, block force push
BashToolGuard({
  allow: [command`git ${greedy}`, command`pnpm ${greedy}`],
  deny: [command`git push --force ${greedy}`],
})
```

---

## LSP

Validates `operation` and `filePath`.

```typescript
import { LSPToolGuard } from 'tool-guard/guards/lsp'

// Allow read-only operations on TypeScript files
LSPToolGuard({
  allow: {
    operation: ['goToDefinition', 'hover', 'findReferences'],
    filePath: ['**/*.ts', '**/*.tsx'],
  },
  deny: { operation: ['rename'] },
})
```

---

## Notebooks

Both validate the `notebook_path` property.

```typescript
import { NotebookEditToolGuard } from 'tool-guard/guards/notebookEdit'
import { NotebookReadToolGuard } from 'tool-guard/guards/notebookRead'

// Only allow editing notebooks in the notebooks/ directory
NotebookEditToolGuard({ allow: ['notebooks/**/*.ipynb'] })

// Allow reading notebooks in specific directories
NotebookReadToolGuard({ allow: ['notebooks/**', 'analysis/**'] })
```

---

## Web tools

```typescript
import { WebFetchToolGuard } from 'tool-guard/guards/webFetch'
import { WebSearchToolGuard } from 'tool-guard/guards/webSearch'

// Only allow fetching from specific domains
WebFetchToolGuard({ allow: ['https://docs.anthropic.com/*', 'https://github.com/*'] })

// Allow any search query
WebSearchToolGuard({ allow: ['*'] })
```

---

## Agent & MCP tools

```typescript
import { TaskToolGuard } from 'tool-guard/guards/task'
import { ListMcpResourcesToolGuard } from 'tool-guard/guards/listMcpResources'
import { ReadMcpResourceToolGuard } from 'tool-guard/guards/readMcpResource'

// Only allow Explore and Plan agents
TaskToolGuard({ allow: ['Explore', 'Plan'], deny: ['general-purpose'] })

// Allow listing resources from specific MCP servers
ListMcpResourcesToolGuard({ allow: ['my-server', 'another-server'] })

// Allow reading specific resources from specific servers
ReadMcpResourceToolGuard({
  allow: { server: ['my-server'], uri: ['resource://documents/*'] },
})
```

---

## Custom guards

### With ToolGuardFactory

```typescript
import { ToolGuardFactory } from 'tool-guard/guard'

ToolGuardFactory(['action'])({
  allow: ['read', 'list'],
  deny: ['delete'],
})
```

### With a function

```typescript
input => {
  if (String(input.action) === 'dangerous')
    return { allowed: false, reason: 'Blocked', suggestion: 'Use a safe action' }
  return { allowed: true }
}
```

Custom guard return values are validated with Zod — `allowed` must be a strict boolean (`true`/`false`), not a truthy value like `"yes"`. Invalid returns are treated as deny (fail-safe).
