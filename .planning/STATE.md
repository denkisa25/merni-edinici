---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-05-20T18:48:19.829Z"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# State — Мерни Единици в Кухнята

*This file is the project's memory. Updated at each phase transition and plan completion.*

---

## Project Reference

**Core value:** A Bulgarian home cook picks an ingredient, selects a unit, enters a quantity, and immediately sees the gram/ml equivalent — no scrolling, no reading, no confusion.

**Current focus:** Phase 02 — conversion-engine

---

## Current Position

Phase: 4
Plan: Not started
| Field | Value |
|-------|-------|
| Phase | 1 — Foundation |
| Plan | Not started |
| Status | Not started |
| Phase goal | Project skeleton running locally with validated data |

**Progress:**

```
Phase 1 [          ] Not started
Phase 2 [          ] Not started
Phase 3 [          ] Not started
Phase 4 [          ] Not started
```

**Overall:** 0/4 phases complete

---

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| JS bundle (gzipped) | ≤ 30KB | — |
| Load on 3G | < 2s | — |
| Touch target min | ≥ 48px | — |
| Result font size | ≥ 32px | — |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Vanilla JS + Vite | Zero runtime deps; ≤ 30KB bundle guaranteed | Phase 1 |
| Self-host Noto Sans | Offline-capable; GDPR-clean (no Google Fonts CDN) | Phase 1 |
| Data file before UI | Bug in data is expensive to retrofit after components are built | Phase 1 |
| PWA deferred to v2 | Service worker cache-poisons a broken version; add only after data is validated | — |
| `type="text" inputmode="decimal"` | Handles Bulgarian comma decimal; `type="number"` silently rejects commas | Phase 2 |

### Open Questions

1. Font strategy: Self-host Noto Sans (recommended) vs. system font stack — **decide before writing index.html**
2. Data validation: Cross-check gram values against gotvach.bg — **gates the Phase 1 data step**
3. Ingredient synonyms: Review final Bulgarian names against recipe sites before v1 ship
4. Missing combinations: лъжица for мед, леща, варен фасул — confirm whether genuinely absent or source gap

### Todos

- [ ] Decide on font strategy (self-host vs system stack) before starting Phase 1
- [ ] Validate measurements data against a second source (gotvach.bg) during Phase 1
- [ ] Confirm missing ingredient-unit combinations are intentional gaps, not data errors

### Blockers

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260520-9v8 | Fix кисело мляко unit from мл to гр in src/data/measurements.js | 2026-05-20 | c2a24f1 | [260520-9v8-fix-unit-from-to-in-src-data-measurement](./quick/260520-9v8-fix-unit-from-to-in-src-data-measurement/) |

---

## Session Continuity

**Last session:** 2026-05-20T17:13:14.013Z
**Next action:** Start Phase 1 — run `/gsd-plan-phase 1`

---

*Last updated: 2026-05-19 after roadmap creation*
