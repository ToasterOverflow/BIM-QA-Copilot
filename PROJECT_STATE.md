# PROJECT_STATE - BIM QA Copilot

## Product purpose
Local-first web app that checks Revit-exported CSV schedules (sheet lists, room/door schedules, view lists, generic) against BIM QA rules and exports issue reports. Portfolio project + genuinely usable QA tool for BIM coordination work.

## Tech stack
- Next.js (App Router) + TypeScript (strict) + Tailwind CSS + React
- Papa Parse (CSV parsing), Vitest (logic tests)
- 100% client-side; no backend
- localStorage allowed only for Milestone 2 rule configuration persistence

## Current milestone
Milestone 2 - complete and deployed. Live at https://toasteroverflow.github.io/BIM-QA-Copilot/ (verified 2026-07-05: page and basePath assets return 200). M2 audit complete; pre-M3 fixes applied (lint out/ ignore, filtered-export PASS bug, placeholder textarea UX, doc refresh).

## Completed features
- M1-T1 Project setup and baseline UI shell
- M1-T2 Core types, shared utils, sample data
- M1-T3 CSV parser, column detection, validation
- M1-T4 Upload, sample loader, type selector, data preview
- M1-T5 Rule engine core
- M1-T6 Schedule-specific rule sets
- M1-T7 Issue dashboard
- M1-T8 CSV export of issue report
- M1-T9 Polish, tests, README, state finalization
- M2-T1 Audit fixes and regression tests
- M2-T2 Rule factory refactor
- M2-T3 Rule configuration (toggles, custom sheet pattern, custom placeholders)
- M2-T4 Report improvements (clean-run export + config metadata)
- M2-T5 Deploy + portfolio polish (GitHub Pages workflow, static export config, README screenshot)

## Pending tickets
- M3-T1 Config profiles + JSON export/import (fold in export formula-injection guard and config save-on-blur/debounce)
- M3-T2 Per-rule severity override
- M3-T3 Large-file performance (issue table virtualization)
- M3-T4 Multi-file session with combined report
- M3-T5 Portfolio polish (demo GIF, messy sample datasets, rules explainer)

## Architecture decisions
- Pure logic, thin UI: parsing/rules/export string building live in /lib; app/page.tsx owns state and orchestration; components are presentational.
- Papa Parse runs in array mode, not header mode, so duplicate headers, ragged rows, BOM stripping, and TSV auto-detection are handled explicitly.
- dynamicTyping stays off so leading zeros in Revit identifiers survive parsing.
- detectColumns uses normalized-header synonym tables and stores actual CSV header strings in the ColumnMap.
- Schedule type suggestion prioritizes sheet-specific number/name pairs before bare view-name detection, so `Sheet Number,Name` suggests sheet-list.
- RuleResult separates skippedRules, failedRules, and disabledRules so missing columns, rule failures, and user-disabled checks are not conflated.
- Rule factories cover repeated missing, duplicate, and all-column placeholder rules; hand-written rules remain for schedule-specific heuristics.
- Duplicate checks flag every row in a duplicate group, case-insensitive, blanks excluded.
- One shared placeholder list lives in lib/utils/placeholders.ts and can be overridden through RuleConfig.
- Rule configuration persists in localStorage through SSR-safe helpers in lib/config/ruleConfig.ts.
- Issue export uses a pure CSV-string builder plus a separate DOM download helper; exports include UTF-8 BOM, CRLF line endings, clean PASS reports, and config metadata.
- UI uses plain React state, Tailwind, hand-rolled controls, and no component/state libraries.
- next.config.ts uses static export output and applies a GitHub Pages basePath only during GitHub Actions builds.
- .github/workflows/deploy.yml runs lint, tests, static build, and deploys `out/` with actions/deploy-pages.

## Scope exclusions (do not build)
Auth, payments, teams, cloud sync, AI chat, real-time collaboration, mobile app, enterprise features, databases, state libraries, component libraries.

## Commands to run
- npm install
- npm run dev          # localhost:3000
- npm run test         # Vitest (parser, rules, export, config)
- npm run lint
- npm run build

## Verification status
- npm run test: passed, 8 files and 41 tests
- npm run lint: passed
- npm run build: passed
- `rg "Rules\\[" lib/rules`: no matches
- Local smoke check: http://localhost:3000 returned HTTP 200 after clean dev-server restart
- README screenshot captured at docs/screenshot.png
- Static export smoke check: out/ served locally on port 4173 returned HTTP 200
- Static export browser flow verified: sample -> run checks -> issue dashboard/export controls visible

## Known risks
- Exported CSV does not neutralize leading =/+/@ characters (formula injection when a shared report is opened in Excel); scheduled for M3-T1.
- Revit column-name variance remains broad; synonym detection covers common M2 cases and unmatched optional columns surface as skipped checks.
- Non-UTF8 exports may show replacement characters; the app should still parse without crashing.
- Large files get a soft warning above 5000 rows; preview is capped at 50 rows and issue table rendering is not virtualized.
- View naming rules are still heuristic and may need project-configurable naming patterns later.
- Export has automated CSV-string coverage, but spreadsheet-app visual verification was not performed in this pass.
