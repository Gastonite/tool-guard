# 🚀 npm publish checklist — v0.1.0

> `tool-guard` · GitHub + npm · TypeScript + ESLint ✅ · Qualité ✅

---

## ⚡ Initialisation du projet

- [x] Choisir un nom de package unique — `tool-guard` réservé sur npm ✅
- [x] Créer le repo GitHub — https://github.com/Gastonite/tool-guard ✅
- [x] Initialiser localement — repo git existant ✅
- [x] Licence MIT — `LICENSE` avec auteur et année ✅
- [x] Configurer `.gitignore` ✅

---

## 📦 package.json

- [x] `name: tool-guard`, `version: 0.1.0`, `description`, `author`, `license` remplis ✅
- [x] Vérifier `exports` map (ESM-only, pas de barrel) ✅
- [x] `types` dans l'exports map (pas de barrel, pas de top-level `types`) ✅
- [x] `files[]` liste les fichiers publiés — `["dist", "bin", "README.md", "LICENSE"]` ✅
- [x] `engines.node` spécifié — `>=18` ✅
- [x] `keywords` pertinents (10) ✅
- [x] `repository`, `homepage`, `bugs` avec les URLs GitHub correctes ✅
- [x] Scripts : `build`, `test`, `lint`, `prepublishOnly` ✅

---

## 🔧 Tooling & Build

- [x] TypeScript configuré (strict, declaration, declarationMap) ✅
- [x] Bundler configuré (esbuild + tsc-alias) ✅
- [x] Génération ESM + types en une commande ✅
- [x] ESLint configuré (stylistic, pas Prettier) ✅
- [x] Tests configurés — Vitest, 550+ tests ✅
- [x] Pre-commit hooks — lefthook (tsc + eslint sur staged files) ✅

---

## ✅ Qualité du code

- [x] Couverture de tests ≥ 80% ✅
- [x] Zéro warning TypeScript en mode strict ✅
- [x] Zéro warning ESLint ✅
- [x] Package testé localement (`npm pack` + install .tgz) ✅
- [x] Imports ESM vérifiés ✅

---

## 📝 Documentation

- [x] `README.md` complet : install, usage, API, exemples ✅
- [x] Exemples de code clairs et copiables ✅
- [x] `CHANGELOG.md` initialisé ✅

---

## 🐙 GitHub setup

- [ ] GitHub Actions : CI (lint + test + build) sur push/PR — `.github/workflows/ci.yml`
- [ ] GitHub Actions : publish automatique sur tag `v*` — `.github/workflows/publish.yml`
- [ ] Secret `NPM_TOKEN` ajouté dans GitHub Secrets
- [ ] Topics et section "About" du repo GitHub renseignés

---

## 🎯 Publication npm

- [x] Compte npm créé et 2FA activé ✅
- [x] `npm login` en local ✅
- [ ] `npm pack` pour inspecter l'archive
- [ ] Vérifier `files[]` — aucun fichier sensible inclus
- [ ] `npm publish --dry-run` pour simuler
- [ ] `npm publish`
- [ ] Créer le tag git — `git tag v0.1.0 && git push --tags`
- [ ] Vérifier la page npmjs.com — README correct ?

---

## 🏁 Après la publication

- [ ] Créer une **GitHub Release** associée au tag `v0.1.0`
- [ ] Tester `npm install tool-guard` depuis un projet vierge

---

## 📊 Récap progression

| Section | Items | Statut |
|---|---|---|
| ⚡ Initialisation | 4 | ✅ 4/4 done |
| 📦 package.json | 8 | ✅ 8/8 done |
| 🔧 Tooling & Build | 6 | ✅ 6/6 done |
| ✅ Qualité du code | 5 | ✅ 5/5 done |
| 📝 Documentation | 3 | ✅ 3/3 done |
| 🐙 GitHub setup | 4 | ⬜ À faire |
| 🎯 Publication npm | 8 | 🔄 2/8 done |
| 🏁 Post-launch | 2 | ⬜ À faire |

> **26 / 40 items complétés** — Tooling ✅ · Qualité ✅ · npm account ✅ · nom réservé ✅ · pre-commit ✅
