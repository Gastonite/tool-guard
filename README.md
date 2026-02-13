# claude-guard

[![npm version](https://img.shields.io/npm/v/claude-guard.svg)](https://www.npmjs.com/package/claude-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A **reliable** permission system for Claude Code using PreToolUse hooks.

## Why?

### The built-in `permissions` doesn't do what you think

Claude Code has a `permissions` setting in `settings.json` with `allow` and `deny` arrays. **This is not a security feature.** Here's what it actually does:

| Setting | What you might expect | What it actually does |
|---------|----------------------|----------------------|
| `allow: ["Bash(git *)"]` | "Only allow git commands" | "Don't ask me again for git commands" (auto-approve prompt) |
| `deny: ["Read(.env)"]` | "Block reading .env files" | Nothing. It's ignored for Read/Write/Edit tools. |

The `permissions` system is essentially a **prompt suppression mechanism**, not a security boundary:

- **`allow`** = "Auto-click Yes for me" — saves you from clicking approve
- **`deny`** = Broken for most tools (works partially for Bash only)

### Proof it's broken

Multiple GitHub issues confirm this:

- [#6699](https://github.com/anthropics/claude-code/issues/6699): *"deny permission system is completely non-functional"*
- [#6631](https://github.com/anthropics/claude-code/issues/6631): *"Permission Deny Configuration Not Enforced for Read/Write Tools"*
- [#8961](https://github.com/anthropics/claude-code/issues/8961): *"Claude Code arbitrarily ignoring deny rules"*

Example from issue #6631:
```json
// settings.json
{ "permissions": { "deny": ["Read(.env)"] } }
```
```
// Result: Claude reads .env anyway
✓ Successfully read .env file content
```

### The solution: PreToolUse hooks

Hooks are **actually enforced** by Claude Code before any tool execution. This package provides a reliable permission system using hooks.

## Installation

```bash
pnpm i -D claude-guard
```

Or with npm:

```bash
npm install -D claude-guard
```

## Quick Start

### 1. Create guard config

Create `.claude/guard.config.ts` in your project:

```typescript
import {
  BashToolGuard,
  EditToolGuard,
  GlobToolGuard,
  GrepToolGuard,
  ReadToolGuard,
  WriteToolGuard,
  defineGuard,
} from 'claude-guard'

export default defineGuard({
  // File operations - wildcards are safe here
  Read: ReadToolGuard({
    allow: ['*'],
    deny: ['*.env', '.env.*', '**/secrets/**'],
  }),
  Write: WriteToolGuard({
    allow: ['*'],
    deny: ['*.env'],
  }),
  Edit: EditToolGuard({
    allow: ['*'],
    deny: ['*.env'],
  }),
  Glob: GlobToolGuard(['*']),
  Grep: GrepToolGuard(['*']),

  // Bash - use SAFE_* placeholders, not wildcards
  Bash: BashToolGuard([
    'git status',
    'git log',
    'git diff',
    'git add ...SAFE_FILE_PATH',
    'git commit -m SAFE_STRING',
    'git checkout SAFE_BRANCH',
    'git push',
    'git pull',
    'pnpm install',
    'pnpm test',
    'pnpm build',
  ]),
})
```

### 2. Configure the hook

Add to `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm exec claude-guard"
          }
        ]
      }
    ]
  }
}
```

> **Note:** Use `npx claude-guard` if using npm instead of pnpm.

### 3. Done!

Claude Code will now **actually** respect your permission rules.

## Config Syntax

### ToolGuard Factories

Each tool uses a factory function that pre-configures the extractor:

```typescript
import {
  BashToolGuard,      // extractor: 'command'
  ReadToolGuard,      // extractor: 'file_path'
  WriteToolGuard,     // extractor: 'file_path'
  EditToolGuard,      // extractor: 'file_path'
  MultiEditToolGuard, // extractor: 'file_path'
  GlobToolGuard,      // extractor: 'pattern'
  GrepToolGuard,      // extractor: 'pattern'
  WebFetchToolGuard,  // extractor: 'url'
  WebSearchToolGuard, // extractor: 'query'
  TaskToolGuard,      // extractor: 'subagent_type'
  NotebookEditToolGuard, // extractor: 'notebook_path'
  ToolGuardFactory,   // for custom extractors
} from 'claude-guard'
```

### Array shorthand

Pass an array for allow-only policies:

```typescript
// These are equivalent:
BashToolGuard(['git status', 'git pull'])
BashToolGuard({ allow: ['git status', 'git pull'] })
```

### Object form

Use object form for deny and validate:

```typescript
ReadToolGuard({
  allow: ['*'],
  deny: ['*.env', '*.key'],
  validate: (path) => path.includes('..') ? 'No traversal' : undefined,
})
```

### Deny by default

Tools not in your config are **denied by default**. You must explicitly configure each tool you want to allow.

```typescript
export default defineGuard({
  // Only Read and Bash are configured
  // All other tools (Write, Edit, Task, etc.) are DENIED
  Read: ReadToolGuard(['*']),
  Bash: BashToolGuard(['git status']),
})
```

### Custom tools

For custom or MCP tools, use `ToolGuardFactory` with a custom extractor:

```typescript
export default defineGuard({
  // Create a guard for the 'operation' field
  LSP: ToolGuardFactory(['operation'])({
    allow: ['goToDefinition', 'findReferences'],
  }),

  // For complex logic, write a ToolGuard function directly
  CustomTool: (input) => {
    const action = String(input.action ?? '')
    if (action === 'dangerous') {
      return { allowed: false, reason: 'Blocked', suggestion: 'Use safe action' }
    }
    return { allowed: true }
  },
})
```

## Pattern Syntax

### WARNING: Avoid wildcards in Bash patterns

**Wildcards (`*`) in Bash patterns are dangerous.** Claude can bypass them using `&&`, `||`, `;`, or pipes:

```typescript
// DANGEROUS - Claude can bypass this:
BashToolGuard(['git *'])

// Claude can run:
// "git status && rm -rf /"     ← matches "git *"
// "git log; curl evil.com"     ← matches "git *"
```

**Always use SAFE_* placeholders instead:**

```typescript
// SAFE - injection characters are rejected:
BashToolGuard([
  'git commit -m SAFE_STRING',
  'git checkout SAFE_BRANCH',
  'git add ...SAFE_FILE_PATH',
])

// These are blocked:
// "git commit -m \"fix\" && rm -rf /"  ← SAFE_STRING rejects &&
// "git checkout main; curl evil.com"  ← SAFE_BRANCH rejects ;
```

### Glob patterns

| Pattern | Matches |
|---------|---------|
| `git status` | Exact match only |
| `git *` | Anything starting with "git " |
| `*.ts` | Anything ending with ".ts" |
| `src/*.ts` | "src/" + anything + ".ts" |
| `*` | Everything |

> **Rule of thumb:** Use SAFE_*_FILE_PATH for file tools when you need path boundary protection, and SAFE_* placeholders for Bash commands.

### WARNING: Glob patterns in file tools are vulnerable to path traversal

**Glob patterns like `src/*` can be bypassed** using path traversal:

```typescript
// VULNERABLE - Claude can bypass this:
ReadToolGuard(['src/*'])

// Claude can read:
// "src/../.env"     ← matches "src/*" but reads .env
// "src/../../etc/passwd" ← matches "src/*" but escapes project
```

**Use SAFE_*_FILE_PATH placeholders instead:**

```typescript
// SAFE - path traversal is blocked:
ReadToolGuard(['src/SAFE_INTERNAL_FILE_PATH'])

// These are blocked:
// "src/../.env"     ← SAFE_INTERNAL_FILE_PATH rejects traversal
// "../etc/passwd"   ← doesn't start with "src/"
```

| Placeholder | Use case |
|-------------|----------|
| `SAFE_INTERNAL_FILE_PATH` | Any file within project directory |
| `SAFE_EXTERNAL_FILE_PATH` | Absolute paths (e.g., `/usr/bin/node`) |
| `SAFE_FILE_PATH` | Either internal or external |

### SAFE_* Placeholders

**Use these instead of wildcards for Bash patterns.** They validate captured values and reject shell metacharacters:

| Placeholder | Description | Valid Example |
|-------------|-------------|---------------|
| `SAFE_STRING` | Quoted string with safe chars | `"fix bug"` |
| `SAFE_FILE_PATH` | Safe file path (no metacharacters) | `src/app.ts` |
| `SAFE_INTERNAL_FILE_PATH` | File path within project | `src/app.ts` |
| `SAFE_EXTERNAL_FILE_PATH` | Absolute file path | `/usr/bin/node` |
| `SAFE_NUMBER` | Positive integer | `42` |
| `SAFE_COMMIT_HASH` | Git SHA-1 (40 hex chars) | `abc123...` |
| `SAFE_SHORT_HASH` | Short git hash (7-40 chars) | `abc1234` |
| `SAFE_BRANCH` | Git branch name | `feature/new` |
| `SAFE_URL` | HTTP/HTTPS URL (no credentials) | `https://example.com` |
| `SAFE_PACKAGE` | npm package name | `@types/node` |

### Spread operator

Use `...` prefix for multiple space-separated values:

```typescript
BashToolGuard([
  // Matches: git add file1.ts file2.ts file3.ts
  'git add ...SAFE_FILE_PATH',
])
```

## Examples

### Whitelist mode (recommended)

```typescript
import {
  BashToolGuard,
  EditToolGuard,
  GlobToolGuard,
  GrepToolGuard,
  NotebookEditToolGuard,
  ReadToolGuard,
  TaskToolGuard,
  WebFetchToolGuard,
  WebSearchToolGuard,
  WriteToolGuard,
  defineGuard,
} from 'claude-guard'

export default defineGuard({
  // File operations (wildcards are safe here)
  Read: ReadToolGuard(['*']),
  Write: WriteToolGuard(['*']),
  Edit: EditToolGuard(['*']),
  Glob: GlobToolGuard(['*']),
  Grep: GrepToolGuard(['*']),
  NotebookEdit: NotebookEditToolGuard(['*']),

  // Git - use SAFE_* placeholders
  Bash: BashToolGuard([
    'git status',
    'git log',
    'git log *',  // Safe: git log options don't execute code
    'git diff',
    'git diff SAFE_FILE_PATH',
    'git add ...SAFE_FILE_PATH',
    'git commit -m SAFE_STRING',
    'git checkout SAFE_BRANCH',
    'git checkout -b SAFE_BRANCH',
    'git push',
    'git push origin SAFE_BRANCH',
    'git pull',
    'git merge SAFE_BRANCH',

    // Package managers - be specific
    'pnpm install',
    'pnpm add SAFE_PACKAGE',
    'pnpm add -D SAFE_PACKAGE',
    'pnpm test',
    'pnpm build',
    'pnpm lint',

    // Safe read-only commands
    'ls',
    'ls SAFE_FILE_PATH',
    'pwd',
    'cat SAFE_FILE_PATH',
    'head -n SAFE_NUMBER SAFE_FILE_PATH',
    'tail -n SAFE_NUMBER SAFE_FILE_PATH',
  ]),

  // Web tools
  WebFetch: WebFetchToolGuard(['*']),
  WebSearch: WebSearchToolGuard(['*']),

  // Agent tools
  Task: TaskToolGuard(['*']),
})
```

### Protect sensitive files (glob approach)

```typescript
import {
  EditToolGuard,
  ReadToolGuard,
  WriteToolGuard,
  defineGuard,
} from 'claude-guard'

export default defineGuard({
  Read: ReadToolGuard({
    allow: ['*'],
    deny: [
      '*.env',
      '.env.*',
      '**/secrets/**',
      '**/*.pem',
      '**/*.key',
      '**/credentials*',
    ],
  }),
  Write: WriteToolGuard({
    allow: ['*'],
    deny: ['*.env', '.env.*'],
  }),
  Edit: EditToolGuard({
    allow: ['*'],
    deny: ['*.env', '.env.*'],
  }),
})
```

### Restrict to specific directory (secure approach)

Using `SAFE_INTERNAL_FILE_PATH` prevents path traversal attacks:

```typescript
import {
  EditToolGuard,
  ReadToolGuard,
  WriteToolGuard,
  defineGuard,
} from 'claude-guard'

export default defineGuard({
  // Only allow files in src/ - path traversal is blocked
  Read: ReadToolGuard('src/SAFE_INTERNAL_FILE_PATH'),
  Write: WriteToolGuard('src/SAFE_INTERNAL_FILE_PATH'),
  Edit: EditToolGuard('src/SAFE_INTERNAL_FILE_PATH'),

  // Or allow entire project but block external files
  // Read: ReadToolGuard('SAFE_INTERNAL_FILE_PATH'),
})
```

## Environment Variables

| Variable | Values | Description |
|----------|--------|-------------|
| `CLAUDE_PROJECT_DIR` | path | Project root for `SAFE_INTERNAL_FILE_PATH` validation (default: `cwd`) |
| `GUARD_LOG` | `debug`, `info`, `warn`, `error` | Log level (default: `info`) |
| `GUARD_STDERR` | `true`, `false` | Also output logs to stderr (default: `false`) |

`SAFE_INTERNAL_FILE_PATH` uses `CLAUDE_PROJECT_DIR` to determine the project boundary. If not set, defaults to the current working directory.

## Logging

Logs are written to `.claude/logs/guard.log`.

- **`debug`**: All tool requests and decisions (verbose)
- **`info`**: Denied requests only (default, recommended)
- **`warn`**: Warnings and errors only
- **`error`**: Errors only

`GUARD_STDERR` is useful for manual testing when you want to see logs directly in the terminal instead of checking the log file.

```bash
# Debug mode - see all tool requests
GUARD_LOG=debug claude

# Debug with stderr output (for manual testing)
GUARD_LOG=debug GUARD_STDERR=true pnpm exec claude-guard
```

## How it works

1. Claude Code calls the hook before each tool execution
2. The hook receives tool name and input via stdin (JSON)
3. It checks against your `guard.config.ts` rules
4. It returns `allow` or `deny` via stdout (JSON)
5. Claude Code **enforces** the decision (unlike native permissions)

```
┌─────────────┐     stdin      ┌──────────────┐     stdout     ┌─────────────┐
│ Claude Code │ ──────────────▶│ claude-guard │ ──────────────▶│ Claude Code │
│             │   HookInput    │              │  HookResponse  │             │
└─────────────┘                └──────────────┘                └─────────────┘
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │ guard.config.ts  │
                          └────────────────────────┘
```

## Comparison

| Feature | Native `permissions` | This package |
|---------|---------------------|--------------|
| Deny Read/Write/Edit | Ignored | Enforced |
| Deny Bash commands | Partially works | Enforced |
| Allow patterns | Auto-approves prompts | Auto-approves |
| Wildcards | Unreliable | Full glob support |
| Injection protection | None | SAFE_* validators |
| Type-safe config | None | Full TypeScript |
| Custom validation | None | `validate` function |
| Logging | None | Configurable |

## Contributing

Contributions are welcome! Please open an issue or PR.

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Lint
pnpm lint
```

## License

MIT
