# BIM QA Copilot — Master Product Spec & Milestone 1 Roadmap

**Document status:** Ready for execution by Codex 5.5.
**Author role:** Product architect / technical lead / QA reviewer.
**Rule:** Execute tickets in order (M1-T1 → M1-T9). Do not skip ahead. Do not add features not listed here.

---

# Part 1 — Master Product Spec

## 1.1 Product summary

BIM QA Copilot is a **local-first web app** for checking Revit-exported CSV schedules and generating BIM QA issue reports.

Workflow:

1. User uploads a CSV exported from Revit (sheet list, room schedule, door schedule, view list, or any generic schedule).
2. App parses the CSV entirely in the browser (no server round-trip, no upload to any backend).
3. User previews the parsed data in a table.
4. User selects (or confirms auto-suggested) schedule type.
5. App runs the QA rule set for that schedule type.
6. Issues are displayed grouped/filterable by severity (Critical / Warning / Info), rule, and search text.
7. User exports the issue report as a CSV.

## 1.2 Target user

A BIM management / architecture student preparing for co-op and BIM coordination work. The app must be:

- **Portfolio-impressive:** clean UI, real rules, real exports, polished empty/error states.
- **Actually usable:** a coordinator could run a real Revit CSV export through it and get value.

## 1.3 Primary goal

A real, polished, working **vertical slice**. Not a fake enterprise product.

## 1.4 Quality definition

- Correctness first: rules must never report false line numbers or wrong columns.
- Fast load: minimal dependencies, no heavy UI libraries, static-friendly Next.js output.
- Small footprint: only two notable runtime/dev additions beyond the Next.js baseline (Papa Parse, Vitest).
- Clear architecture: parsing, rules, and export are pure functions; UI components hold no business logic.
- Robust error handling: malformed CSVs produce warnings and graceful UI states, never crashes.
- Readable, maintainable, testable code.
- Quality does **not** mean more features.

## 1.5 Scope exclusions (hard rules — do NOT build)

- ❌ Authentication / accounts
- ❌ Payments
- ❌ Teams / sharing / real-time collaboration
- ❌ Cloud sync / any backend persistence
- ❌ AI chat
- ❌ Mobile app
- ❌ Enterprise features (SSO, audit logs, admin panels)
- ❌ Databases of any kind in Milestone 1 (React state only)
- ❌ State libraries (Redux/Zustand/etc.) — plain React state is sufficient
- ❌ Component libraries (MUI/shadcn/etc.) — Tailwind + hand-rolled components only

## 1.6 Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 15+ (App Router) | `create-next-app` defaults |
| Language | TypeScript, `strict: true` | No `any` in `/lib` or `/types` |
| Styling | Tailwind CSS | No CSS-in-JS |
| CSV parsing | Papa Parse (`papaparse` + `@types/papaparse`) | Handles quoting, BOM, delimiter edge cases |
| Tests | Vitest | Logic tests only (parser, rules, export). No E2E framework in M1. |
| State | React `useState`/`useReducer` in `page.tsx` | Local-first; no persistence in M1 |
| Icons | Inline SVG or Unicode | No icon library |

Everything runs client-side. The main page component tree is client-rendered (`"use client"`); there is no API route and no server action in M1.

## 1.7 Directory structure

```
bim-qa-copilot/
├── app/
│   ├── page.tsx              # Main (only) page — orchestrates app state
│   ├── layout.tsx            # Root layout, metadata, font
│   └── globals.css           # Tailwind directives + minimal globals
├── components/
│   ├── upload/
│   │   └── FileUpload.tsx    # Drag-drop + file picker
│   ├── preview/
│   │   ├── DataPreview.tsx   # Parsed-data table
│   │   └── ScheduleTypeSelector.tsx
│   ├── issues/
│   │   ├── IssueTable.tsx
│   │   ├── IssueFilters.tsx
│   │   └── IssueDetail.tsx   # Expanded row detail
│   ├── dashboard/
│   │   └── SeveritySummary.tsx  # Critical/Warning/Info count cards
│   └── ui/
│       ├── Badge.tsx         # Severity badge
│       ├── Button.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── csv/
│   │   ├── parseCsv.ts       # Papa Parse wrapper → ParsedCsv
│   │   ├── detectColumns.ts  # Header normalization + schedule-type suggestion
│   │   └── validateCsv.ts    # Structural validation → CsvParseWarning[]
│   ├── rules/
│   │   ├── types.ts          # Rule, RuleResult, rule helper types
│   │   ├── ruleEngine.ts     # runRules(parsed, scheduleType) → Issue[]
│   │   ├── sheetRules.ts
│   │   ├── roomRules.ts
│   │   ├── doorRules.ts
│   │   ├── viewRules.ts
│   │   └── genericRules.ts
│   ├── export/
│   │   └── exportIssuesCsv.ts
│   ├── sample-data/
│   │   ├── sampleSheetList.ts
│   │   ├── sampleRoomSchedule.ts
│   │   ├── sampleDoorSchedule.ts
│   │   ├── sampleViewList.ts
│   │   └── index.ts
│   └── utils/
│       ├── placeholders.ts   # Shared placeholder detection
│       └── strings.ts        # normalizeHeader, isBlank, etc.
├── types/
│   ├── schedule.ts           # ScheduleType, ParsedCsv, ScheduleRow, CsvParseWarning
│   └── issue.ts              # Severity, Issue
├── tests/
│   ├── parser.test.ts
│   ├── ruleEngine.test.ts
│   ├── sheetRules.test.ts
│   ├── roomRules.test.ts
│   ├── doorRules.test.ts
│   ├── viewRules.test.ts
│   ├── genericRules.test.ts
│   └── exportIssuesCsv.test.ts
├── PROJECT_STATE.md
└── README.md
```

## 1.8 Core architecture principle

**Pure logic, thin UI.**

