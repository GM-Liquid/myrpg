# MyRPG — **Agents.md** (AI Helper Guide)

> **Spec reference:** This document follows the [agentsmd.net specification](https://agentsmd.net/#what-is-agentsmd).\
> **Purpose:** Explain the structure, conventions, and *extra* rules an AI assistant (e.g. OpenAI Codex) **must** respect when working with this repository.

---

## 1 · Project Snapshot

| Key fact                      | Value                                                           |
| ----------------------------- | --------------------------------------------------------------- |
| **System name**               | **MyRPG**                                                       |
| **Foundry VTT compatibility** | v12 (tested on 12.324)                                          |
| **Current version (**``**)**  | `2.282` -> **auto-bumped to** `2.283` on next commit            |
| **Languages**                 | English, Русский (full parity required)                         |
| **Main tech**                 | ES‑module JavaScript (`*.mjs`), Handlebars (`*.hbs`), JSON, CSS |
| **Licence**                   | MIT (source) / CC BY‑SA 4.0 (game rules)                        |


## 2 · Repository Map

myrpg/
│  README.md
│  AGENTS.md          ← you are here
│  system.json        ← manifest (version bumped automatically)
│
├─ module/
│   config.mjs
│   actor.mjs
│   actor-sheet.mjs
│   utils.mjs
│   handlebars-helpers.mjs
│   templates.mjs
│
├─ templates/
│   └─ actor/
│       ├─ actor-character-sheet.hbs
│       └─ actor-npc-sheet.hbs
│
├─ lang/
│   en.json   ← English strings
│   ru.json   ← Russian strings (must mirror English keys)
│
└─ styles/
    myrpg.css
```

---

## 3 · Data Model & Game Rules

### 3.1 Core Characteristics

MyRPG uses **three** primary attributes; no *Dexterity* characteristic is present.

| Abbreviation | Name (EN / RU)     | Range      |
| ------------ | ------------------ | ---------- |
| **MIG**      | Might / Сила       | **1 – 10** |
| **FIN**      | Finesse / Ловкость | **1 – 10** |
| **MIN**      | Mind / Разум       | **1 – 10** |

Derived stats and in‑game effects are computed in `actor.mjs` from these three values.

### 3.2 Skills

- Skills are integer values that can grow without a hard upper cap.
- No “maximum skill” limitation must be enforced in sheets, rolls, or UI.

---

## 4 · Build, Deployment & Versioning

- **Auto‑version bump:** With **every** change merged to `main`, Codex (or any CI bot) must increment the `version` field in `system.json` by **+0.001** (e.g. `2.204 → 2.205`).
- The build pipeline (GitHub Actions) simply zips the repository for Foundry distribution.
- Releases follow Semantic‑ish numbering: `<major>.<minor><patch>` where *minor* and *patch* are three‑digit sequences (allows CI bumping).

---

## 5 · Contribution Workflow

1. **Branch name**: `feature/<slug>` or `fix/<slug>`.
2. **Commit style**: Conventional commits (`feat:`, `fix:`, `chore:`).
3. **Pull Request template**: includes check‑boxes for localisation parity, version bump, ESLint pass.
4. **CI checks**:
   - ESLint + simple Jest tests (if present)
   - JSON schema validation for `system.json`, localisation files, and character templates.

---

## 6 · Code & Localisation Conventions

- **Copy‑paste‑ready code** — avoid line numbers or decorations that break direct copy.

- **Dual‑language localisation**: **any** new string **must** be added **simultaneously** to `en.json` *and* `ru.json` with identical keys.

  ```json
  // en.json
  "MYRPG.RollTitle": "Might Check"

  // ru.json
  "MYRPG.RollTitle": "Проверка Силы"
  ```

- **Naming**: camelCase for JS variables, kebab‑case for file names, UPPER\_SNAKE for Handlebars helpers.

- **Sheets**: built with plain HTML+Handlebars; keep markup semantic for accessibility.

- **No full re-render on edits**: Any change made through the character sheet (PC or NPC) should update the UI and derived values without triggering a full sheet re-render, unless a structural reflow is required. Prefer in-place DOM updates tied to `actor.update(..., { render: false })`, and refresh only the affected inputs/labels and computed fields (speed, defenses, health, etc.).

---

## 7 · AI Assistant-Specific Guidelines

> The maintainer is a **junior game‑designer** and **beginner programmer**.

1. **Double‑check** every technical suggestion before presenting it.
2. **Ask clarifying questions** whenever a requirement is ambiguous.
3. **Provide code** in a single contiguous block, ready for one‑click copy.
4. **Ensure RU + EN localisation** for any code that introduces UI text.
5. **Automatically bump version** (`system.json → version +0.001`) whenever code is updated.
6. If adding or renaming a field that affects characteristics or skills, confirm the 1‑10 range rule and absence of DEX.

7. When implementing sheet interactions, prioritize incremental updates: submit data with `render: false`, then update only the impacted parts of the DOM to reflect changes immediately. This applies equally to PCs and NPCs.
8. **Adhere to code style**: All generated or modified code must strictly follow the formatting rules defined in `.prettierrc.json` and the linting rules in `eslint.config.mjs`.

---

*Last updated: 2025‑07‑02*

