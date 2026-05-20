# Phase 3: UI Components - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers all 5 interactive components assembled into a working calculator:

1. **IngredientSelector** — 2-column scrollable grid of 20 tappable ingredient buttons, grouped by type
2. **UnitSelector** — 4 always-visible unit buttons (чаена лъжица, супена лъжица, чаена чаша, кафена чаша)
3. **QuantityInput** — text field with `type="text" inputmode="decimal"`, live result on every keystroke
4. **ResultDisplay** — result string at `--font-result` (40px, weight 700) with `"— г"` placeholder
5. **Event wiring (main.js)** — connects all components, calls `convert()`, updates result display

Phase 3 does NOT add new routes, backend calls, or new data. It wires the existing `convert()` function to the UI and makes the calculator functional.

</domain>

<decisions>
## Implementation Decisions

### Ingredient grid layout

- **D-01:** The ingredient section is a scrollable container with a fixed height. Units, quantity input, and result are always visible below the ingredient grid — no page-level scroll. Only the ingredient picker scrolls internally within its own section.

- **D-02:** 2-column grid layout for ingredient buttons. Each button is approximately half the screen width, keeping long names (варен фасул, прясно мляко) readable without truncation. Satisfies UI-02 (≥ 48px touch targets).

- **D-03:** Ingredients are grouped into two categories with a small muted text label above each group:
  - **"Течности"** — вода, олио, прясно мляко, оцет (the 4 liquid ingredients that return мл)
  - **"Сухи"** — all remaining 16 ingredients (return гр)
  The group label uses `--color-text-muted` and a smaller font size. No horizontal rule separator — text label only.

### Initial load state

- **D-04:** On load, **брашно** and **супена лъжица** are pre-selected (visually highlighted with `--color-accent`). These are the most common measurement in Bulgarian recipes and immediately demonstrate the calculator metaphor.

- **D-05:** The quantity input field starts **empty** on load. The result area shows the `"— г"` placeholder (static HTML, not produced by `convert()`). This invites the user to type a number.

### Layout order

- **D-06:** Top-to-bottom order: IngredientSelector → UnitSelector → QuantityInput → ResultDisplay. This matches the existing `index.html` placeholder comments and the natural reading flow: "pick what, pick how much of it, enter quantity, see result."

### Claude's Discretion

- **Component architecture:** Single `src/main.js` for all event wiring. Each "component" is a function that renders HTML into a container and returns the DOM element (or injects directly). No separate files per component — the app is small enough to keep flat. Follow the established pattern from Phase 1 (minimal main.js).
- **Scrollable section height:** Choose a fixed height (e.g., 200–240px) for the ingredient section that allows ~4–5 rows of 2-column buttons to show before scrolling, leaving room for units + quantity + result on a 667px-tall iPhone SE screen.
- **Button active state:** Use CSS `:active` pseudo-class for tap feedback (background flash). No JavaScript needed for press state.
- **Quantity label:** `<label>` element with Bulgarian text "Количество:" associated with the input via `for`/`id` pair (TECH-08).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and success criteria
- `.planning/REQUIREMENTS.md` — CONV-01, CONV-02, UI-01 through UI-06, TECH-08 acceptance criteria
- `.planning/ROADMAP.md` — Phase 3 success criteria (5 items)

### Design system and tokens
- `src/style.css` — All CSS custom properties already defined: colors (`--color-accent`, `--color-text-muted`), spacing scale, typography (`--font-result: 40px`, `--font-label: 16px`). Phase 3 MUST use these tokens — no hardcoded values.
- `.planning/phases/01-foundation/01-CONTEXT.md` — D-04/D-05 (scaffold layout), D-06 (font file paths). Integration points for Phase 3.

### Converter contract (source of truth for result strings)
- `.planning/phases/02-conversion-engine/02-VERIFICATION.md` — "Contract for Phase 3" section. The exact strings `convert()` returns. Phase 3 MUST NOT transform these strings.
- `src/converter.js` — The `convert(ingredient, unit, quantity)` function. Named ES export. Read before writing event handlers.
- `.planning/phases/02-conversion-engine/02-UI-SPEC.md` — Rendering guidance: missing-combo and error messages display in `--color-text-muted`, valid results in `--color-text`. `type="text" inputmode="decimal"` for quantity input.

### Data (ingredient/unit keys)
- `src/data/measurements.js` — Exports `ingredients` array (20 items, in order) and `units` array (4 items, in order). Use these arrays to render buttons — do NOT hardcode ingredient names or unit names in the HTML or JS.

### Project constraints
- `CLAUDE.md` — Vanilla JS only, no framework, no TypeScript. Single-file components encouraged.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/converter.js` — `export function convert(ingredient, unit, quantity)` → string. Ready to import and call in event handlers.
- `src/data/measurements.js` — `export const ingredients` (array of 20 strings) and `export const units` (array of 4 strings). Use to generate buttons dynamically — no hardcoding.
- `src/style.css` — All design tokens defined. The shell layout (`.app-shell`, `.app-header`, `.app-main`) is already applied.

### Established Patterns
- ES module imports throughout: `import { convert } from './converter.js'`
- CSS custom properties for all visual values — follow this pattern for Phase 3 component styles
- `index.html` already has `<main class="app-main">` with 4 placeholder comments for the 3 components

### Integration Points
- `index.html` `<main class="app-main">` — Phase 3 fills this with the 4 components
- `src/main.js` — Currently `import './style.css'` only. Phase 3 adds component rendering and event wiring here.
- Pre-selected defaults: `ingredients[4]` = `"брашно"` (index 4 in the array), `units[1]` = `"супена лъжица"` (index 1). Verify against `src/data/measurements.js` before hardcoding indices — use value matching instead.

</code_context>

<specifics>
## Specific Ideas

- Ingredient grouping: "Течности" = the 4 ingredients where `measurements[ing]["чаена лъжица"].unit === "мл"` (вода, олио, прясно мляко, оцет). Derive from data rather than hardcoding the list.
- The `"— г"` placeholder is static HTML in the result display — not produced by `convert()`. When `convert()` returns `""` (empty quantity), Phase 3 restores the placeholder.
- Quantity input should have `autocomplete="off"` and `autocorrect="off"` to prevent mobile keyboard autocorrect from mangling numbers.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-ui-components*
*Context gathered: 2026-05-20*
