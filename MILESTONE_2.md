# BIM QA Copilot — Milestone 1 Audit & Milestone 2 Roadmap

**Document status:** Ready for execution by Codex 5.5.
**Author role:** Product architect / technical lead / QA reviewer (Fable 5).
**Rule:** Execute tickets in order (M2-T1 → M2-T5). After each ticket: `npm run lint`, `npm run test`, `npm run build` must all pass. Update PROJECT_STATE.md at the end of each ticket.

---

# Part 0 — Milestone 1 Audit Findings (2026-07-04)

Verification at audit time: 32/32 tests pass, lint clean, production build clean. Architecture held: pure `/lib`, thin components, `page.tsx` owns state. Overall quality is good; the findings below are ranked.

## Bugs (confirmed by probe tests)

**A1 — `view-placeholder-name` substring false positives** (`lib/rules/viewRules.ts:17-24`)
`lower.includes(term)` matches inside words: "Thresh**old** Detail", "Con**temp**orary Lobby", "At**test**ation Room Plan" are all flagged as placeholder view names. The spec (§1.12) called for word-boundary matching "where sensible". Real Revit projects will hit this constantly ("Old Town", "Template", "Contest", "Scope"…).
Fix: match terms with word boundaries (`new RegExp(`\\b${term}\\b`, "i")`); keep the existing `/copy\s*\d*$/i` trailing-copy check.

**A2 — Sheet list with plain "Name" header suggested as view list** (`lib/csv/detectColumns.ts:69-95`)
`suggestScheduleType(["Sheet Number", "Name"])` returns `view-list` because the viewName synonym list contains bare `name` and view is checked before sheet. Revit sheet lists frequently export the name column as just "Name".
Fix: in the view-list branch, only treat `viewName` as a view signal when it matched a view-specific synonym (`viewname`, `view`) — a bare `name` match alone must not trigger view-list. Alternatively (equivalent): check sheet-list before view-list when `sheetNumber` matched a sheet-specific synonym (`sheetnumber`/`sheetno`). Pick one, add regression tests for `["Sheet Number","Name"]` → `sheet-list` and `["View Name","Sheet Number"]` → `view-list`.

**A3 — Crashed rules reported as "columns not found"** (`lib/rules/ruleEngine.ts:109-114`, `app/page.tsx:287-292`)
A rule that throws is pushed into `skippedRules`, and the dashboard renders all skipped rules as "checks skipped (columns not found)". A rule bug would be silently misreported as a missing column.
Fix: `RuleResult` gets `failedRules: string[]` alongside `skippedRules`; UI renders a separate muted line ("N checks failed to run") only when non-empty. Update engine test (throwing rule → `failedRules`, not `skippedRules`).

## Cosmetic / low-risk defects

**A4 — Issue table header misaligned with rows** (`components/issues/IssueTable.tsx:46-81`)
Body rows are a fixed CSS grid (`120px 72px 150px 220px minmax(240px,1fr)`) inside a single `colSpan={5}` cell, but the `<th>` cells auto-size — header and body columns don't line up. Fix: drop the `<table>` semantics or make the header the same grid template (simplest: replace thead with a `div` using the identical `grid-cols-[...]` classes; keep `role` attributes reasonable).

**A5 — Dead `sticky top-0` on preview header** (`components/preview/DataPreview.tsx:62`)
The container scrolls horizontally only; sticky has no effect. Either add `max-h-[32rem] overflow-y-auto` to the table wrapper so sticky works for tall previews, or remove the class. Prefer adding the max-height — 50 visible rows already overflow most screens.

**A6 — Report filename uses UTC date** (`lib/export/exportIssuesCsv.ts:62`)
`toISOString().slice(0,10)` can be off by one day near midnight local time. Fix with local-date formatting (`getFullYear/getMonth/getDate` padded).

## Design observations (decisions, not defects — resolved in tickets below)

