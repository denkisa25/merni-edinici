# Roadmap — Мерни Единици в Кухнята

**Project:** Bulgarian kitchen measurement converter
**Milestone:** v1 (initial release)
**Granularity:** Standard
**Coverage:** 23/23 v1 requirements mapped

---

## Phases

- [ ] **Phase 1: Foundation** — Project scaffold, HTML shell, Vite setup, self-hosted font, CSS custom properties, and the validated measurements data file
- [ ] **Phase 2: Conversion Engine** — Pure conversion logic: decimal normalization, rounding, missing-combo handling, and unit result rendering (гр/мл) — no UI yet
- [ ] **Phase 3: UI Components** — All 5 interactive components assembled into the complete calculator interface
- [x] **Phase 4: Deploy** — Public deployment with auto-deploy on push to main (completed 2026-05-22)

---

## Phase Details

### Phase 1: Foundation
**Goal**: The project skeleton is running locally with validated data; every subsequent phase builds on a correct, complete foundation
**Depends on**: Nothing
**Requirements**: TECH-01, TECH-02, TECH-03, TECH-04, TECH-05, TECH-07, CONV-07
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts the app in browser with no console errors
  2. Page source contains `<html lang="bg">`, `<meta charset="UTF-8">`, and a non-zooming viewport meta
  3. Noto Sans Cyrillic renders from a local file (no Google Fonts CDN request in Network tab)
  4. `src/data/measurements.js` exists, exports all 20 ingredients across all 4 units, and opens in browser without error
  5. CSS custom properties for color tokens and spacing are defined and applied to the shell
**Plans**: 3 plans
  - [x] 01-01-PLAN.md — Vite scaffold, HTML shell, self-hosted Noto Sans, CSS token system
  - [x] 01-02-PLAN.md — measurements.js data file (20 ingredients × 4 units)
  - [x] 01-03-PLAN.md — Integration verification (automated checks + human checkpoint)
**UI hint**: yes

### Phase 2: Conversion Engine
**Goal**: The conversion calculation is correct and robust for all input types; no UI component can introduce data bugs after this point
**Depends on**: Phase 1
**Requirements**: CONV-03, CONV-04, CONV-05, CONV-06, TECH-06
**Success Criteria** (what must be TRUE):
  1. Entering `1,5` and `1.5` in a test harness both produce the same numeric result (comma normalized to dot)
  2. A result like `22.499999996` never appears — all float output is rounded to at most 1 decimal place
  3. Querying a missing ingredient-unit combination (e.g., мед + чаена лъжица) returns a friendly Bulgarian message, not `null`, `0`, or blank
  4. Liquid ingredients (вода, олио, мляко, оцет) produce a мл-labeled result; solid ingredients produce a гр-labeled result
**Plans**: 2 plans
  - [x] 02-01-PLAN.md — TDD build of src/converter.js (RED test harness + GREEN implementation)
  - [x] 02-02-PLAN.md — Capture VERIFICATION.md evidence and lock the Phase 3 contract (human sign-off)

### Phase 3: UI Components
**Goal**: A Bulgarian home cook can open the app on a mobile phone, pick an ingredient, select a unit, type a quantity, and immediately read the correct result — without any instructions
**Depends on**: Phase 2
**Requirements**: CONV-01, CONV-02, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, TECH-08
**Success Criteria** (what must be TRUE):
  1. All 20 ingredients are visible as tappable buttons on one screen (no dropdown, no scrolling past the fold on a 375px-wide phone)
  2. All 4 unit buttons are simultaneously visible; the selected ingredient and unit are both visually highlighted
  3. Typing a quantity updates the result on every keystroke — no submit button; result font is ≥ 32px
  4. On initial load the result area shows `— г` so layout does not jump when the first result appears
  5. Every interactive element has a touch target ≥ 48px and a visible Bulgarian `<label>` — verifiable in DevTools Accessibility panel
**Plans**: TBD
**UI hint**: yes

### Phase 4: Deploy
**Goal**: The app is publicly accessible at a stable URL and future code pushes update it automatically
**Depends on**: Phase 3
**Requirements**: DEPLOY-01, DEPLOY-02
**Success Criteria** (what must be TRUE):
  1. A public URL (Vercel or Netlify) loads the app over HTTPS with no build errors
  2. Pushing a commit to `main` triggers an automatic rebuild and the live URL reflects the change within 2 minutes
**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Conversion Engine | 0/? | Not started | - |
| 3. UI Components | 0/? | Not started | - |
| 4. Deploy | 2/2 | Complete   | 2026-05-22 |

---

## Coverage Map

| Requirement | Phase |
|-------------|-------|
| CONV-01 | Phase 3 |
| CONV-02 | Phase 3 |
| CONV-03 | Phase 2 |
| CONV-04 | Phase 2 |
| CONV-05 | Phase 2 |
| CONV-06 | Phase 2 |
| CONV-07 | Phase 1 |
| UI-01 | Phase 3 |
| UI-02 | Phase 3 |
| UI-03 | Phase 3 |
| UI-04 | Phase 3 |
| UI-05 | Phase 3 |
| UI-06 | Phase 3 |
| TECH-01 | Phase 1 |
| TECH-02 | Phase 1 |
| TECH-03 | Phase 1 |
| TECH-04 | Phase 1 |
| TECH-05 | Phase 1 |
| TECH-06 | Phase 2 |
| TECH-07 | Phase 1 |
| TECH-08 | Phase 3 |
| DEPLOY-01 | Phase 4 |
| DEPLOY-02 | Phase 4 |

**Total: 23/23 v1 requirements mapped.**

---

*Created: 2026-05-19*
