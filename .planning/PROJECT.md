# Мерни Единици в Кухнята

## What This Is

A Bulgarian-language web app that lets home cooks — including those with little internet experience — instantly convert Bulgarian kitchen measurements (чаена лъжица, супена лъжица, чаена чаша, кафена чаша) to grams and milliliters for common ingredients. The interface is styled like an intuitive calculator so users never need instructions to understand it.

## Core Value

A Bulgarian home cook picks an ingredient, selects a unit, enters a quantity, and immediately sees the gram/ml equivalent — no scrolling, no reading, no confusion.

## Requirements

### Validated

- [x] Conversion math is correct and robust for all input types — validated in Phase 2: decimal normalization (comma=dot), rounding to ≤1 decimal (no float garbage), missing-combo friendly messages, liquid/solid unit labels (гр/мл) all verified by 32-assertion test harness
- [x] Conversion data covers all ingredients from supichka.com reference (20 ingredients × 4 units) — validated in Phase 1, data correction in Phase 2: прясно мляко + чаена чаша corrected to 250 мл

### Active

- [ ] User can select an ingredient from a list of common Bulgarian kitchen ingredients
- [ ] User can select a measurement unit (чаена лъжица, супена лъжица, чаена чаша, кафена чаша)
- [ ] User can enter a quantity and see the gram/ml result instantly
- [ ] Conversion data covers all ingredients from supichka.com reference (water, salt, sugar, powdered sugar, flour, breadcrumbs, rice, oil, butter, margarine, lard, milk, sour milk, honey, semolina, lentils, beans, starch, vinegar, red pepper)
- [ ] App is fully in Bulgarian language
- [ ] App is mobile-first and works on all screen sizes
- [ ] Interface is intuitive enough for users with minimal internet experience (calculator-style layout)
- [ ] App works offline / without backend (static deployment)

### Out of Scope

- User accounts / saved conversions — not needed for a simple utility
- Recipes or cooking content — focus is purely on unit conversion
- Languages other than Bulgarian — v1 is Bulgarian-specific audience only
- Admin CMS for measurement data — data is static, baked into the app
- Reverse conversion (grams → cups) — can be added in v2

## Context

**Measurement data source:** supichka.com reference page for Bulgarian kitchen measurements. Data is already gathered:

### Чаена лъжица (teaspoon, ~5ml)
| Продукт | Грамове |
|---------|---------|
| Вода | 5g |
| Сол | 8g |
| Захар | 10g |
| Пудра захар | 5g |
| Червен пипер | 5g |
| Брашно | 3g |
| Галета | 6g |
| Оцет | 5g |
| Прясно мляко | 6g |
| Кисело мляко | 8g |
| Олио | 5g |
| Масло | 7g |
| Маргарин | 10g |
| Мас | 20g |
| Ориз | 10g |
| Нишесте | 10g |

### Супена лъжица (tablespoon, ~15-20ml)
| Продукт | Грамове |
|---------|---------|
| Вода | 20g |
| Сол | 15g |
| Захар | 20g |
| Пудра захар | 18g |
| Червен пипер | 12g |
| Брашно | 10g |
| Галета | 12g |
| Оцет | 10g |
| Прясно мляко | 15g |
| Кисело мляко | 20g |
| Олио | 20g |
| Масло | 40g |
| Маргарин | 50g |
| Мас | 50g |
| Ориз | 30g |
| Нишесте | 20g |
| Мед | 50g |

### Чаена чаша (tea cup, 200ml)
| Продукт | Грамове |
|---------|---------|
| Вода | 200ml |
| Сол | 220g |
| Захар | 220g |
| Пудра захар | 150g |
| Брашно | 140g |
| Галета | 140g |
| Прясно мляко | 220g |
| Кисело мляко | 200g |
| Леща | 200g |
| Варен фасул | 150g |
| Олио | 180g |
| Масло | 210g |
| Маргарин | 240g |
| Мас | 240g |
| Ориз | 220g |
| Грис | 160g |
| Мед | 300g |

### Кафена чаша (coffee cup, 75ml)
| Продукт | Грамове |
|---------|---------|
| Вода | 75ml |
| Захар | 80g |
| Пудра захар | 55g |
| Брашно | 50g |
| Галета | 60g |
| Прясно мляко | 85g |
| Кисело мляко | 80g |
| Леща | 70g |
| Варен фасул | 60g |
| Олио | 65g |
| Масло | 80g |
| Маргарин | 90g |
| Мас | 75g |
| Ориз | 85g |
| Грис | 70g |
| Мед | 150g |

### Additional conversions
- 1 щипка (два пръста / pinch): ~1g
- 1 шепа сол (handful of salt): ~80g
- 1 захарен блок (sugar cube): ~6g
- 1 яйце (egg): ~50g

**Target audience:** Bulgarian home cooks, including older and less tech-savvy users. Mobile usage expected to dominate.

**Deployment:** Static site, no backend required. Can be hosted on GitHub Pages, Vercel, Netlify, etc.

**Linear:** Project tracked in Linear workspace "Denkisa Dev".

## Constraints

- **Language**: Bulgarian-only UI — all labels, units, ingredient names in Bulgarian
- **Stack**: Must be deployable as a fully static site (no server, no database)
- **UX**: Must be usable without any instructions — calculator-style metaphor
- **Accessibility**: Large touch targets, readable font sizes for older users

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static site, no backend | Zero infrastructure cost, instant load, works offline | — Pending (Phase 4) |
| All data baked in at build time | Measurement data never changes; no API needed | ✓ Validated Phase 1–2 |
| Bulgarian language only | Target audience is specifically Bulgarian | ✓ Validated Phase 1–2 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-20 — Phase 2 (Conversion Engine) complete. `convert()` pure function (src/converter.js) verified by 32-assertion test harness; all CONV-03/04/05/06 + TECH-06 requirements satisfied. Phase 3 contract frozen.*
