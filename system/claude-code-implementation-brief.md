# Implementation Brief — Programmatic SEO Conversion System

**How to use this:** fill in the CONFIG block below, attach the four files
(`build.mjs`, `calc.js`, `ingredient-page-template.html`, `ingredient-hub-template.html`),
then give this whole document to Claude Code. Everything after CONFIG is addressed to
Claude Code as the implementer.

---

## CONFIG — set these first (the only decisions you must make)

```
DOMAIN        = https://ochen-lekar.com        # dev domain for now; swap to the dedicated domain later
LANGS         = ["bg"]                          # add more languages later — no code changes needed
URL_BASE      = /merki                          # base path for the new pages (see "URL structure decision")
EXISTING_PAGE = /merni-edinici/                 # the current converter page
EXISTING_PAGE_PLAN = keep_as_pillar             # one of: keep_as_pillar | redirect_to_pillar | leave_untouched
ENVIRONMENT   = experiment                       # experiment = noindex everything until verified, then flip
```

**URL structure decision:** the generator currently produces `/{lang}/merki/{id}/{from}-v-{to}/`.
Keep that, or align it to your existing `/merni-edinici/` scheme — just be consistent and set
`URL_BASE` accordingly. Whatever you choose, the existing converter page and the new pages should
form one coherent tree.

---

## Context (for Claude Code)

You are integrating a programmatic SEO system into an existing **static** website (a Bulgarian
kitchen-unit converter). The system generates one **hub page** per ingredient and several
**question pages** per ingredient (e.g. "Колко грама е една чаша брашно?"), all sharing one
calculator engine, one stylesheet, and one ingredient dataset.

**The four provided files and their roles:**
- `build.mjs` — the generator **and the single source of truth** for ingredient data, units, and copy. This is what actually renders pages.
- `calc.js` — the shared client-side calculator engine (already production-ready and standalone).
- `ingredient-page-template.html` / `ingredient-hub-template.html` — **design references only.** They are rendered examples with inline CSS/JS so a human can preview them. Do **not** ship them as-is. Use them as the source for the shared stylesheet and to match the visual design; `build.mjs`'s render functions are the real templates.

---

## Target structure

```
project/
├─ package.json            # { "type": "module" }, script: "build": "node build.mjs"
├─ build.mjs               # generator (edit CONFIG + add the two emit steps below)
├─ assets/
│  ├─ site.css             # shared stylesheet (extracted from the templates)
│  ├─ calc.js              # shared engine (provided file, unchanged)
│  └─ data.bg.js           # NEW: emitted by build.mjs — window.__KITCHEN_DATA__ for bg
└─ dist/                   # build output (deploy this)
   ├─ bg/merki/index.html              # pillar (NEW — add generator, see step 5)
   ├─ bg/merki/{id}/index.html         # hubs
   ├─ bg/merki/{id}/{from}-v-{to}/index.html   # question pages
   ├─ assets/...           # copied from /assets
   ├─ sitemap.xml
   └─ robots.txt           # NEW (step 7)
```

---

## Implementation steps

### 1. Project setup
Create `package.json` with `"type": "module"` and a `build` script (`node build.mjs`). No
dependencies are required — `build.mjs` uses only Node's standard library.

### 2. Extract the shared stylesheet
Both templates use the **same** design system. Copy the entire `<style>` block from
`ingredient-hub-template.html` (it's the superset — it includes the `.qa-grid`/`.qa-card`
classes the hubs need) into `assets/site.css`. The `build.mjs` render functions already link
`/assets/site.css`, so no per-page CSS should remain. Do **not** inline CSS on individual pages.

### 3. Place the engine
Put the provided `calc.js` at `assets/calc.js`, unchanged. The render functions already load it
with `defer` and inject `window.__PREFILL__` per page. Confirm no inline calculator `<script>`
survives in generated output.

### 4. Close the data-drift gap (single source of truth)
`build.mjs` holds the authoritative `INGREDIENTS`, `UNITS`, `ORDER`. `calc.js` consumes
`window.__KITCHEN_DATA__` (with a baked-in fallback). To guarantee they never diverge, add an
emit step to `build.mjs` that writes one client data file **per language** and have each page
load it before `calc.js`.

