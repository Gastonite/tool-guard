# Extractables

Extractables are typed validators you plug into [`command` templates](./command-templates.md). They perform two-phase validation:

1. **Extraction** (syntactic): how many characters can be parsed from the input?
2. **Validation** (semantic): does the extracted value pass security checks and policy matching?

---

## Two forms: camelCase and PascalCase

Each extractable comes in two forms:

- **`camelCase`** — default instance, no restrictions beyond the type's built-in safety checks
- **`PascalCase()`** — factory that accepts optional glob policies for further restriction

```typescript
command`cat ${safeFilePath}`                                // any safe file path
command`cat ${SafeFilePath({ allow: ['src/**'] })}`         // only files in src/
command`pnpm ${Greedy({ allow: ['test', 'build', 'lint', 'install'] })}` // only these subcommands
```

---

## Greedy

**Import:** `import { greedy, Greedy } from 'tool-guard/extractables/greedy'`

Matches any printable ASCII (32–126) except dangerous shell metacharacters: `$`, `` ` ``, `<`, `>`, `(`, `)`, `&`.

### Quote-aware extraction

Three modes:

| Mode | Charset | Escapes | Why |
|------|---------|---------|-----|
| **Outside quotes** | Printable ASCII minus metacharacters | None | Safe unquoted characters only |
| **Double quotes** | Printable ASCII + tab + newline, **minus `$` and `` ` ``** | `\"` → `"`, `\\` → `\` | Bash interprets `$` and `` ` `` in double quotes |
| **Single quotes** | Printable ASCII + tab + newline | None (all literal) | Bash treats everything as literal in single quotes |

`&` and `\n` are blocked at extraction level:
- `&` → prevents background execution (`git status &`)
- `\n` → prevents newline injection (outside printable ASCII 32–126)

```typescript
command`git ${greedy}`                            // any safe args
command`pnpm ${Greedy({ allow: ['test', 'build', 'lint'] })}`  // restricted to specific values
```

---

## SafeString

**Import:** `import { safeString, SafeString } from 'tool-guard/extractables/safeString'`

Matches a **quoted string** (`"..."` or `'...'`). Same security model as greedy for quote content.

Before policy evaluation, quotes are **stripped**: `"hello world"` is matched against policies as `hello world`.

```typescript
command`git commit -m ${safeString}`
command`echo ${SafeString({ allow: ['hello*'] })}`  // only strings starting with "hello"
```

---

## SafeNumber

**Import:** `import { safeNumber, SafeNumber } from 'tool-guard/extractables/safeNumber'`

Matches a **positive integer** (digits 0–9 only, no sign, no decimal).

```typescript
command`head -n ${safeNumber} ${safeFilePath}`
command`tail -n ${safeNumber} ${safeFilePath}`
```

---

## SafeBranch

**Import:** `import { safeBranch, SafeBranch } from 'tool-guard/extractables/safeBranch'`

Matches a **git branch name**: alphanumeric, `_`, `.`, `/`, `-`. Cannot start with `-` or `.`.

```typescript
command`git checkout ${safeBranch}`
command`git checkout -b ${safeBranch}`
command`git push origin ${safeBranch}`
command`git merge ${safeBranch}`
```

---

## SafePackage

**Import:** `import { safePackage, SafePackage } from 'tool-guard/extractables/safePackage'`

Matches a **npm package specifier**: name with optional `@scope` and optional `@version`.

Examples of valid values: `lodash`, `@types/node`, `react@18.2.0`, `@scope/pkg@latest`.

```typescript
command`pnpm add ${safePackage}`
command`pnpm add -D ${safePackage}`
command`npm install ${safePackage}`
```

---

## SafeUrl

**Import:** `import { safeUrl, SafeUrl } from 'tool-guard/extractables/safeUrl'`

Matches a valid **HTTP/HTTPS URL** without credentials.

```typescript
command`curl ${safeUrl}`
command`wget ${safeUrl}`
```

---

## SafeCommitHash

**Import:** `import { safeCommitHash, SafeCommitHash } from 'tool-guard/extractables/safeCommitHash'`

Matches exactly **40 hexadecimal characters** (full SHA-1 git hash).

```typescript
command`git show ${safeCommitHash}`
command`git revert ${safeCommitHash}`
```

---

## SafeShortHash

**Import:** `import { safeShortHash, SafeShortHash } from 'tool-guard/extractables/safeShortHash'`

Matches **7–40 hexadecimal characters** (short git hash).

```typescript
command`git cherry-pick ${safeShortHash}`
command`git diff ${safeShortHash}`
```

---

## Path extractables

Path extractables validate file and directory paths with **scope isolation**. Characters allowed: `a-zA-Z0-9`, `_`, `.`, `/`, `-`.

### Scope types

| Scope | Behavior |
|-------|----------|
| `auto` | Internal by default, external with `external:` prefix in policy pattern |
| `internal` | Must resolve within project directory — blocks `../../etc/passwd` |
| `external` | Must be absolute path — e.g. `/usr/bin/node` |

### All path extractables

| Extractable | Import | Type | Scope |
|-------------|--------|------|-------|
| `safePath` | `tool-guard/extractables/safePath` | both | auto |
| `safeFilePath` | `tool-guard/extractables/safeFilePath` | file | auto |
| `safeDirectoryPath` | `tool-guard/extractables/safeDirectoryPath` | directory | auto |
| `safeInternalPath` | `tool-guard/extractables/safeInternalPath` | both | internal |
| `safeInternalFilePath` | `tool-guard/extractables/safeInternalFilePath` | file | internal |
| `safeInternalDirectoryPath` | `tool-guard/extractables/safeInternalDirectoryPath` | directory | internal |
| `safeExternalPath` | `tool-guard/extractables/safeExternalPath` | both | external |
| `safeExternalFilePath` | `tool-guard/extractables/safeExternalFilePath` | file | external |
| `safeExternalDirectoryPath` | `tool-guard/extractables/safeExternalDirectoryPath` | directory | external |

### Symlink resolution

Paths are resolved through symlinks (including parent directories for non-existent files like Write targets) to prevent bypass via symlinked directories.

**TOCTOU note**: There is an inherent race condition between resolving symlinks and Claude Code using the path. The threat model assumes the attacker does not have local filesystem access.

### Usage

```typescript
import { safeFilePath, SafeFilePath } from 'tool-guard/extractables/safeFilePath'
import { safeInternalFilePath } from 'tool-guard/extractables/safeInternalFilePath'

// Any safe file path
command`cat ${safeFilePath}`

// Only files in src/ — with traversal protection
command`cat ${SafeFilePath({ allow: ['src/**'] })}`

// Strictly internal to project
command`cat ${safeInternalFilePath}`
```
