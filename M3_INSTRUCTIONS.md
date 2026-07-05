# BIM QA Copilot — Milestone 3 (executor: Codex)

Read PROJECT_STATE.md first. It is the source of truth for architecture decisions and scope exclusions — do not build anything listed under "Scope exclusions". Keep the existing pattern: pure logic in `/lib`, orchestration in `app/page.tsx`, presentational components, no new dependencies, no state/component libraries.

Work the tickets in order. After each ticket: `npm run test`, `npm run lint`, `npm run build` must all pass, and new logic in `/lib` gets Vitest coverage. Update PROJECT_STATE.md when done.

## M3-T1 Config profiles + sharing
- Named config presets: save/load/delete multiple named RuleConfigs in localStorage (extend `lib/config/ruleConfig.ts`; keep SSR-safe helpers and `normalizeConfig` validation).
- Export active config as a JSON file download; import a JSON file with validation through `normalizeConfig` (reject garbage gracefully, never crash).
- Fold in two carried-over fixes:
  - CSV formula-injection guard in `lib/export/exportIssuesCsv.ts`: if an escaped field starts with `=`, `+`, or `@`, prefix `'`. Add a test.
  - Sheet-pattern input: commit config on blur (or debounce) instead of every keystroke, matching the placeholder textarea behavior.

## M3-T2 Per-rule severity override
- Add optional `severityOverrides: Record<string, Severity>` to RuleConfig (persisted, normalized).
- Rule engine applies the override when building issues; config panel gets a severity selector next to each rule toggle.
- Report metadata lists active overrides.

## M3-T3 Large-file performance
- Virtualize the issue table (windowed rendering, hand-rolled — no react-window).
- Raise/verify the 5000-row soft warning against a 50k-row synthetic schedule; document measured timings in PROJECT_STATE.md.

## M3-T4 Multi-file session
- Upload multiple CSVs; per-file schedule type + results; combined export with a per-file section.
- This touches `app/page.tsx` state the most — keep RuleResult and the single-file flow working, and keep parsing/rules pure per file.

## M3-T5 Portfolio polish
- README: demo GIF, updated feature list.
- One deliberately messy sample dataset per schedule type (wired into the sample loader).
- Short "How the rules work" section or page.

## Definition of done
- All five tickets shipped, full gate green, PROJECT_STATE.md updated (milestone, verification status, risks).
- No scope creep: no backend, no auth, no databases, no new npm dependencies.
