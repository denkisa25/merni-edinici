# Requirements — Мерни Единици в Кухнята

## v1 Requirements

### Core Conversion (CONV)

- [ ] **CONV-01**: User can select an ingredient from a grid of tappable buttons (full Bulgarian names, no dropdown)
- [ ] **CONV-02**: User can select a measurement unit from 4 always-visible buttons (чаена лъжица, супена лъжица, чаена чаша, кафена чаша)
- [ ] **CONV-03**: User can enter a quantity and the result updates instantly on every keystroke — no submit button
- [ ] **CONV-04**: Result is displayed in гр or мл (мл for liquid ingredients)
- [ ] **CONV-05**: Decimal input works correctly — both comma (1,5) and dot (1.5) accepted (Bulgarian locale uses comma)
- [ ] **CONV-06**: Missing ingredient-unit combinations show a friendly Bulgarian message, not blank or 0
- [ ] **CONV-07**: Conversion data covers all ingredients: вода, сол, захар, пудра захар, брашно, галета, ориз, олио, масло, маргарин, мас, прясно мляко, кисело мляко, мед, грис, леща, варен фасул, нишесте, оцет, червен пипер

### UI & Layout (UI)

- [ ] **UI-01**: Interface fits entirely on one screen without scrolling on mobile (320px–428px wide)
- [ ] **UI-02**: All touch targets are ≥ 48px — usable by older users with imprecise touch
- [ ] **UI-03**: App is fully in Bulgarian language — all labels, unit names, ingredient names, messages
- [ ] **UI-04**: Result text is displayed in large, prominent font (≥ 32px)
- [ ] **UI-05**: Selected ingredient and selected unit are visually highlighted
- [ ] **UI-06**: Result placeholder shown on load (e.g., "— г") so layout doesn't shift on first result

### Technical (TECH)

- [ ] **TECH-01**: `<html lang="bg">` set — prevents Chrome "translate this page?" prompt
- [ ] **TECH-02**: `<meta charset="UTF-8">` present — prevents Cyrillic mojibake
- [ ] **TECH-03**: Correct viewport meta — never disables user zoom
- [ ] **TECH-04**: Noto Sans self-hosted (not Google Fonts CDN) — offline-capable, GDPR-clean
- [ ] **TECH-05**: All conversion data in a single `src/data/measurements.js` file — no inline magic numbers
- [ ] **TECH-06**: Float results rounded to 1 decimal place maximum (e.g., 22.5г, not 22.499999996г)
- [ ] **TECH-07**: Total JS bundle ≤ 30KB gzipped — works on 3G in under 2 seconds
- [ ] **TECH-08**: All form inputs have associated `<label>` elements with Bulgarian text

### Deployment (DEPLOY)

- [x] **DEPLOY-01**: App is deployed to a public URL (Vercel or Netlify)
- [x] **DEPLOY-02**: Auto-deploy on push to main branch

---

## v2 Requirements (Deferred)

### Polish
- Per-unit reference display ("1 супена лъжица брашно = 10г" alongside result)
- Copy result button ("Копирай")
- Fraction shortcut buttons (½, ¼, ¾) — Bulgarian recipes use "половин чаша"

### PWA / Offline
- Service worker + Web App Manifest (add only after core data is validated)
- "Add to Home Screen" prompt ("Добави към началния екран")
- Full offline support

### Retention
- localStorage restore of last-used ingredient + unit
- Web Share API ("Сподели")
- Print stylesheet / A4 reference card
- Dark mode toggle (manual)

---

## Out of Scope

- User accounts / saved conversions — unnecessary for a lookup utility
- Recipe content — focus is purely on unit conversion
- Languages other than Bulgarian — v1 is Bulgarian-specific
- Backend / database — all data is static
- Reverse conversion (grams → units) — v2 if demand is validated
- Additional conversions (щипка, шепа, захарен блок, яйце) — deferred to v2
- Analytics — adds complexity and requires consent banner

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONV-01 | Phase 3 | Pending |
| CONV-02 | Phase 3 | Pending |
| CONV-03 | Phase 2 | Pending |
| CONV-04 | Phase 2 | Pending |
| CONV-05 | Phase 2 | Pending |
| CONV-06 | Phase 2 | Pending |
| CONV-07 | Phase 1 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 3 | Pending |
| UI-06 | Phase 3 | Pending |
| TECH-01 | Phase 1 | Pending |
| TECH-02 | Phase 1 | Pending |
| TECH-03 | Phase 1 | Pending |
| TECH-04 | Phase 1 | Pending |
| TECH-05 | Phase 1 | Pending |
| TECH-06 | Phase 2 | Pending |
| TECH-07 | Phase 1 | Pending |
| TECH-08 | Phase 3 | Pending |
| DEPLOY-01 | Phase 4 | Complete |
| DEPLOY-02 | Phase 4 | Complete |

---

*Last updated: 2026-05-19 after roadmap creation*
