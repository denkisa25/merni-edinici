# Phase 2 Verification

**Date:** 2026-05-20
**Phase:** 02-conversion-engine
**Commit:** 29c3eb7

## Test Run

Command: `node src/converter.test.js`

```text
PASS  CONV-05 "1,5" брашно супена лъжица
PASS  CONV-05 "1.5" брашно супена лъжица
PASS  CONV-05 leading-comma ",5" брашно ч.л.
PASS  CONV-05 trailing-comma "2," брашно с.л.
PASS  TECH-06 22.5 stays 22.5
PASS  TECH-06 integer suppression 20 not 20.0
PASS  TECH-06 integer 7 not 7.0
PASS  TECH-06 1.5 × 8 сол = 12 гр
PASS  TECH-06 1.3 × 30 ориз = 39 гр
PASS  TECH-06 1.35 × 10 брашно = 13.5 гр
PASS  CONV-04 вода → мл
PASS  CONV-04 олио → мл
PASS  CONV-04 прясно мляко → мл
PASS  CONV-04 оцет → мл
PASS  CONV-04 кисело мляко → гр
PASS  CONV-04 захар → гр
PASS  CONV-06 мед ч.л.
PASS  CONV-06 грис с.л.
PASS  CONV-06 леща ч.л.
PASS  CONV-06 варен фасул с.л.
PASS  CONV-06 нишесте ч.ч.
PASS  CONV-06 оцет к.ч.
PASS  Empty input → ""
PASS  Whitespace input → ""
PASS  Zero → guidance message
PASS  Zero with comma → guidance
PASS  Negative → guidance
PASS  Non-numeric → "число"
PASS  Double dash → "число"
PASS  Unknown ingredient
PASS  Unknown unit
PASS  Numeric arg 2 → "20 гр"

Total: 32  passed: 32  failed: 0
EXIT: 0
```

## ROADMAP Phase 2 Success Criteria → Evidence

| # | Criterion | Proven by PASS line |
|---|-----------|---------------------|
| 1 | "1,5" and "1.5" produce the same result | `PASS  CONV-05 "1,5" брашно супена лъжица` AND `PASS  CONV-05 "1.5" брашно супена лъжица` (both return `'15 гр'`) |
| 2 | No `22.499999996` ever appears | `PASS  TECH-06 22.5 stays 22.5`, `PASS  TECH-06 integer suppression 20 not 20.0` |
| 3 | Missing combo returns friendly Bulgarian message | `PASS  CONV-06 мед ч.л.` (returns `'Тази мярка не се използва за мед'`) plus 5 more |
| 4 | Liquids → мл, solids → гр | `PASS  CONV-04 вода → мл`, `PASS  CONV-04 захар → гр`, plus 4 more |

## Requirements → Evidence

| Requirement | Phase 2 Coverage | Evidence |
|-------------|------------------|----------|
| CONV-03 (instant update, no submit) | Function is synchronous and pure — caller can invoke per-keystroke | Function signature `convert(ingredient, unit, quantity) → string` (no callbacks, no promises, no submit) |
| CONV-04 (гр or мл label) | Unit label read from `leaf.unit`, never hardcoded | All `CONV-04 ...` PASS lines |
| CONV-05 (comma + dot decimals) | `.replace(',', '.')` before parseFloat | All `CONV-05 ...` PASS lines |
| CONV-06 (missing combo Bulgarian message) | Explicit `leaf === null` branch returns `Тази мярка не се използва за ${ingredient}` | All `CONV-06 ...` PASS lines |
| TECH-06 (round to ≤ 1 decimal, no float garbage) | `Math.round(x*10)/10` + integer suppression | All `TECH-06 ...` PASS lines |

## Contract for Phase 3

Phase 3 imports `{ convert }` from `./converter.js` and uses these strings without alteration:

- Valid result:    `"<number> гр"` or `"<number> мл"` (single space, no trailing `.0`)
- Empty input:     `""`  (Phase 3 substitutes its `— г` placeholder)
- Zero / negative: `"Моля, въведете число по-голямо от нула"`
- Non-numeric:     `"Моля, въведете число"`
- Missing combo:   `"Тази мярка не се използва за <ingredient>"`
- Defensive:       `"Непозната комбинация"`

Phase 3 MUST NOT transform these strings. If a copy change is required, update `src/converter.js` and re-run `node src/converter.test.js`.

## Status

- [x] All success criteria proven by automated test
- [ ] User sign-off (Plan 02-02 Task 2)
