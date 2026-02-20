# tool-guard

[![npm version](https://img.shields.io/npm/v/tool-guard.svg)](https://www.npmjs.com/package/tool-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A PreToolUse hook that **actually enforces** permissions in Claude Code — typed config, glob patterns, and injection-proof command validation.

---

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

Hooks are **actually enforced** by Claude Code before any tool execution. tool-guard provides a typed, injection-proof permission system built on hooks.

```
┌─────────────┐     stdin (JSON)     ┌──────────────┐     stdout (JSON)   ┌─────────────┐
│ Claude Code │ ───────────────────▶ │  tool-guard  │ ──────────────────▶ │ Claude Code │
│             │  { toolName, input } │              │  { allow | deny }   │  (enforced) │
└─────────────┘                      └──────┬───────┘                     └─────────────┘
                                            │
                                            ▼
                                 ┌────────────────────┐
                                 │  guard.config.ts   │
                                 └────────────────────┘
```

---

## Install

```bash
pnpm add -D tool-guard
```

Add the hook to `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": ".*",
      "hooks": [{
        "type": "command",
        "command": "pnpm exec tool-guard"
      }]
    }]
  }
}
```

Unconfigured tools are **denied by default**.

---

## Configuration

Create `.claude/guard.config.ts`. The key feature: **the same policy objects work in both ToolGuards and extractables**, so file restrictions are consistent across Read/Write/Edit tools and Bash commands.

```typescript
import { type PolicyDefinition } from 'tool-guard/policy'
import { defineGuard } from 'tool-guard/guard'
import { command, spread } from 'tool-guard/command'
import { BashToolGuard } from 'tool-guard/guards/bash'
import { ReadToolGuard } from 'tool-guard/guards/read'
import { WriteToolGuard } from 'tool-guard/guards/write'
import { EditToolGuard } from 'tool-guard/guards/edit'
import { GlobToolGuard } from 'tool-guard/guards/glob'
import { GrepToolGuard } from 'tool-guard/guards/grep'
import { SafeFilePath } from 'tool-guard/extractables/safeFilePath'
import { safeString } from 'tool-guard/extractables/safeString'
import { safeBranch } from 'tool-guard/extractables/safeBranch'
import { safeNumber } from 'tool-guard/extractables/safeNumber'
import { safePackage } from 'tool-guard/extractables/safePackage'

// ── Shared file policies ────────────────────────────────────────────────────
// Define once, reuse across guards AND extractables

const fileAccessPolicies: Array<PolicyDefinition<string>> = [
  { deny: ['.env', '*.env', '.env.*', '**/*.pem', '**/*.key'] },
]

const fileReadPolicies: Array<PolicyDefinition<string>> = [
  { allow: ['*'] },
  ...fileAccessPolicies,
]

const fileWritePolicies: Array<PolicyDefinition<string>> = [
  { allow: ['src/**', 'tests/**', '*.config.ts'] },
  ...fileAccessPolicies,
]

// ── Extractables with shared policies ───────────────────────────────────────
// Same policies, applied inside command templates

const readableFile = SafeFilePath(...fileReadPolicies)
const writableFile = SafeFilePath(...fileWritePolicies)

// ── Config ──────────────────────────────────────────────────────────────────

export default defineGuard({
  // File tools — same policies as the extractables above
  Read: ReadToolGuard(...fileReadPolicies),
  Write: WriteToolGuard(...fileWritePolicies),
  Edit: EditToolGuard(...fileWritePolicies),
  Glob: GlobToolGuard(...fileReadPolicies),
  Grep: GrepToolGuard(...fileReadPolicies),

  // Bash — extractables enforce the SAME file policies inside commands
  Bash: BashToolGuard({ allow: [
    // Read-only commands use readableFile (allow *, deny secrets)
    command`cat ${readableFile}`,
    command`head -n ${safeNumber} ${readableFile}`,

    // Write commands use writableFile (allow src/tests only, deny env)
    command`git add ${spread(writableFile)}`,
    command`git commit -m ${safeString}`,
    command`git checkout ${safeBranch}`,
    command`git push`,
    command`git pull`,

    // Package managers
    command`pnpm install`,
    command`pnpm add -D ${safePackage}`,
    command`pnpm test`,
    command`pnpm build`,
  ] }),
})
```

If `.env` is denied in `ReadToolGuard`, it's also denied in `cat .env` via `readableFile`. One source of truth.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Pattern matching](./docs/pattern-matching.md) | String glob, path patterns (picomatch), command patterns |
| [Command templates](./docs/command-templates.md) | Composition splitting, `spread()`, backtracking, security |
| [Extractables](./docs/extractables.md) | All extractables with imports, examples, and path scopes |
| [Guard factories](./docs/guards.md) | All 16 guard factories with field reference and examples |
| [Reusable policies](./docs/reusable-policies.md) | Shared deny arrays, command arrays, Vite env secrets preset |
| [Logging](./docs/logging.md) | Log levels, environment variables, denial output |
| [Security model](./docs/security.md) | Threat model, quote-aware extraction, TOCTOU, fail-safe defaults |

---

## Comparison with native permissions

| | Native `permissions` | tool-guard |
|--|---------------------|------------|
| Deny Read/Write/Edit | **Ignored** | Enforced |
| Deny Bash | Partial | Enforced |
| Command injection protection | None | `command` template + extractables |
| Path traversal protection | None | Scope-isolated path extractables |
| Type-safe config | No | Full TypeScript with autocompletion |
| Custom validation | No | Guard functions + extractable policies |
| Logging | No | Configurable (file + stderr) |

---

## Contributing

```bash
pnpm install
pnpm test       # 640+ tests
pnpm lint       # tsc + eslint
pnpm build
```

---

## License

MIT — [Clément Pasquier](https://github.com/Gastonite)
