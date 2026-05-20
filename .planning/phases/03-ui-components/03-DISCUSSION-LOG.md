# Phase 3: UI Components - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 03-ui-components
**Areas discussed:** Ingredient grid layout, Initial load state

---

## Ingredient grid layout

| Option | Description | Selected |
|--------|-------------|----------|
| Scrollable section (recommended) | Fixed-height ingredient grid scrolls internally; units/quantity/result always visible | ✓ |
| 2-column wrap grid, no scroll | All 20 items fit on screen, may be cramped | |
| Single column, compact, no scroll | One item per row, very tall | |

**Follow-up — columns:**

| Option | Description | Selected |
|--------|-------------|----------|
| 2 columns (recommended) | Half-screen width each, long names readable | ✓ |
| 3 columns | More compact, names may truncate | |
| 1 column | Easiest to read, very tall | |

**Follow-up — visual distinction:**

| Option | Description | Selected |
|--------|-------------|----------|
| Plain text, all equal | All 20 buttons look identical | |
| Group by type with subtle separators | Течности / Сухи groups with label | ✓ |
| You decide | Claude picks | |

**Follow-up — group division:**

| Option | Description | Selected |
|--------|-------------|----------|
| Течности / Сухи (recommended) | Two groups matching гр/мл distinction | ✓ |
| 3–4 categories | More granular grouping | |
| You decide | Claude picks | |

**Follow-up — separator style:**

| Option | Description | Selected |
|--------|-------------|----------|
| Small text label above each group (recommended) | Muted "Течности" / "Сухи" label | ✓ |
| Horizontal rule divider | Thin line, no text | |
| You decide | Claude picks | |

---

## Initial load state

**Pre-selection:**

| Option | Description | Selected |
|--------|-------------|----------|
| First ingredient + first unit pre-selected (recommended) | брашно + супена лъжица highlighted on load | ✓ |
| Nothing pre-selected | Blank canvas, "— г" until user makes choices | |
| Unit pre-selected, ingredient blank | Partial state | |

**Default values:**

| Option | Description | Selected |
|--------|-------------|----------|
| вода + чаена лъжица (first in each list) | Predictable defaults | |
| брашно + супена лъжица (most common cooking unit) | Most useful first impression | ✓ |
| You decide | Claude picks | |

**Quantity field on load:**

| Option | Description | Selected |
|--------|-------------|----------|
| Empty field, result shows "— г" (recommended) | Invites user to type | ✓ |
| Pre-filled "1", result shows "10 гр" | Live result immediately | |

---

## Claude's Discretion

- Component architecture: single flat main.js
- Scrollable section height: 200–240px (Claude's call based on target device)
- Button active/press state: CSS `:active` only
- Quantity label: `<label>` with "Количество:" (Bulgarian, TECH-08)

## Deferred Ideas

None.