- **A7** — `"-"` is both a placeholder value (`lib/utils/placeholders.ts`) and the preview's blank-cell glyph; Revit exports often use `-` to mean intentionally-empty. The placeholder rule may be noisy on real files. → resolved by per-rule toggles + editable placeholder list (M2-T3).
- **A8** — Clean runs (0 issues) can't be exported; QA workflows often need a "passed" record. → M2-T4.
- **A9** — Severity-card toggle semantics (all→all-minus-one) differ from rule-pill semantics (none→only-that-one). Minor inconsistency; acceptable, do not churn.
- **A10** — Rule modules self-reference by array index (`sheetRules[0]` inside its own `check`) — reordering a rule array silently mis-attributes issues. Also ~400 lines of copy-paste across the five rule files (missing/duplicate/placeholder trios). → M2-T2 factory refactor removes both.
- **A11** — `Number,Name,…` generic files suggest `room-schedule` (bare `number` synonym). Spec-compliant and user-overridable; leave as-is, but M2-T2's tests must not "fix" it accidentally.

---

# Part 1 — Milestone 2 Goal

**Theme: trustworthy on real files, configurable, and shippable as a portfolio piece.**

Milestone 1 proved the vertical slice. Milestone 2 makes the checker credible on messy real-world Revit exports (fix false positives, honest skip reporting), lets users tune the rules to their office standards (the single most requested capability class for QA tools), and puts a live deployed URL + screenshot in the README.

Scope exclusions from M1 still apply verbatim (no auth, no backend, no databases, no state/component libraries). New in M2: `localStorage` is now allowed **only** for rule configuration persistence. Still no server.

---

# Part 2 — Tickets

## Ticket M2-T1 — Audit fixes and regression tests

**Goal:** Fix A1–A6 exactly as specified in Part 0.
**Files:** `lib/rules/viewRules.ts`, `lib/csv/detectColumns.ts`, `lib/rules/ruleEngine.ts`, `lib/rules/types.ts`, `app/page.tsx`, `components/issues/IssueTable.tsx`, `components/preview/DataPreview.tsx`, `lib/export/exportIssuesCsv.ts`, plus tests (`viewRules.test.ts`, `parser.test.ts`, `ruleEngine.test.ts`, `exportIssuesCsv.test.ts`).

**Acceptance criteria:**
- "Threshold Detail", "Contemporary Lobby", "Attestation Room Plan" produce zero `view-placeholder-name` issues; "Old Lobby Detail", "Copy of Level 2", "Level 2 Copy 1", "temp", "WIP Stair Section" still flagged (all present in the sample view list — assert against it).
- `suggestScheduleType(["Sheet Number","Name"])` → `sheet-list`; all four sample datasets still suggest correctly.
- Throwing rule lands in `failedRules`; UI shows distinct lines for skipped vs failed.
- Issue table header visually aligns with rows (manual check at default width and ~800px).
- Preview table scrolls vertically with a working sticky header.
- Full gate green.

## Ticket M2-T2 — Rule factory refactor (no behavior change)

**Goal:** Deduplicate the five rule modules with three factories in a new `lib/rules/ruleFactories.ts`:
- `missingValueRule({ id, name, severity, scheduleType, field, label, fileLevelWhenColumnAbsent })` — covers all 8 "missing X" rules (both the file-level-issue and appliesTo-skip variants via the flag).
- `duplicateValueRule({ id, name, scheduleType, field, label })` — covers the 4 duplicate rules.
- `placeholderRule({ id, scheduleType })` — covers the 4 all-column placeholder rules.

Rules keep their exact ids, names, severities, messages, and suggested fixes — **zero behavior change**; the existing test suite is the safety net (do not weaken any assertion). View-specific rules (`view-placeholder-name`, `view-naming-pattern`, `view-unplaced-missing-sheet`) and generic rules stay hand-written. Eliminate all `xRules[n]` self-references (factories close over their own rule object; for remaining hand-written rules, restructure to `const rule: Rule = { ... check uses rule }` or pass id/name/severity directly to `makeIssue`).

