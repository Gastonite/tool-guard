# 🚀 npm publish checklist — v0.1.0

> `tool-guard` · State of the art · GitHub + npm · TypeScript + ESLint ✅ · Qualité ✅

---

## ⚡ Initialisation du projet

- [x] Choisir un nom de package unique — `tool-guard` réservé sur npm ✅
- [ ] Créer le repo GitHub (public, sans README pour push local)
- [x] Initialiser localement — repo git existant ✅
- [ ] Choisir la licence (MIT recommandé) — créer le fichier `LICENSE`
- [x] Configurer `.gitignore` ✅
- [ ] Créer le fichier `.nvmrc` ou `.node-version` — `echo '20' > .nvmrc`

---

## 📦 package.json irréprochable

- [ ] `name`, `version: 0.1.0`, `description`, `author`, `license` remplis
- [ ] Définir `main` (CJS), `module` (ESM), `exports` map
  ```json
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
  ```
- [ ] `types` pointe vers le `.d.ts` — `"types": "./dist/index.d.ts"`
- [ ] `files[]` liste uniquement les fichiers publiés — `["dist", "README.md", "LICENSE"]`
- [ ] `engines.node` spécifié — `"engines": { "node": ">=18" }`
- [ ] `keywords` pertinents (10 max) — améliore la découvrabilité npm
- [ ] `repository`, `homepage`, `bugs` renseignés avec les liens GitHub corrects
- [ ] `sideEffects: false` si applicable — permet le tree-shaking
- [ ] Scripts : `build`, `test`, `lint`, `typecheck`, `prepublishOnly`
  ```json
  "prepublishOnly": "npm run build && npm test"
  ```
- [ ] `peerDependencies` vs `dependencies` bien séparés

---

## 🔧 Tooling & Build

- [x] TypeScript configuré (`tsconfig.json` strict, `declaration: true`, `declarationMap: true`)
- [x] Bundler configuré — tsup recommandé : `tsup src/index.ts --format cjs,esm --dts`
- [x] Génération CJS + ESM + types en une commande — build OK ✅
- [x] ESLint + Prettier configurés — `eslint.config.js` + `.prettierrc` ✅
- [x] Tests configurés — Vitest, 550+ tests ✅
- [ ] Vérifier la taille du bundle avec `size-limit` ou [bundlephobia.com](https://bundlephobia.com)
- [x] Ajouter pre-commit hooks — lefthook (tsc + eslint sur staged files) ✅

---

## ✅ Qualité du code

- [x] Couverture de tests ≥ 80% — `vitest --coverage` ✅
- [x] Zéro warning TypeScript en mode strict — `npx tsc --noEmit` ✅
- [x] Zéro warning ESLint — `npx eslint src/` ✅
- [x] Package testé localement — `npm pack` puis installer le `.tgz` dans un projet test ✅
- [x] Imports ESM/CJS vérifiés — `node -e "require('./dist/index.cjs')"` ✅
- [x] Testé dans un projet Next.js et Node.js brut si applicable ✅

---

## 📝 Documentation

- [ ] `README.md` complet : badges, install, usage, API, contributing
- [ ] Badges : npm version, license, CI status, coverage
  ```
  ![npm](https://img.shields.io/npm/v/<pkg>)
  ![license](https://img.shields.io/npm/l/<pkg>)
  ![CI](https://github.com/<user>/<repo>/actions/workflows/ci.yml/badge.svg)
  ```
- [ ] Exemples de code clairs et copiables (blocs \`\`\`ts)
- [ ] `CHANGELOG.md` initialisé au format [Keep a Changelog](https://keepachangelog.com)
  ```markdown
  ## [0.1.0] - YYYY-MM-DD
  ### Added
  - Initial release
  ```
- [ ] `CONTRIBUTING.md` avec instructions de dev local (Fork → install → test → PR)
- [ ] `CODE_OF_CONDUCT.md` (optionnel mais pro) — [Contributor Covenant v2](https://www.contributor-covenant.org)

---

## 🐙 GitHub setup

- [ ] Branch protection sur `main` (require PR, CI pass) — Settings → Branches → Add rule
- [ ] GitHub Actions : CI (lint + test + build) sur push/PR — `.github/workflows/ci.yml`
  ```yaml
  on: [push, pull_request]
  jobs:
    ci:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20 }
        - run: npm ci
        - run: npm run lint
        - run: npm test
        - run: npm run build
  ```
- [ ] GitHub Actions : publish automatique sur tag `v*` — `.github/workflows/publish.yml`
  ```yaml
  on:
    push:
      tags: ['v*']
  jobs:
    publish:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20, registry-url: 'https://registry.npmjs.org' }
        - run: npm ci && npm publish
          env:
            NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
  ```
- [ ] Secret `NPM_TOKEN` ajouté dans GitHub Secrets — Settings → Secrets → Actions
- [ ] Templates Issues : bug report, feature request — `.github/ISSUE_TEMPLATE/`
- [ ] Template PR — `.github/pull_request_template.md`
- [ ] Dependabot activé (npm + actions) — `.github/dependabot.yml`
  ```yaml
  updates:
    - package-ecosystem: npm
      directory: "/"
      schedule: { interval: weekly }
    - package-ecosystem: github-actions
      directory: "/"
      schedule: { interval: weekly }
  ```
- [ ] Topics et section "About" du repo GitHub renseignés

---

## 🎯 Publication npm

- [x] Compte npm créé et 2FA activé ✅
- [x] `npm login` en local ✅
- [ ] `npm pack` pour inspecter l'archive — `tar -tzf *.tgz` pour voir les fichiers inclus
- [ ] Vérifier `.npmignore` ou `files[]` dans `package.json` — aucun fichier sensible
- [ ] `npm publish --dry-run` pour simuler sans publier
- [ ] `npm publish --access public` si package scopé `@org/`
- [ ] Créer le tag git et pousser — `git tag v0.1.0 && git push --tags`
- [ ] Vérifier la page [npmjs.com](https://npmjs.com) du package après publication — README correct ?

---

## 🏁 Après la publication

- [ ] Créer une **GitHub Release** associée au tag `v0.1.0` avec notes de version
- [ ] Tester `npm install <pkg>` depuis un projet complètement vierge — le vrai test final
- [ ] Annoncer si applicable : Twitter/X, Reddit (`r/javascript`, `r/node`), Dev.to
- [ ] Mettre en place [Conventional Commits](https://www.conventionalcommits.org) pour les futures versions
  - `feat:` → bump minor, `fix:` → bump patch, `BREAKING CHANGE:` → bump major
- [ ] Envisager [`release-it`](https://github.com/release-it/release-it) ou [`semantic-release`](https://github.com/semantic-release/semantic-release) pour automatiser CHANGELOG + tag + publish

---

## 📊 Récap progression

| Section | Items | Statut |
|---|---|---|
| ⚡ Initialisation | 6 | 🔄 3/6 done |
| 📦 package.json | 10 | ⬜ À faire |
| 🔧 Tooling & Build | 7 | ✅ 6/7 done |
| ✅ Qualité du code | 6 | ✅ Tout bon |
| 📝 Documentation | 6 | ⬜ À faire |
| 🐙 GitHub setup | 8 | ⬜ À faire |
| 🎯 Publication npm | 8 | 🔄 2/8 done |
| 🏁 Post-launch | 5 | ⬜ À faire |

> **20 / 56 items complétés** — Tooling ✅ · Qualité ✅ · npm account ✅ · nom réservé ✅ · pre-commit ✅