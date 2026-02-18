# Plan : Suppression sucre syntaxique, type-safety policies, correction doc

## Contexte

Deux asymétries entre guards et extractables :

1. **Format des policies** : les guards requièrent `{ allow: [...] }`, les extractables acceptent aussi `Factory(['a'])` (array shorthand). Aligner : `{ allow, deny }` partout.
2. **Type-safety** : les guards ont `ToolGuardFactoryInput<TPatternMap>` (typé), les extractables ont `Array<unknown>` (pas typé). `Greedy(42, true, null)` compile.

**Solution** : mutualiser `SimplePolicyDefinition<TPattern>` (exporté depuis `policy.ts`, rendu générique) et l'utiliser des deux côtés. ✅ Confirmé par l'utilisateur.

---

## Étape 1 — Type partagé : `SimplePolicyDefinition<TPattern>`

**Fichier** : `src/policy.ts`

Rendre `SimplePolicyDefinition` générique et l'exporter :

```typescript
// AVANT (non exporté, non générique)
type SimplePolicyDefinition = { allow?: unknown; deny?: unknown }

// APRÈS (exporté, générique)
export type SimplePolicyDefinition<TPattern = unknown> = {
  allow?: Array<TPattern>
  deny?: Array<TPattern>
}
```

> Note : `allow?: unknown` → `allow?: Array<TPattern>` ajoute la contrainte "doit être un array" à compile-time. Pas de breaking change runtime (Zod valide déjà).

## Étape 2 — Typer les extractables

| Fichier | Avant | Après |
|---|---|---|
| `src/extractable.ts` | `(...policies: Array<unknown>) => Extractable` | `(...policies: Array<SimplePolicyDefinition<string>>) => Extractable` |
| `src/validable.ts` | `ValidableFactory<TPattern = unknown> = (...policies: Array<TPattern>)` | `ValidableFactory<TPattern = string> = (...policies: Array<SimplePolicyDefinition<TPattern>>)` |
| `src/extractables/greedy.ts` | `(...policies: Array<unknown>)` | `(...policies: Array<SimplePolicyDefinition<string>>)` |
| `src/extractables/safeString.ts` | `SafeString: ExtractableFactory` | Hérite du nouveau type automatiquement |
| `src/extractables/factories/path.ts` | `((...policies: Array<unknown>) => Extractable)` | `ExtractableFactory` (utilise le type modifié) |
| `src/extractables/factories/charset.ts` | retourne `ExtractableFactory` | Hérite automatiquement |
| `src/extractables/factories/fixedLength.ts` | retourne `ExtractableFactory` | Hérite automatiquement |

Vérifier aussi :
- `src/command.ts` : `CommandValidable = (...policies: Array<unknown>)` → `Array<SimplePolicyDefinition<CommandPattern>>`
- `src/utilities/parseStringPolicies.ts` : garde `Array<unknown>` en interne (runtime validation) — OK

## Étape 3 — Schema Zod : `stringPolicyDefinitionSchema`

**Fichier** : `src/validation/policy.ts`

Ajouter un schéma Zod pour les policy definitions à base de strings (extractables) :

```typescript
import { stringPatternSchema } from './stringPattern'

/**
 * Schema for string-based policy definition ({ allow?, deny? } with at least one required).
 * Used by all extractable factories for runtime validation.
 */
export const stringPolicyDefinitionSchema = z.object({
  allow: z.array(stringPatternSchema).optional(),
  deny: z.array(stringPatternSchema).optional(),
}).refine(
  policy => policy.allow !== undefined || policy.deny !== undefined,
  'Policy must have at least allow or deny',
)
```

> Parallèle exact avec `policyDefinitionSchema` (guards structured), mais pour les patterns string.

## Étape 4 — Runtime : `parseStringPolicies.ts`

**Fichier** : `src/utilities/parseStringPolicies.ts`

Remplacer la validation manuelle par le schéma Zod. Plus besoin de gérer array/string — Zod les rejette :

```typescript
import { stringPolicyDefinitionSchema } from '~/validation/policy'

export const parseStringPolicies = (policies: Array<unknown>): Array<ParsedPolicy<string>> | undefined => {

  if (policies.length === 0)
    return undefined

  const result: Array<ParsedPolicy<string>> = []

  for (const policy of policies) {

    const parsed = stringPolicyDefinitionSchema.parse(policy)

    const allow = parsed.allow ?? []
    const deny = parsed.deny ?? []

    if (allow.length > 0 || deny.length > 0)
      result.push({ allow, deny })
  }

  return result.length > 0
    ? result
    : undefined
}
```

> - Array shorthand → Zod throw (pas un objet)
> - String nu → Zod throw (pas un objet)
> - `{ allow: [42] }` → Zod throw (pas `Array<string>`)
> - `{}` (ni allow ni deny) → Zod throw (refine)
> - Plus besoin de `assertStrings` ni de type casts manuels

## Étape 5 — Tests : 17 fichiers

### `parseStringPolicies.test.ts`

- "parses array of strings as allow-only" → "throws on array shorthand" (Zod rejects non-object)
- "handles multiple policies (variadic)" → utiliser `{ allow: [...] }`
- "skips non-object non-array policies" → "throws on string policy" (Zod rejects string)
- Ajouter : "throws on `{ allow: [42] }`" (Zod rejects non-string pattern)
- Ajouter : "throws on `{}`" (Zod refine: at least allow or deny)

### Extractable tests (12 fichiers, ~26 occurrences)

`Factory(['pattern'])` → `Factory({ allow: ['pattern'] })` :

`greedy.test.ts` (2), `safeString.test.ts` (2), `safeFilePath.test.ts` (3), `safePath.test.ts` (2), `safeDirectoryPath.test.ts` (2), `safeBranch.test.ts` (2), `safePackage.test.ts` (2), `safeNumber.test.ts` (2), `safeUrl.test.ts` (2), `safeShortHash.test.ts` (2), `safeCommitHash.test.ts` (2), `validable.test.ts` (3)

### Factory tests (3 fichiers, ~17 occurrences)

`path.test.ts` (~13), `charset.test.ts` (2), `fixedLength.test.ts` (2)

## Étape 6 — JSDoc

- `src/guards/listMcpResources.ts` : `@example` `['my-server']` → `{ allow: ['my-server'] }`

## Étape 7 — Documentation

### README.md
- `Guard([...])` → `Guard({ allow: [...] })`
- `Greedy('test', 'build', 'lint')` → `Greedy({ allow: ['test', 'build', 'lint'] })`

### docs/extractables.md
- Corriger toutes les factories PascalCase
- Documenter : `Factory()` (sans restriction) ou `Factory({ allow, deny })`

### docs/command-templates.md
- Corriger `Greedy('test', 'build', 'lint', 'install')`

### docs/guards.md
- `ListMcpResourcesToolGuard(['my-server'])` → `{ allow: ['my-server'] }`

### docs/reusable-policies.md
- `BashToolGuard([...])` → `BashToolGuard({ allow: [...] })`

### docs/security.md + docs/pattern-matching.md
- Relire — a priori OK

## Vérification

1. `pnpm test` — tous les tests passent
2. `pnpm lint-fix` — 0 erreurs
3. `pnpm build` — build propre
4. Grep `Array<unknown>` dans `src/` → ne doit rester que dans `parseStringPolicies.ts` (interne)
5. Grep `ToolGuard\(\[` dans docs/ → aucun résidu
6. Grep `Greedy\('` dans docs/ → aucun résidu