**Acceptance criteria:** all 32+ existing tests pass unmodified (except the engine test updated in M2-T1); net line count in `lib/rules/` drops substantially; grep finds no `Rules[` index self-references.

## Ticket M2-T3 — Rule configuration (toggles, custom pattern, custom placeholders)

**Goal:** A "Configure checks" panel between the type selector and Run button:
- Per-rule enable/disable checkboxes, grouped by the selected schedule type (default: all enabled).
- Editable sheet-number pattern: a text input holding the regex source (default = current `SHEET_PATTERN`); invalid regex → inline error, falls back to default at run time.
- Editable placeholder list: comma-separated input seeded from `PLACEHOLDER_VALUES`; trimmed/lowercased on save. This is where a user removes `-` if their office uses it for intentional blanks (resolves A7).

**Mechanics:**
- `lib/config/ruleConfig.ts` (pure): `RuleConfig` type `{ disabledRuleIds: string[]; sheetPattern: string; placeholders: string[] }`, `DEFAULT_CONFIG`, `loadConfig()/saveConfig()` wrapping `localStorage` (try/catch, fall back to defaults — SSR-safe: guard `typeof window`).
- `runRules(parsed, scheduleType, config?)` gains an optional config param: filters disabled rules (disabled ≠ skipped — don't put them in `skippedRules`; add `disabledRules: string[]` to `RuleResult` and a muted UI line), and passes pattern/placeholders through `RuleContext` (add `config` to `RuleContext`; `isPlaceholder` gains an optional list param; sheet pattern rule compiles from config with try/catch fallback).
- No config UI state library; plain component state lifted to `page.tsx`, persisted on change.

**Acceptance criteria:** disabling a rule removes its issues on next run and survives page reload; custom pattern accepts e.g. `^[A-Z]{2}-\d{3}$` and flags accordingly; removing `-` from placeholders stops `-` cells being flagged; tests cover config filtering, custom pattern, custom placeholder list, and corrupt/absent localStorage fallback (config logic is pure — test without DOM where possible).

## Ticket M2-T4 — Report improvements: clean-run export + config in metadata

**Goal:**
- Export button enabled whenever a result exists (even 0 issues). A clean export contains the metadata block plus a line `Result: PASS — no issues found` and the header row; with issues it says `Result: N issues`.
- Metadata block additionally records: disabled rule count (and ids if any), custom pattern if non-default, skipped and failed rule ids. A QA report you can't trace to its configuration isn't evidence.
- Keep `buildIssuesCsv` pure; extend `ExportMeta` accordingly.

**Acceptance criteria:** clean run exports a valid CSV opening in Excel; metadata reflects config; existing export tests extended for the new lines; gate green.

## Ticket M2-T5 — Deploy + portfolio polish

**Goal:** The app is public and the README sells it.
- `next.config.ts`: `output: "export"` (app is fully static — verify no regression), deploy `out/` to GitHub Pages via a `.github/workflows/deploy.yml` (standard actions/deploy-pages flow; set `basePath` if served from a repo subpath) — or Vercel if the user prefers; ask before creating any remote/public deployment.
- README: real screenshot in `docs/`, live-demo link, updated rule reference including config capabilities, short "How it works" architecture section.
- PROJECT_STATE.md: Milestone 2 marked complete, risks refreshed.

**Acceptance criteria:** deployed URL loads, full flow works (sample → configure → run → filter → export) on the static build; README screenshot and link present. **Note:** deployment publishes the app publicly — confirm with Brian before the first deploy.

---

# Part 3 — Explicitly deferred (do not build in M2)

- XLSX input (SheetJS is a heavy dependency; CSV/TSV covers the Revit export path) — revisit only on real demand.
- Multi-file batch QA / combined reports.
- Issue-table virtualization (unvirtualized is fine until a real file stutters — M1 ponytail note stands).
- Shareable config presets (JSON import/export) — natural M3 candidate if config gets used.
- i18n, dark mode, PWA.

*End of roadmap. Codex: begin with M2-T1.*