The shape `calc.js` expects (labels in the page's language, flattened):
```js
window.__KITCHEN_DATA__ = {
  ingredients: { brashno: { name: "Брашно", density: 0.50 }, /* ... */ },
  units: {
    chasha: { ml: 250, label: "чаша" },     // volume units carry ml
    g:      { g: 1,    label: "г" },          // mass units carry g
    /* ... */
  },
  order: ["chasha","sl","chl","ml","cup_us","floz","g","kg","oz","lb"]
};
```
Implement approximately:
```js
function renderClientData(lang) {
  const ingredients = {};
  for (const ing of INGREDIENTS) ingredients[ing.id] = { name: ing.names[lang], density: ing.density };
  const units = {};
  for (const [k, u] of Object.entries(UNITS))
    units[k] = (u.g != null) ? { g: u.g, label: u.label[lang] } : { ml: u.ml, label: u.label[lang] };
  const order = ["chasha","sl","chl","ml","cup_us","floz","g","kg","oz","lb"]; // = calc.js ORDER
  return `window.__KITCHEN_DATA__=${JSON.stringify({ ingredients, units, order })};`;
}
// in build(): write assets/data.${lang}.js for each lang
```
Then in the `head(...)` render, load it **before** calc.js:
```html
<script src="/assets/data.${lang}.js"></script>
<script src="/assets/calc.js" defer></script>
```
(Add `cup_us`, `floz`, `kg`, `oz`, `lb` labels to the `UNITS` map in `build.mjs` so the emitted
data includes them — they're already in `calc.js`'s fallback and in `ORDER`.)

### 5. Close the pillar gap
Breadcrumbs link to `/{lang}/merki/`, but the generator doesn't create it. Add a **pillar page**
generator that writes `dist/{lang}/merki/index.html` listing every ingredient hub (reuse the
`.related` or `.qa-grid` styling, link each ingredient's hub, and link the recipe-scaler CTA).
Add it to the sitemap. Ensure the home breadcrumb (`/{lang}/`) points at your existing site root.

### 6. Apply CONFIG
In `build.mjs`, set `SITE.domain` = DOMAIN, `LANGS`, and the base path to match `URL_BASE`.
If `ENVIRONMENT = experiment`, add `<meta name="robots" content="noindex">` to the `head(...)`
output so nothing gets indexed until you've verified it; remove it when going live.

### 7. Generate + add robots/sitemap
Run `node build.mjs`. Confirm the page count. Write `dist/robots.txt` referencing the sitemap:
```
User-agent: *
Allow: /
Sitemap: {DOMAIN}/sitemap.xml
```

### 8. Preview locally
Serve the output and click through: `npx serve dist` (or `python3 -m http.server -d dist`).
Verify a hub, a question page, and the pillar render correctly and the calculator works.

### 9. Integrate with the existing static site
- Merge `dist/` into your deployment so the new tree lives under `URL_BASE` **alongside** the
  existing converter — do not overwrite unrelated pages.
- Merge the generated `sitemap.xml` with any existing sitemap (or list both in `robots.txt`).
- Confirm the host serves directory indexes (`/path/` → `/path/index.html`) and preserves
  trailing slashes (canonicals use them).
- Handle `EXISTING_PAGE` per `EXISTING_PAGE_PLAN`: if `keep_as_pillar`, point the pillar concept
  at it and set its canonical; if `redirect_to_pillar`, add a redirect; if `leave_untouched`,
  just cross-link it from the new pillar.

---

## Experiment plan (do this incrementally)

1. Build with the current 12 ingredients × 3 pairs (48 pages) + hubs + pillar, `noindex` on.
2. Deploy to the dev domain, click through, run the verification checklist.
3. Remove `noindex`, submit `sitemap.xml` in Google Search Console, and watch indexing/impressions.
4. Only then expand: add ingredients to the `INGREDIENTS` array (and a few more `UNIT_PAIRS` if
   useful), rebuild. Later, add a language code to `LANGS` with its name/string set.

Keep half-finished pages out of the index — verify, then flip `noindex` off.

---

## Verification checklist

- [ ] `node build.mjs` runs clean; page count = `LANGS × ingredients × (1 hub + pairs)` **+ pillar per lang**.
- [ ] Every page has: unique `<title>`, `<meta description>`, `<link rel=canonical>`, exactly one `<h1>`, and the **answer in the first sentence**.
- [ ] JSON-LD validates: question pages = `BreadcrumbList` + `FAQPage`; hubs = `BreadcrumbList` + `ItemList`. Use Google's Rich Results Test / a JSON-LD validator.
- [ ] No broken internal links — especially the breadcrumb `/{lang}/merki/` now resolves (pillar exists).
- [ ] Calculator: loads from `window.__KITCHEN_DATA__`, respects prefill priority (URL > `__PREFILL__` > data-* > defaults), conversions correct, swap/copy/chips work, accepts comma decimals.
- [ ] `assets/site.css` and `assets/data.${lang}.js` load; fonts render Cyrillic; ad slots reserve height (no layout shift).
- [ ] `sitemap.xml` well-formed and referenced in `robots.txt`; canonicals use trailing slashes consistently.
- [ ] Lighthouse: good mobile performance, no console errors.

---

## Guardrails (do NOT do these)

- **Do not add `HowTo` schema, and do not expect FAQ rich results.** Google deprecated FAQ rich
  results on 2026-05-07 (HowTo earlier). Keep `FAQPage` markup — it still aids page understanding
  and is read by AI-search crawlers — but it produces no SERP dropdown. Don't "fix" this by
  removing it or swapping in HowTo.
- **Do not inline CSS per page.** One shared `/assets/site.css`.
- **Do not let `calc.js` redefine ingredient data.** `build.mjs` is the single source of truth;
  `calc.js` consumes the emitted `window.__KITCHEN_DATA__`.
- **Densities are placeholders.** Before removing `noindex`, verify every `density` value against
  authoritative sources — accuracy is the entire value proposition.
- **Do not deindex or break the existing converter** without a canonical/redirect decision.
```
