# Security model

tool-guard implements multiple layers of defense to prevent command injection, path traversal, and policy bypass.

---

## Command composition splitting

Bash commands are split by `&&`, `||`, `|`, `;` while respecting all three quote types (`"`, `'`, `` ` ``). Each part is validated independently — a composed command is allowed **only if every part** matches an allowed pattern.

### What's split

| Operator | Split? | Why |
|----------|--------|-----|
| `&&` | Yes | AND operator |
| `\|\|` | Yes | OR operator |
| `\|` | Yes | Pipe |
| `;` | Yes | Sequence |
| `&` | No | Blocked at extraction level (prevents backgrounding) |
| `\n` | No | Blocked at extraction level (outside printable ASCII) |

### Why `&` and `\n` are blocked, not split

Splitting them would allow partial matches: `git status & rm -rf /` would validate `git status` as allowed and `rm -rf /` separately. Blocking them entirely is safer — the whole command is rejected.

---

## Quote-aware extraction

All extractables handle bash quoting semantics:

### Double quotes

- Characters allowed: printable ASCII (32–126) + tab (9) + newline (10)
- **Excluded**: `$` and `` ` `` — bash interprets them for variable expansion (`$HOME`, `${var}`, `$(cmd)`) and command substitution
- Backslash escapes: `\"` → literal `"`, `\\` → literal `\`, any `\X` → literal `X`

### Single quotes

- Characters allowed: printable ASCII (32–126) + tab (9) + newline (10)
- **No escape sequences** — backslash is literal (bash behavior)
- Everything inside is literal

### Backticks

- Rejected by all extractors (defense-in-depth)
- Tracked during composition splitting to prevent incorrect splitting of operators inside command substitution (e.g. `` echo `cmd | other` ``)

---

## Dangerous character blocking

Shell metacharacters are blocked at extraction level in the greedy charset:

| Character | Why it's dangerous |
|-----------|-------------------|
| `$` | Variable expansion (`$HOME`), command substitution (`$(cmd)`, `${var}`) |
| `` ` `` | Legacy command substitution |
| `<` | Input redirection, heredoc (`<<`) |
| `>` | Output redirection |
| `(` | Subshell, command substitution `$(cmd)` |
| `)` | Subshell closing |
| `&` | Background execution, AND operator (`&&`) |

Newline (10) is naturally outside printable ASCII (32–126), so it's blocked by the charset definition itself.

---

## Path scope isolation

### How path resolution works

1. **Internal paths**: resolved relative to `CLAUDE_PROJECT_DIR` (or `cwd`)
2. **External paths**: must be absolute (start with `/`)
3. **Symlinks**: resolved through the filesystem to get the real path

For non-existent files (e.g. Write targets), symlinks in parent directories are resolved to prevent bypass via symlinked directories.

### TOCTOU limitation

There is an inherent race condition (Time-of-Check-to-Time-of-Use) between resolving symlinks at validation time and Claude Code actually using the path. An attacker with filesystem access could re-point a symlink after resolution but before use. **The threat model assumes the attacker does not have local filesystem access.**

---

## Policy evaluation

### Algorithm

1. **Global denies first** (fast rejection) — deny patterns without a corresponding allow
2. **First-match on scoped policies**:
   - Allow match found → check scoped deny → deny match → **denied** (hard reject)
   - Allow match found → no deny match → **allowed**
   - No allow match → continue to next policy
3. **No match** → **denied** (fail-safe)

### Fail-safe defaults

- Tool not in config → **denied**
- Config file not found → **denied**
- Custom guard returns invalid value → **denied** (Zod validation fails)
- Script error → **denied** (caught, logged, deny returned)
- Boolean `false` → **denied**

---

## Config loading

Config files are loaded via `jiti` (dynamic TypeScript import without compilation). This executes arbitrary TypeScript/JavaScript code from the config file.

**Trust model**: same as `eslint.config.js` or `webpack.config.js` — the config file is developer-authored source code, not untrusted input.