- Everything in `/lib` and `/types` is pure TypeScript: no React imports, no DOM access (exception: `exportIssuesCsv.ts` has one small `downloadCsv` helper that touches the DOM for the download trigger — keep the CSV *string building* pure and separately exported so it's testable).
- `app/page.tsx` owns all app state (uploaded file, parsed data, schedule type, issues, filters) and passes props down.
- Components render props and emit callbacks. No component calls the parser or rule engine directly — `page.tsx` does.

## 1.9 TypeScript type contracts (canonical — every ticket uses these exact shapes)

These live in `/types/schedule.ts` and `/types/issue.ts` (rule-internal types in `/lib/rules/types.ts`).

```typescript
// types/schedule.ts

export type ScheduleType =
  | "sheet-list"
  | "room-schedule"
  | "door-schedule"
  | "view-list"
  | "generic";

/** One data row. Keys are the ORIGINAL header strings from the CSV. Values are raw cell strings (trimmed). */
export type ScheduleRow = Record<string, string>;

export interface CsvParseWarning {
  /** 1-based data row number the warning applies to, or null for file-level warnings */
  row: number | null;
  message: string;
}

export interface ParsedCsv {
  fileName: string;
  /** Original header strings, in column order */
  headers: string[];
  rows: ScheduleRow[];
  warnings: CsvParseWarning[];
  /** Total data rows parsed (excludes header) */
  rowCount: number;
}
```

```typescript
// types/issue.ts

export type Severity = "critical" | "warning" | "info";

export interface Issue {
  /** Stable unique id: `${ruleId}-${rowNumber}-${column}` (column may be "") */
  id: string;
  ruleId: string;        // e.g. "sheet-missing-number"
  ruleName: string;      // e.g. "Missing sheet number"
  severity: Severity;
  /** 1-based DATA row number (row 1 = first row after the header). null for schedule-level issues (e.g. duplicates report each offending row, so normally set). */
  rowNumber: number | null;
  /** Original header string of the offending column, or "" for row-level issues */
  column: string;
  /** Human-readable problem, includes the offending value where useful */
  problem: string;
  suggestedFix: string;
}
```

```typescript
// lib/rules/types.ts

import type { ParsedCsv, ScheduleRow, ScheduleType } from "@/types/schedule";
import type { Issue, Severity } from "@/types/issue";

/** Column lookup resolved once per run: maps a semantic field ("sheetNumber") to the actual header string, or null if absent. */
export type ColumnMap = Record<string, string | null>;

export interface RuleContext {
  parsed: ParsedCsv;
  columns: ColumnMap;
}

export interface Rule {
  id: string;
  name: string;
  severity: Severity;
  scheduleType: ScheduleType;
  /** Pure. Returns all issues this rule finds across the whole dataset. */
  check(ctx: RuleContext): Issue[];
}

export interface RuleResult {
  scheduleType: ScheduleType;
  issues: Issue[];
  /** Rule ids that were skipped because required columns were absent */
  skippedRules: string[];
  ranAt: string; // ISO timestamp
}
```

## 1.10 Column detection contract

Revit exports have inconsistent header names. `detectColumns.ts` normalizes headers (lowercase, strip non-alphanumerics) and matches against synonym lists:

| Semantic field | Matches (normalized) |
|---|---|
| `sheetNumber` | `sheetnumber`, `sheetno`, `number`, `sheet` |
| `sheetName` | `sheetname`, `name`, `title`, `sheettitle` |
| `roomNumber` | `roomnumber`, `roomno`, `number` |
| `roomName` | `roomname`, `name` |
| `level` | `level`, `floor`, `storey`, `story` |
| `department` | `department`, `dept` |
| `doorNumber` | `doornumber`, `doorno`, `mark`, `number`, `doormark` |
| `fireRating` | `firerating`, `rating`, `fire` |
| `viewName` | `viewname`, `name`, `view` |
| `viewSheet` | `sheetnumber`, `sheet`, `sheetno` |

Matching precedence: exact normalized match on the more specific synonym first (e.g. `sheetnumber` beats `number`). If two headers both match a field, take the first in column order.

`detectColumns` also returns a **suggested ScheduleType**:

- Has `sheetNumber` + `sheetName` and no room/door/view signals → `sheet-list`
- Has `roomNumber` or (`roomName` + `level`) → `room-schedule`
- Has `doorNumber` or `fireRating` → `door-schedule`
- Has `viewName` → `view-list`
- Otherwise → `generic`

Check in this order: door, room, view, sheet, generic (door/room signals are more distinctive than `name`/`number`). The suggestion is only a default — the user can always override in the UI.

## 1.11 Shared placeholder detection

`lib/utils/placeholders.ts` exports:

```typescript
export const PLACEHOLDER_VALUES = ["tbd", "n/a", "na", "untitled", "todo", "xxx", "-", "--", "?", "temp", "placeholder"];
export function isPlaceholder(value: string): boolean; // trim, lowercase, exact match against list
export function isBlank(value: string | undefined | null): boolean; // undefined, null, or trim === ""
```

Every placeholder rule in every schedule type uses `isPlaceholder`. Never duplicate the list.

## 1.12 QA rule catalog (complete, canonical)

Conventions:

- Rule IDs are kebab-case, prefixed by schedule: `sheet-`, `room-`, `door-`, `view-`, `generic-`.
- "Missing" = `isBlank(value)` OR the column itself doesn't exist (column-absent cases noted per rule).
- Duplicate rules report an Issue for **every** row in the duplicate group (including the first), so users see all offenders. Comparison is case-insensitive on trimmed values; blank values are excluded from duplicate checks (blank is already covered by the missing rule).
- A rule whose required column is absent (and isn't a "missing column is itself the problem" rule) is **skipped** and its id added to `RuleResult.skippedRules`.

### Sheet List (`sheet-list`)

| Rule ID | Name | Severity | Logic |
|---|---|---|---|
| `sheet-missing-number` | Missing sheet number | critical | `sheetNumber` cell blank. If the `sheetNumber` column itself is absent, emit one file-level issue (rowNumber null): "No sheet number column found." |
| `sheet-missing-name` | Missing sheet name | critical | `sheetName` cell blank. Column absent → one file-level issue. |
| `sheet-duplicate-number` | Duplicate sheet number | critical | Same non-blank `sheetNumber` value appears in 2+ rows. |
| `sheet-number-pattern` | Sheet number doesn't match expected pattern | warning | Non-blank value fails `/^[A-Za-z]{1,3}[-.]?\d{1,4}(\.\d{1,3})?$/` (accepts `A-101`, `A101`, `AD-101`, `A-101.1`, `M-1.02`). Problem message includes the actual value. |
| `sheet-placeholder` | Placeholder value | warning | Any cell in the row where `isPlaceholder(value)` is true. One issue per offending cell, `column` = that header. |

### Room Schedule (`room-schedule`)

| Rule ID | Name | Severity | Logic |
|---|---|---|---|
| `room-missing-number` | Missing room number | critical | `roomNumber` cell blank. Column absent → one file-level issue. |
| `room-missing-name` | Missing room name | critical | `roomName` cell blank. Column absent → one file-level issue. |
| `room-duplicate-number` | Duplicate room number | critical | Same non-blank `roomNumber` in 2+ rows. |
| `room-missing-level` | Missing level | warning | `level` cell blank. Column absent → one file-level warning issue: "No Level column found." |
| `room-missing-department` | Missing department | info | Only runs if `department` column exists. Blank cell → issue. Column absent → rule skipped (not an issue). |
| `room-placeholder` | Placeholder value | warning | Same as `sheet-placeholder`. |

### Door Schedule (`door-schedule`)

| Rule ID | Name | Severity | Logic |
|---|---|---|---|
| `door-missing-number` | Missing door number | critical | `doorNumber` cell blank. Column absent → one file-level issue. |
| `door-duplicate-number` | Duplicate door number | critical | Same non-blank `doorNumber` in 2+ rows. |
| `door-missing-room` | Missing associated room | warning | Only runs if a room column exists (semantic `roomNumber` match, e.g. "To Room", "From Room", "Room Number" — add `toroom`, `fromroom`, `room` to roomNumber synonyms for door context). Blank cell → issue. Absent → skipped. |
| `door-missing-fire-rating` | Missing fire rating | warning | Only runs if `fireRating` column exists. Blank cell → issue. Absent → skipped. (M1: rule is always enabled when the column exists; a per-rule toggle is out of scope.) |
| `door-placeholder` | Placeholder value | warning | Same as `sheet-placeholder`. |

### View List (`view-list`)

| Rule ID | Name | Severity | Logic |
|---|---|---|---|
| `view-missing-name` | Missing view name | critical | `viewName` cell blank. Column absent → one file-level issue. |
| `view-duplicate-name` | Duplicate view name | critical | Same non-blank `viewName` in 2+ rows. |
| `view-unplaced-missing-sheet` | View missing sheet number | info | Only runs if `viewSheet` column exists. Blank sheet cell → issue "View is not placed on any sheet (or sheet number missing)." Absent → skipped. |
| `view-placeholder-name` | Placeholder term in view name | warning | `viewName` contains (substring, case-insensitive, word-boundary where sensible) any of: `copy`, `copy of`, `working`, `temp`, `test`, `old`, `wip`, `draft`, or `isPlaceholder(fullValue)`. Also flag names ending in ` Copy 1`, ` Copy 2` etc. (`/copy\s*\d*$/i`). |
| `view-naming-pattern` | Unclear naming pattern | info | Non-blank `viewName` that has no structural separator (none of `-`, `_`, `:`) AND is a single word under 4 characters, OR is purely numeric. Heuristic — message says "View name may be unclear; consider a consistent naming convention like 'LEVEL - DISCIPLINE - DESCRIPTION'." <br>`// ponytail: naive heuristic; upgrade to configurable regex pattern if users need project-specific conventions` |

### Generic Schedule (`generic`)

| Rule ID | Name | Severity | Logic |
|---|---|---|---|
| `generic-sparse-row` | Row mostly blank | warning | Row where > 50% of cells are blank (and the row has ≥ 2 columns). Problem message: "X of Y fields are blank." |
| `generic-duplicate-id` | Duplicate value in ID-like column | warning | An "ID-like" column is one whose normalized header contains `number`, `no`, `id`, `mark`, or `code`. For each such column, flag non-blank values appearing in 2+ rows. |
| `generic-placeholder` | Placeholder value | warning | Same as `sheet-placeholder`, across all columns. |
| `generic-empty-required` | Empty required-looking field | info | A "required-looking" column is an ID-like column (above) or one whose normalized header contains `name`. Blank cell in such a column → issue. |

**Note:** Generic rules run ONLY for `generic` type. Specific schedule types run only their own rule set (their placeholder/missing rules already cover the generic concerns). This keeps issue lists non-redundant.

## 1.13 Severity display

| Severity | Color (Tailwind) | Icon |
|---|---|---|
| critical | red (`red-600` text / `red-50` bg) | ● |
| warning | amber (`amber-600` / `amber-50`) | ● |
| info | blue (`blue-600` / `blue-50`) | ● |

Sort order everywhere: critical → warning → info, then by rowNumber ascending (nulls first).

---

# Part 2 — Milestone 1 Roadmap (Tickets)

Execute in order. After each ticket: run `npm run build` and `npm run test` (once tests exist) — both must pass before moving on. Update `PROJECT_STATE.md` "Completed features" / "Pending tickets" at the end of each ticket.

---

## Ticket M1-T1

**Ticket ID:** M1-T1
**Title:** Project setup and baseline UI shell
**Goal:** Scaffold the Next.js project with TypeScript + Tailwind, create the app shell (header, main content area, footer), and establish the folder structure, README stub, and PROJECT_STATE.md.
**User value:** A running app the user can open at `localhost:3000` that clearly shows what the product is, with an empty state inviting a CSV upload.

**Files to create:**
- Entire scaffold via `npx create-next-app@latest bim-qa-copilot --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"` (run inside `E:\Personal Projects\BIM-QA-Copilot\`, or scaffold into the current folder if it is the repo root — the app root should be the project root, not a nested folder; move files up if create-next-app forces a subfolder)
- `components/ui/Button.tsx`
- `components/ui/EmptyState.tsx`
- `components/ui/Badge.tsx`
- Empty placeholder folders per §1.7 (add a `.gitkeep` or create files in later tickets — do NOT create stub files with fake logic)
- `PROJECT_STATE.md` (copy the draft from Part 3 of this document verbatim, then update)
- `README.md` (project name, one-paragraph description, `npm install` / `npm run dev` / `npm run test` / `npm run build` commands, "Milestone 1 in progress" note)

**Files to modify:**
- `app/layout.tsx` — metadata (`title: "BIM QA Copilot"`, description), body classes for a light neutral background (`bg-slate-50 text-slate-900`), system font stack or the create-next-app default font
- `app/page.tsx` — replace boilerplate with the app shell
- `app/globals.css` — strip create-next-app demo styles, keep Tailwind directives

**Implementation details:**
- App shell layout: header bar with product name "BIM QA Copilot" (left) and a subtitle "Revit schedule QA checker" (small, muted); `<main>` max-width container (`max-w-6xl mx-auto px-4 py-8`); footer with "Local-first — your data never leaves this browser."
- `page.tsx` is `"use client"` and will hold all state in later tickets. For now it renders `<EmptyState>`.
- `EmptyState.tsx`: props `{ title: string; description: string; icon?: ReactNode; action?: ReactNode }`. Centered, dashed-border card. Initial usage: title "No schedule loaded", description "Upload a Revit CSV export to get started."
- `Button.tsx`: props `{ variant?: "primary" | "secondary" | "ghost"; } & ButtonHTMLAttributes<HTMLButtonElement>`. Primary = `bg-slate-900 text-white hover:bg-slate-700`; secondary = white with border; ghost = text only. Rounded, `px-4 py-2 text-sm font-medium`, `disabled:opacity-50`.
- `Badge.tsx`: props `{ severity: Severity; children: ReactNode }` — but since `types/issue.ts` doesn't exist yet, type severity locally as `"critical" | "warning" | "info"` and switch to the shared type in M1-T2. Colors per §1.13, `rounded-full px-2 py-0.5 text-xs font-medium`.
- Do not install any dependencies beyond what create-next-app provides.

**Acceptance criteria:**
- `npm run dev` serves the shell at localhost:3000 with header, empty state, footer.
- `npm run build` succeeds with zero TypeScript errors.
- `npm run lint` passes.
- PROJECT_STATE.md and README.md exist with real content.
- No leftover create-next-app boilerplate (Vercel logos, demo links).

**Validation steps:**
1. `npm run dev`, open localhost:3000, visually confirm shell.
2. `npm run build` — exit code 0.
3. Resize window to ~800px wide — layout does not break (single-column container).

**Failure cases to handle:**
- create-next-app scaffolding into a nested folder: move contents so `package.json` sits at the project root next to `ROADMAP.md`.
- Font loading failure: use font-family fallbacks (create-next-app's next/font setup already handles this).

**Notes for Codex:**
- Keep the shell visually minimal and neutral now; the dashboard styling comes in M1-T7/T9.
- Do not add a `src/` directory. Use the `@/*` import alias everywhere.
- Commit message suggestion: `M1-T1: project scaffold and app shell`.

---

## Ticket M1-T2

**Ticket ID:** M1-T2
**Title:** Core types, shared utils, and realistic sample data
**Goal:** Create all canonical TypeScript types (§1.9), shared string/placeholder utilities (§1.11), and five realistic sample CSV datasets with deliberately seeded errors.
**User value:** Users (and demo viewers) can try the app instantly with one click — no need to have a Revit export handy.

**Files to create:**
- `types/schedule.ts` — exactly the contracts in §1.9
- `types/issue.ts` — exactly the contracts in §1.9
- `lib/utils/placeholders.ts` — `PLACEHOLDER_VALUES`, `isPlaceholder`, `isBlank` per §1.11
- `lib/utils/strings.ts` — `normalizeHeader(header: string): string` (lowercase, strip everything except `[a-z0-9]`)
- `lib/sample-data/sampleSheetList.ts`
- `lib/sample-data/sampleRoomSchedule.ts`
- `lib/sample-data/sampleDoorSchedule.ts`
- `lib/sample-data/sampleViewList.ts`
- `lib/sample-data/index.ts` — exports `SAMPLE_DATASETS: { id: string; label: string; scheduleType: ScheduleType; csv: string }[]`

**Files to modify:**
- `components/ui/Badge.tsx` — switch local severity type to `import type { Severity } from "@/types/issue"`

**Implementation details:**
- Each sample is a raw CSV **string** (template literal, realistic Revit-style headers), 20–30 data rows, containing seeded errors that exercise every rule for its schedule type:
  - **Sheet list** (`Sheet Number,Sheet Name,Discipline,Current Revision`): ~25 rows of plausible architectural sheets (`A-101 First Floor Plan`, `A-201 Elevations`, `S-101 Foundation Plan`…). Seed: 1 blank sheet number, 1 blank sheet name, 2 rows sharing `A-102`, 1 malformed number (`SHEET-01A-X`), 1 name `TBD`, 1 name `Untitled`.
  - **Room schedule** (`Number,Name,Level,Department,Area`): ~28 rooms across `Level 1`/`Level 2`. Seed: 1 blank room number, 1 blank name, duplicate `101`, 2 blank levels, 3 blank departments, 1 name `N/A`.
  - **Door schedule** (`Mark,Level,To Room,Fire Rating,Width,Height`): ~24 doors. Seed: 1 blank mark, duplicate `D-104`, 2 blank To Room, 3 blank fire ratings, 1 fire rating `TBD`.
  - **View list** (`View Name,View Type,Sheet Number,Scale`): ~26 views. Seed: 1 blank name, duplicate `Level 1 - Floor Plan`, 4 blank sheet numbers (unplaced views), names `Copy of Level 2`, `Working View`, `temp`, and one purely-numeric name `3`.
  - No separate generic sample; the demo path for `generic` is picking "Generic Schedule" on any upload. (`// ponytail: dedicated generic sample skipped; any CSV serves`)
- Sample CSVs must include some quoted fields containing commas (e.g. sheet name `"Details, Sections & Callouts"`) so parser quoting is exercised.
- Keep totals realistic: seeded-error rows are a minority; most rows are clean.

**Acceptance criteria:**
- All types compile under `strict` with no `any`.
- `isPlaceholder("TBD") === true`, `isPlaceholder(" tbd ") === true`, `isPlaceholder("table") === false`, `isBlank("  ") === true`.
- Each sample dataset, when later run through its rule set (M1-T6), produces at least one issue per rule (this is re-validated in M1-T6 tests; write the data now with that target).
- `npm run build` passes.

**Validation steps:**
1. `npm run build`.
2. Manually eyeball each sample string: header row + 20–30 data rows, seeded errors present per the lists above.

**Failure cases to handle:**
- None at runtime (static data). Ensure template literals don't accidentally include leading indentation whitespace in the CSV lines (strip indentation — build the string without leading spaces per line).

**Notes for Codex:**
- Sample data quality matters for the portfolio demo: use believable architectural sheet/room/door/view names, not `Room 1, Room 2, Room 3`.
- Export samples as strings, not files in `/public` — this keeps everything importable in tests and avoids fetch logic.

---

## Ticket M1-T3

**Ticket ID:** M1-T3
**Title:** CSV parser, column detection, and structural validation
**Goal:** Implement `parseCsv.ts` (Papa Parse wrapper → `ParsedCsv`), `detectColumns.ts` (semantic column mapping + schedule-type suggestion per §1.10), and `validateCsv.ts` (structural warnings), with unit tests.
**User value:** Any reasonable Revit CSV export parses reliably — including quoted commas, BOM, CRLF, and ragged rows — with clear warnings instead of silent data corruption.

**Files to create:**
- `lib/csv/parseCsv.ts`
- `lib/csv/detectColumns.ts`
- `lib/csv/validateCsv.ts`
- `tests/parser.test.ts`
- `vitest.config.ts`

**Files to modify:**
- `package.json` — add deps `papaparse`, dev deps `@types/papaparse`, `vitest`; add script `"test": "vitest run"` and `"test:watch": "vitest"`

**Implementation details:**
- `parseCsv(csvText: string, fileName: string): ParsedCsv`
  - Use `Papa.parse<string[]>(csvText, { skipEmptyLines: "greedy" })` (array mode, NOT header mode — header mode silently mangles duplicate headers; we handle headers ourselves).
  - First row = headers. Trim each header. Duplicate header names: keep as-is but append ` (2)`, ` (3)`… to subsequent duplicates so `ScheduleRow` keys don't collide; add a `CsvParseWarning` (row null) noting the rename.
  - Strip BOM from the first header if present (`﻿`).
  - Each data row → `ScheduleRow` keyed by (deduped) headers, all values `String(v).trim()`.
  - Ragged rows: shorter rows get `""` for missing trailing columns + warning `{ row: n, message: "Row has X of Y columns; missing values treated as blank" }`; longer rows drop extra cells + warning.
  - Papa Parse `errors` array → mapped into warnings (message + row where available).
  - Never throw for malformed content. Throw only if `csvText` yields zero rows total (message: "File contains no data") — the caller catches this.
- `detectColumns(headers: string[], scheduleType: ScheduleType): ColumnMap` and `suggestScheduleType(headers: string[]): ScheduleType`
  - Implement synonym tables and precedence exactly per §1.10 using `normalizeHeader` from `lib/utils/strings.ts`.
  - For door schedules, room-column synonyms additionally include `toroom`, `fromroom`, `room`.
  - `ColumnMap` contains only fields relevant to the given schedule type; unmatched → `null`.
- `validateCsv(parsed: ParsedCsv): CsvParseWarning[]`
  - Additional file-level checks appended to warnings: zero data rows ("File has headers but no data rows"); > 5000 rows ("Large file (N rows) — analysis may be slow"); any fully-blank header ("Column N has no header").
- `tests/parser.test.ts` covers at minimum: simple CSV happy path; quoted field with comma; quoted field with escaped quote (`""`); BOM stripped; CRLF line endings; ragged short row (blank-filled + warning); duplicate headers deduped with warning; empty file throws; header-only file returns rowCount 0 + warning; `suggestScheduleType` returns correct type for each of the four sample datasets' headers and `generic` for unrecognizable headers.

**Acceptance criteria:**
- All parser tests pass (`npm run test`).
- Parsing each of the four sample datasets from M1-T2 yields the expected `rowCount` and zero *unexpected* warnings.
- `parseCsv` has no DOM/React imports; fully pure.
- `npm run build` passes.

**Validation steps:**
1. `npm run test` — all green.
2. Add a temporary test asserting `suggestScheduleType` on each sample's headers → matches the sample's declared `scheduleType`. Keep this test (not temporary after all — it guards the synonym tables).

**Failure cases to handle:**
- Empty string input → throw "File contains no data".
- File that is one long line with no delimiters → parses as 1 header, 0 rows → header-only warning path.
- Tab-delimited file: pass `delimiter: ""` (Papa auto-detect) so TSV exports also work; add one TSV test.
- Numeric cells with leading zeros (`0101`): must remain strings, never coerced (array mode + `dynamicTyping` OFF guarantees this — assert in a test).

**Notes for Codex:**
- Do NOT use Papa Parse header mode. Array mode + manual header handling is deliberate (duplicate headers, warnings).
- `dynamicTyping` must stay off — sheet number `0101` becoming number `101` is a correctness bug.

---

## Ticket M1-T4

**Ticket ID:** M1-T4
**Title:** File upload, sample loader, schedule type selector, and data preview
**Goal:** Wire the UI vertical slice up to the point of previewing parsed data: drag-drop/file-picker upload, "try a sample" buttons, schedule-type selector (pre-filled from `suggestScheduleType`), and a preview table with parse warnings.
**User value:** The user can load their CSV (or a sample), see exactly what the app understood, and confirm the schedule type before running checks.

**Files to create:**
- `components/upload/FileUpload.tsx`
- `components/preview/DataPreview.tsx`
- `components/preview/ScheduleTypeSelector.tsx`

**Files to modify:**
- `app/page.tsx` — app state + orchestration

**Implementation details:**
- **State in `page.tsx`** (single `useState` cluster or one `useReducer` — pick `useReducer` only if the state transitions exceed ~5 actions; otherwise plain `useState`s):
  - `parsed: ParsedCsv | null`
  - `scheduleType: ScheduleType | null`
  - `parseError: string | null`
  - (issue state added in M1-T7)
- **FileUpload.tsx**: props `{ onFileText(text: string, fileName: string): void; onError(message: string): void }`.
  - Dashed drop zone + hidden `<input type="file" accept=".csv,.tsv,text/csv" />` triggered by click; drag-over highlight state.
  - Read via `file.text()`. Reject files > 10 MB (`onError("File too large (max 10 MB)")`). Reject extensions other than `.csv`/`.tsv`/`.txt` with a clear message.
  - Below the drop zone: "or try a sample:" row of secondary buttons, one per `SAMPLE_DATASETS` entry; clicking calls `onFileText(sample.csv, `${sample.label}.csv`)`.
- **page.tsx orchestration**: `onFileText` → `try { parseCsv } catch → parseError`; on success run `validateCsv`, merge warnings into `parsed.warnings`, call `suggestScheduleType(parsed.headers)`, set state. Loading a new file clears everything downstream (schedule type re-suggested, issues cleared).
- **ScheduleTypeSelector.tsx**: props `{ value: ScheduleType; onChange(t: ScheduleType): void }`. Five labeled radio-style pill buttons (Sheet List / Room Schedule / Door Schedule / View List / Generic Schedule). The auto-suggested one gets a small "suggested" tag on first render (pass `suggested: ScheduleType` prop).
- **DataPreview.tsx**: props `{ parsed: ParsedCsv }`.
  - Metadata line: file name, `rowCount` rows, N columns.
  - Warnings block (amber panel, collapsible if > 3 warnings) listing `CsvParseWarning`s with row numbers.
  - Table: sticky header row, first **50** rows only, with a muted "Showing 50 of N rows" note. Row-number column (1-based data rows) on the left. Horizontal scroll for wide tables (`overflow-x-auto`). Blank cells render a muted `—`.
  - `// ponytail: 50-row cap, add virtualization only if real files demand it`
- Layout after upload: FileUpload collapses to a compact bar ("filename.csv — 132 rows — [Replace file]"), then ScheduleTypeSelector, then DataPreview, then a primary **"Run QA checks"** button (wired in M1-T7; for now it can be present but disabled with a `title="Coming in the next step"`, or omitted — prefer omitted to avoid dead UI).
- `parseError` renders as a red alert panel with a "Try again" reset button.

**Acceptance criteria:**
- Uploading any M1-T2 sample via the sample buttons shows correct preview, correct suggested type pre-selected.
- Dragging a real `.csv` file onto the drop zone works in Chrome.
- A file with parse warnings (ragged sample — create one manually to test) displays the warnings panel.
- Oversized/wrong-extension files show the error message, app remains usable.
- `npm run build` and `npm run test` pass.

**Validation steps:**
1. `npm run dev`; click each of the 4 sample buttons; verify preview + suggested type for each (sheet-list, room-schedule, door-schedule, view-list).
2. Save a sample as a real file, drag-drop it, verify identical result.
3. Rename a `.png` to `.png` (i.e., try a wrong extension) and confirm graceful rejection.
4. Upload a new file after a first one; confirm old preview/type fully replaced.

**Failure cases to handle:**
- `file.text()` rejection (permissions/encoding) → `onError` path.
- User drops multiple files → take the first, ignore the rest.
- CSV with 100+ columns → horizontal scroll, no layout explosion.
- Non-UTF8 file producing replacement characters: still parses; no crash (acceptable in M1).

**Notes for Codex:**
- No `useEffect` for parsing — parse synchronously in the event handler (files ≤10 MB parse in tens of ms).
- Keep all parsing/suggestion calls in `page.tsx`, not inside components.

---

## Ticket M1-T5

**Ticket ID:** M1-T5
**Title:** Rule engine core
**Goal:** Implement `lib/rules/types.ts` (per §1.9) and `ruleEngine.ts`: a registry mapping `ScheduleType` → `Rule[]`, and `runRules(parsed, scheduleType): RuleResult` that resolves columns, executes rules, collects skips, and sorts issues.
**User value:** (Foundation) — guarantees every current and future rule runs consistently, with skipped-rule transparency.

**Files to create:**
- `lib/rules/types.ts` — exact contracts from §1.9
- `lib/rules/ruleEngine.ts`
- `tests/ruleEngine.test.ts`

**Files to modify:**
- None (rule files come in M1-T6; engine ships with an empty/registry-ready structure plus two inline test-only rules in the test file).

**Implementation details:**
- `ruleEngine.ts` exports:
  - `RULE_REGISTRY: Record<ScheduleType, Rule[]>` — initialized with empty arrays; M1-T6 fills it by importing each rule module's exported `Rule[]` (registry is assembled in `ruleEngine.ts` via imports, so consumers only import the engine).
  - `runRules(parsed: ParsedCsv, scheduleType: ScheduleType): RuleResult`:
    1. `columns = detectColumns(parsed.headers, scheduleType)`
    2. For each rule in `RULE_REGISTRY[scheduleType]`: call `rule.check({ parsed, columns })` inside try/catch. A throwing rule contributes zero issues and pushes its id to `skippedRules` (a rule bug must never take down the app); in dev, `console.error` the error.
    3. Rules that decide to skip themselves (required column absent per §1.12) signal it by returning a sentinel — instead of a sentinel, keep it simple: rules export an optional `appliesTo(ctx): boolean`; the engine checks it and records skips. Add `appliesTo?(ctx: RuleContext): boolean` to the `Rule` interface.
    4. Sort issues: severity (critical→warning→info), then rowNumber ascending with nulls first, then ruleId.
    5. Return `{ scheduleType, issues, skippedRules, ranAt: new Date().toISOString() }`.
  - Helper exports for rule modules (shared, tested here): `makeIssue(rule, rowNumber, column, problem, suggestedFix): Issue` (builds the id per the §1.9 id format), `findDuplicates(rows, header): Map<string, number[]>` (lowercased-trimmed value → 1-based row numbers, blanks excluded), `eachRow(parsed, fn)` iteration helper providing 1-based row numbers.
- `tests/ruleEngine.test.ts`: define two fake rules inline (one always-issue rule, one throwing rule, one with `appliesTo` returning false); assert: issues collected, throwing rule → skippedRules not crash, appliesTo-false → skippedRules, sort order correct across severities/rows, `makeIssue` id format, `findDuplicates` case-insensitivity + blank exclusion.

**Acceptance criteria:**
- All engine tests pass.
- Engine has zero knowledge of specific schedule semantics (no "sheet"/"room" strings in `ruleEngine.ts`).
- `runRules` is pure except `ranAt` timestamp.
- `npm run build` passes.

**Validation steps:**
1. `npm run test`.
2. Grep `ruleEngine.ts` for `sheet|room|door|view` — no matches (except type imports).

**Failure cases to handle:**
- Empty `parsed.rows` → rules run normally (column-absent file-level rules may still fire); no crash.
- Unknown scheduleType at runtime (shouldn't happen with TS, but registry lookup falls back to `[]`).

**Notes for Codex:**
- The `appliesTo` mechanism is the single way rules skip; do not invent per-rule enabled flags in M1.
- `findDuplicates` returning row-number lists lets duplicate rules flag every member of the group — required by §1.12.

---

## Ticket M1-T6

**Ticket ID:** M1-T6
**Title:** Schedule-specific rule sets (all five)
**Goal:** Implement every rule in §1.12 across `sheetRules.ts`, `roomRules.ts`, `doorRules.ts`, `viewRules.ts`, `genericRules.ts`, register them in the engine, and cover each rule with unit tests using the M1-T2 sample data plus targeted minimal fixtures.
**User value:** The app now finds real BIM QA problems — the core product value.

**Files to create:**
- `lib/rules/sheetRules.ts` — exports `sheetRules: Rule[]`
- `lib/rules/roomRules.ts` — exports `roomRules: Rule[]`
- `lib/rules/doorRules.ts` — exports `doorRules: Rule[]`
- `lib/rules/viewRules.ts` — exports `viewRules: Rule[]`
- `lib/rules/genericRules.ts` — exports `genericRules: Rule[]`
- `tests/sheetRules.test.ts`, `tests/roomRules.test.ts`, `tests/doorRules.test.ts`, `tests/viewRules.test.ts`, `tests/genericRules.test.ts`

**Files to modify:**
- `lib/rules/ruleEngine.ts` — import the five arrays into `RULE_REGISTRY`

**Implementation details:**
- Implement each rule exactly per the §1.12 catalog: id, name, severity, logic, skip behavior, and the duplicate/blank/placeholder conventions in §1.12's preamble.
- Use the engine helpers (`makeIssue`, `findDuplicates`, `eachRow`) — no rule re-implements duplication or id formatting.
- Every issue's `suggestedFix` is a concrete, actionable sentence. Canonical fixes (use these, adjust wording naturally):
  - Missing value: "Fill in the {field} in Revit and re-export the schedule."
  - Duplicate: "Renumber so each {field} is unique; duplicates break referencing and drawing coordination."
  - Pattern: "Use the project sheet numbering convention, e.g. 'A-101' (discipline letter, hyphen, number)."
  - Placeholder: "Replace the placeholder '{value}' with the final value before issuing."
  - Unplaced view: "Place the view on a sheet, or mark it as a working view per your view-naming convention."
  - Naming: "Adopt a consistent view naming convention, e.g. 'LEVEL - DISCIPLINE - DESCRIPTION'."
  - Sparse row: "Complete the row's data in Revit, or delete the row if it's an artifact."
- Placeholder rules (`*-placeholder`, `generic-placeholder`) scan **all columns** of each row; one issue per offending cell.
- Tests per rule file:
  - Run the full rule set against the corresponding M1-T2 sample CSV (parse with `parseCsv`) and assert: every rule id in that set appears in the issues at least once **or** is in skippedRules for documented reasons (for samples, all should fire — that was the M1-T2 seeding contract; if one doesn't, fix the sample data, not the assertion).
  - Per-rule minimal fixtures: tiny inline CSVs (3–5 rows) asserting exact `rowNumber`, `column`, and severity for one positive and one negative case. Duplicate rules: assert BOTH duplicate rows are flagged. Skip rules (`room-missing-department`, `door-missing-room`, `door-missing-fire-rating`, `view-unplaced-missing-sheet`): assert presence in `skippedRules` when the column is absent and issues when present.
  - `sheet-number-pattern`: table-driven test — valid: `A-101`, `A101`, `AD-101`, `A-101.1`, `M-1.02`, `S.201`; invalid: `SHEET-01A-X`, `101-A`, `A_101`, `AAAA-101`, `A-12345`.

**Acceptance criteria:**
- Every rule id from §1.12 exists, is registered, and has at least one positive + one negative test.
- Running each sample dataset produces issues for every rule in its set.
- Full test suite green; `npm run build` passes.

**Validation steps:**
1. `npm run test` — all green.
2. Count check: registry sizes — sheet 5, room 6, door 5, view 5, generic 4.

**Failure cases to handle:**
- Column mapped but header renamed by dedup (` (2)` suffix): ColumnMap stores the actual (deduped) header string, so lookups still work — add one test for a duplicate-header file.
- Row where the mapped column key is absent from the row object (shouldn't happen post-parser blank-filling, but treat `undefined` as blank via `isBlank`).

**Notes for Codex:**
- If sample data fails the "every rule fires" assertion, edit the sample (M1-T2 files) — the catalog is the source of truth.
- Severity assignments in §1.12 are final; do not re-judge them.

---

## Ticket M1-T7

**Ticket ID:** M1-T7
**Title:** Issue dashboard — run checks, severity summary, filterable issue table
**Goal:** Wire "Run QA checks" to the engine and build the results UI: severity summary cards, skipped-rules note, and an issue table with severity/rule/search filters and expandable detail.
**User value:** The core payoff — the user sees every problem in their schedule, prioritized and explorable.

**Files to create:**
- `components/dashboard/SeveritySummary.tsx`
- `components/issues/IssueFilters.tsx`
- `components/issues/IssueTable.tsx`
- `components/issues/IssueDetail.tsx`

**Files to modify:**
- `app/page.tsx` — add `result: RuleResult | null` state, "Run QA checks" button, filter state, results section

**Implementation details:**
- **page.tsx**: primary "Run QA checks" button below the preview (enabled once `parsed` && `scheduleType`). Click → `setResult(runRules(parsed, scheduleType))`, scroll results into view (`ref.scrollIntoView({ behavior: "smooth" })`). Changing schedule type or uploading a new file clears `result` and filters.
- **Filter state** (in page.tsx): `{ severities: Set<Severity>; ruleIds: Set<string>; search: string }` — empty sets mean "no filter". Filtering is derived state (`useMemo`), never stored filtered copies.
  - Search matches (case-insensitive substring) against: ruleName, problem, column, suggestedFix, and String(rowNumber).
- **SeveritySummary.tsx**: props `{ issues: Issue[]; activeSeverities: Set<Severity>; onToggle(s: Severity): void }`. Three clickable cards (count + label, colors per §1.13) acting as severity filter toggles (active = ring highlight). A fourth muted card: total issues. Zero issues overall → replaced by a green success panel: "No issues found — schedule looks clean. ✓".
- **IssueFilters.tsx**: props `{ rules: {id, name, count}[]; activeRuleIds; onToggleRule; search; onSearch; onClear }`. Search input (with clear ×), rule multi-select as checkbox dropdown or wrap-row of pill toggles showing `name (count)` — pills preferred, simpler. "Clear filters" ghost button appears only when any filter active. Rule list derives from the *unfiltered* result's distinct rules.
- **IssueTable.tsx**: props `{ issues: Issue[] }` (already filtered+sorted). Columns: severity `Badge`, Row (`—` for null), Column, Rule, Problem. Row click toggles an inline expanded `IssueDetail` region.
  - Header shows "N issues" (or "N of M issues" when filtered).
  - Empty-after-filtering → small `EmptyState` "No issues match your filters" + clear button.
- **IssueDetail.tsx**: expanded panel with all fields: rule name + id, severity badge, row number, column, full problem text, and Suggested fix highlighted in a bordered box.
- **Skipped rules**: if `result.skippedRules.length > 0`, show a muted info line under the summary: "N checks skipped (columns not found): {rule names}" — map ids to names via the registry.
- No pagination/virtualization: render all filtered issues. `// ponytail: unvirtualized table; add react-window only if 1k+ issue files stutter`

**Acceptance criteria:**
- Sample sheet list → Run QA checks → issues appear matching the seeded errors (verify counts against M1-T6 test expectations).
- Severity card toggles, rule pills, and search all combine (AND semantics) and update counts live.
- "Clear filters" restores full list.
- Row expand/collapse works; suggested fix visible.
- Room sample with department column removed (edit sample text in devtools or temp file) → skipped-rules line appears.
- `npm run build` + `npm run test` pass.

**Validation steps:**
1. `npm run dev`; load each sample, run checks, cross-check issue counts vs the seeded errors in M1-T2.
2. Type a room number into search → only that row's issues remain.
3. Toggle critical off → warnings/info only.
4. Upload a clean 3-row hand-made CSV → green success panel.

**Failure cases to handle:**
- Running checks twice (idempotent — result replaced).
- Filter combination yielding zero → filtered empty state, not the success panel.
- Very long problem strings → `truncate` in the table cell, full text in detail.

**Notes for Codex:**
- Keep filtering logic as pure helper(s) in `lib/utils` if it exceeds ~15 lines in the component; otherwise inline `useMemo` in page.tsx is fine.
- Do not refetch/re-run rules on filter changes — filters operate on the stored `result.issues`.

---

## Ticket M1-T8

**Ticket ID:** M1-T8
**Title:** Export issue report as CSV
**Goal:** Implement `exportIssuesCsv.ts` (pure CSV-string builder + tiny DOM download trigger) and an "Export report (CSV)" button on the dashboard exporting the **currently filtered** issues with metadata header lines.
**User value:** The user leaves with a shareable QA report they can attach to an email or issue tracker — the deliverable of the whole workflow.

**Files to create:**
- `lib/export/exportIssuesCsv.ts`
- `tests/exportIssuesCsv.test.ts`

**Files to modify:**
- `app/page.tsx` — Export button in the results header area (secondary variant, disabled when 0 filtered issues)

**Implementation details:**
- `buildIssuesCsv(issues: Issue[], meta: { fileName: string; scheduleType: ScheduleType; ranAt: string; totalIssues: number; filteredCount: number }): string` — **pure**, fully tested:
  - Metadata block as comment-style leading rows (each a single-cell row): `BIM QA Copilot Report`, `Source file: {fileName}`, `Schedule type: {label}`, `Checked at: {ranAt}`, `Issues: {filteredCount} of {totalIssues}` then one blank line.
  - Header row: `Severity,Row,Column,Rule,Problem,Suggested Fix`.
  - One row per issue in current sort order. Severity capitalized. Null rowNumber → empty cell.
  - CSV escaping: any field containing `,`, `"`, `\n`, or `\r` is wrapped in quotes with internal quotes doubled. Write this tiny escaper by hand (6 lines) — Papa Parse's unparse would also work; prefer `Papa.unparse` for the issue rows if it cleanly supports the metadata prefix, otherwise hand-roll all of it. Choose ONE approach; do not mix.
  - Line endings: `\r\n` (Excel-friendly).
  - Prepend UTF-8 BOM `﻿` so Excel opens it with correct encoding.
- `downloadCsv(csv: string, downloadName: string): void` — creates a `Blob` (`text/csv;charset=utf-8`), object URL, temporary `<a download>`, click, revoke. The only DOM-touching function in `/lib`.
- Download name: `qa-report-{sourceFileName-without-extension}-{yyyy-MM-dd}.csv`.
- `tests/exportIssuesCsv.test.ts`: escaping (comma, quote, newline in problem text), BOM present, metadata lines correct, null rowNumber → empty cell, empty issues array → metadata + header only, CRLF endings.

**Acceptance criteria:**
- Export of filtered sample sheet-list issues opens correctly in Excel/LibreOffice (columns aligned, no mangled quotes, UTF-8 intact).
- Filters applied → exported rows match visible rows exactly.
- All export tests pass; `npm run build` passes.

**Validation steps:**
1. `npm run test`.
2. `npm run dev`, sheet sample, run checks, filter to critical, export, open the file in a spreadsheet app (or inspect raw text): BOM, metadata block, only critical rows.

**Failure cases to handle:**
- Issue text containing quotes/commas/newlines (seed one in sample data if none exists — sheet name `"Details, Sections & Callouts"` from M1-T2 helps).
- Source filename with spaces/unicode → sanitize download name (replace non `[a-z0-9-_]` with `-`).

**Notes for Codex:**
- Keep string building and DOM download strictly separate exports so tests never touch the DOM.

---

## Ticket M1-T9

**Ticket ID:** M1-T9
**Title:** Polish, hardening, README, and PROJECT_STATE.md finalization
**Goal:** Final QA pass: error boundary, loading/edge states, visual polish, accessibility basics, full test-suite verification, complete README, and PROJECT_STATE.md updated to reflect Milestone 1 completion.
**User value:** The app is demo-ready: nothing crashes, everything is explained, and a stranger can clone + run it from the README alone.

**Files to create:**
- `app/error.tsx` — Next.js route error boundary: friendly message + "Reload" button (calls `reset()`)

**Files to modify:**
- `README.md` — full rewrite
- `PROJECT_STATE.md` — final M1 status
- Any components needing polish fixes found during the pass (list them in the commit message)

**Implementation details:**
- **Hardening pass** — manually exercise and fix anything broken:
  1. Every sample: upload → preview → each of the 5 schedule types (including deliberately "wrong" type, e.g. room sample as sheet list — should run, produce column-absent file-level issues, and not crash) → run → filter → export.
  2. Header-only CSV, 1-row CSV, CSV with 100 columns, 5001-row CSV (generate quickly in Node) — graceful behavior + large-file warning.
  3. Keyboard pass: drop-zone activatable via Enter (role="button", tabIndex, onKeyDown); filter pills and severity cards are real `<button>`s; issue-row expansion via `<button>`/aria-expanded; search input labeled (`aria-label` fine).
  4. Visual pass: consistent spacing scale, one accent style, focus-visible rings on interactive elements, sensible `title` truncations. Keep the neutral slate palette; severity colors are the only strong colors.
- **README.md** contents: what it is (2–3 sentences + the workflow list), screenshot placeholder (`![screenshot](docs/screenshot.png)` — add `docs/` with the image if easy to capture, else leave the placeholder line commented), features list, how to run (`npm install`, `npm run dev`, `npm run test`, `npm run build`), how to use (upload or samples → pick type → run → filter → export), rule reference table (compact version of §1.12: rule name + severity per schedule type), architecture note (3 lines: pure lib / thin UI / local-first), scope note ("Milestone 1 — no accounts, no cloud; your data never leaves the browser").
- **PROJECT_STATE.md**: move all tickets to Completed, update Current milestone to "Milestone 1 — COMPLETE", refresh Known risks, add any new architecture decisions made during implementation.
- Full gate: `npm run lint`, `npm run test`, `npm run build` all clean.

**Acceptance criteria:**
- Zero uncaught exceptions across the full manual matrix above (check browser console).
- Lint, tests, and production build all pass.
- README enables a cold clone-and-run.
- PROJECT_STATE.md accurately reflects final state.
- Tab-only navigation can complete the entire core flow (sample → run → filter → export).

**Validation steps:**
1. `npm run lint`; `npm run test`; `npm run build`; `npm run start` and re-verify the core flow on the production build.
2. Full manual matrix from Implementation details step 1–2.
3. Keyboard-only walkthrough.

**Failure cases to handle:**
- Any crash found in the matrix is a bug to fix within this ticket, not to log.

**Notes for Codex:**
- Resist adding features during polish. Polish = fixing, clarifying, aligning — not extending.
- If a fix requires touching `/lib` logic, add/adjust a test with it.

---

# Part 3 — Initial PROJECT_STATE.md draft

Codex: create this file verbatim in M1-T1, then keep it updated at the end of every ticket.

```markdown
# PROJECT_STATE — BIM QA Copilot

## Product purpose
Local-first web app that checks Revit-exported CSV schedules (sheet lists, room/door schedules, view lists, generic) against BIM QA rules and exports issue reports. Portfolio project + genuinely usable QA tool for BIM coordination work.

## Tech stack
- Next.js (App Router) + TypeScript (strict) + Tailwind CSS + React
- Papa Parse (CSV parsing), Vitest (logic tests)
- 100% client-side; no backend, no persistence in Milestone 1

## Current milestone
Milestone 1 — vertical slice (upload → parse → preview → select type → run rules → dashboard → export CSV)

## Completed features
- (none yet)

## Pending tickets
- M1-T1 Project setup and baseline UI shell
- M1-T2 Core types, shared utils, sample data
- M1-T3 CSV parser, column detection, validation
- M1-T4 Upload, sample loader, type selector, data preview
- M1-T5 Rule engine core
- M1-T6 Schedule-specific rule sets
- M1-T7 Issue dashboard
- M1-T8 CSV export of issue report
- M1-T9 Polish, tests, README, state finalization

## Architecture decisions
- Pure logic, thin UI: all parsing/rules/export in /lib as pure functions; app/page.tsx owns all state; components are presentational.
- Papa Parse in array mode (not header mode) — manual header handling for duplicate headers + warnings; dynamicTyping OFF (leading zeros must survive).
- Rules are data + pure check functions registered per ScheduleType; engine is schedule-agnostic; rules skip via appliesTo() when required columns are absent.
- Duplicate checks flag every row in the duplicate group, case-insensitive, blanks excluded.
- One shared placeholder list in lib/utils/placeholders.ts.
- Canonical types in /types (ScheduleType, Severity, ParsedCsv, ScheduleRow, Issue, CsvParseWarning) + /lib/rules/types.ts (Rule, RuleResult, RuleContext, ColumnMap).
- Sample data ships as in-repo CSV strings, seeded so every rule fires at least once.
- Issue export: pure CSV-string builder + separate DOM download helper; UTF-8 BOM + CRLF for Excel.

## Scope exclusions (do not build)
Auth, payments, teams, cloud sync, AI chat, real-time collaboration, mobile app, enterprise features, databases, state libraries, component libraries.

## Commands to run
- npm install
- npm run dev          # localhost:3000
- npm run test         # Vitest (parser, rules, export)
- npm run lint
- npm run build

## Known risks
- Revit column-name variance: mitigated by synonym-based detectColumns; unmatched columns cause rule skips (surfaced in UI), not crashes.
- CSV encoding variance (BOM, CRLF, non-UTF8): parser strips BOM, handles CRLF; non-UTF8 may show replacement chars (accepted for M1).
- Large files: soft warning above 5000 rows; preview capped at 50 rows; issue table unvirtualized (acceptable until real-world files prove otherwise).
- View-naming heuristic (view-naming-pattern) is deliberately naive; may need project-configurable patterns later.
```

---

*End of roadmap. Codex: begin with M1-T1.*
