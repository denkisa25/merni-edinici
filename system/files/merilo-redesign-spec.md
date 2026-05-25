# merilo.pro — Redesign Implementation Spec

**For: Claude Code, working in the merilo.pro repo (static-site generator: `build.mjs` + `assets/site.css` + `assets/calc.js` + `assets/data.bg.js`).**

This spec covers a brand + UX refresh with three parts:
1. **New logo** (a "measure-mark" icon + `Мерило.` wordmark), replacing the current dot + "Мерки" brand.
2. **A new 2-page navigation model** — the home page (`/bg/merki/`) becomes expanding category accordions + search, eliminating the standalone category-listing page from the *user's* path. Category pages stay published for SEO.
3. **Typographic + visual refinements** to the ingredient detail/converter pages.

> **Ground rules for this work**
> - Do **not** change `calc.js` logic or the conversion math. It is production-ready. You only touch markup/CSS it hooks into, and you must preserve the element IDs it depends on (see §6).
> - `build.mjs` is the single source of truth for ingredient/unit data and copy. All per-page values must keep coming from there — **never hardcode ingredient names or gram values** into templates.
> - Keep all existing structured data (BreadcrumbList, ItemList, FAQPage, WebPage JSON-LD), hreflang, OG tags, and the `noindex` experiment flag exactly as they are unless a step explicitly says otherwise.
> - Work on a branch. Run `npm run build` and diff `dist/` before/after to confirm no unintended page changes.
> - Reference mockups (visual target) are the three files delivered alongside this spec: `merilo-page1-home.html`, `merilo-page2-real.html`, and the logo/icons. Match their look; they already use the real design tokens.

---

## 1. Design tokens (already in `site.css` — do not redefine)

These exist in `:root` today and are correct. Use them; introduce **no** new hex values except the two small additions in §5.

```
--paper:#FBF6EC  --paper-2:#F4ECDC  --ink:#2A2420  --ink-soft:#6B5F54  --line:#E4D8C4
--paprika:#C2522C  --paprika-dk:#9E3F1F  --honey:#E0A12E  --card:#FFFDF8
--radius:16px  --maxw:720px
fonts: "Spectral" (display/headings, weights 600/800), "Onest" (body/UI)
```

---

## 2. The logo

Replace the current brand markup. **Current** (in `build.mjs`'s header render):

```html
<a class="brand" href="https://merilo.pro/bg/"><span class="dot"></span>Мерки</a>
```

**New** — measure-mark icon (a rounded square with three graduation ticks, middle tick in honey) + `Мерило.` wordmark:

```html
<a class="brand" href="https://merilo.pro/bg/" aria-label="Мерило — начало">
  <span class="brand__mark" aria-hidden="true">
    <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
      <rect x="1.2" y="1.2" width="27.6" height="27.6" rx="8" stroke="#C2522C" stroke-width="2.4"/>
      <line x1="8"  y1="9" x2="8"  y2="21" stroke="#C2522C" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="15" y1="6" x2="15" y2="24" stroke="#E0A12E" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="22" y1="9" x2="22" y2="21" stroke="#C2522C" stroke-width="2.4" stroke-linecap="round"/>
    </svg>
  </span>
  <span class="brand__name">Мерило<b>.</b></span>
</a>
```

CSS — **replace** the existing `.brand` / `.brand .dot` rules with:

```css
.brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none}
.brand__mark{width:28px;height:28px;flex:0 0 auto;line-height:0}
.brand__name{font-family:"Spectral",serif;font-weight:800;font-size:21px;letter-spacing:-.01em;color:var(--ink)}
.brand__name b{color:var(--paprika);font-weight:800}
```

### 2a. Favicon + OG assets (create these static files)

Save the **icon alone** (no wordmark) as a standalone SVG, then export PNGs. Put them in `/assets/brand/`:

`/assets/brand/mark.svg` (the icon-only artwork — 30×30 viewBox, used to generate the rest):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 30 30" fill="none">
  <rect x="0" y="0" width="30" height="30" rx="8" fill="#FBF6EC"/>
  <rect x="1.2" y="1.2" width="27.6" height="27.6" rx="8" stroke="#C2522C" stroke-width="2.4"/>
  <line x1="8"  y1="9" x2="8"  y2="21" stroke="#C2522C" stroke-width="2.4" stroke-linecap="round"/>
  <line x1="15" y1="6" x2="15" y2="24" stroke="#E0A12E" stroke-width="2.4" stroke-linecap="round"/>
  <line x1="22" y1="9" x2="22" y2="21" stroke="#C2522C" stroke-width="2.4" stroke-linecap="round"/>
</svg>
```

Generate: `favicon.svg` (the mark.svg), `favicon-32.png`, `favicon-180.png` (apple-touch), `icon-192.png`, `icon-512.png`. Add to `<head>` in `build.mjs`:

```html
<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/brand/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/brand/favicon-180.png">
```

> If no rasterizer is available in the environment, generate the PNGs with `sharp` (`npm i -D sharp`) in a one-off script, or leave a TODO and ship the SVG favicon alone — it works in all modern browsers.

---

## 3. The 2-page model — what changes, what stays

| Page | URL | Before | After |
|---|---|---|---|
| **Home / hub** | `/bg/merki/` | Category cards **+** full flat list of every ingredient | Search box + **7 expanding category accordions**. No flat dump. |
| **Category** | `/bg/merki/kategoria/{slug}/` | Standalone list page | **Keep publishing** (SEO + breadcrumbs + deep links). Just no longer the primary user path. |
| **Ingredient** | `/bg/merki/{slug}/` | Converter page | Same, with refinements (§5). |

**Key reconciliation:** the accordion is a faster front door; category pages remain crawlable. Each open accordion shows a `цялата категория →` link to its `/kategoria/{slug}/` page. Breadcrumbs on ingredient pages keep pointing to the real category URL — **do not change breadcrumb targets or the BreadcrumbList JSON-LD.**

---

## 4. Home page (`/bg/merki/`) — rebuild the body

The reference implementation is `merilo-page1-home.html`. Port its structure into the `build.mjs` function that renders the hub/pillar page. Critical implementation notes:

- **Data-driven, not hardcoded.** Build the category list and ingredient chips by iterating `build.mjs`'s authoritative `INGREDIENTS` (and a category map — see §4a). The reference file inlines a `ING`/`CATS` object only because it's a standalone preview; in the real build these come from your data source.
- **Per-chip value:** for each ingredient, display per-чаша (250 ml). Dry → `≈ {round(density*250)} г/чаша`; liquid → `≈ {round(250)} мл/чаша` (i.e. volume in = volume out, show the ml). This matches the live home page exactly (flour → 125 г, sugar → 213 г, verified).
- **Ingredient chip name uses Spectral and must not break mid-word:** `overflow-wrap:normal; word-break:keep-all; hyphens:none`. (This is the fix for the current "Брашн/о" wrapping bug.)
- **Accordion behavior:** single-open (opening one closes others); animate `max-height` via `scrollHeight`; stagger ingredient reveal with `animation-delay:{i*40}ms`. Set `aria-expanded` on the header button.
- **Search:** client-side filter over all ingredients (name `includes`), max ~7 results, each linking to `/bg/merki/{slug}/`. Search is the replacement for the old flat list — keep it.
- **Open the first category by default** so the interaction is discoverable.

### 4a. Category map (add to `build.mjs` data)

The 7 categories with their member ingredient slugs (derived from the live data + image of the current category cards). Add this as a `CATEGORIES` array in `build.mjs` if one doesn't already exist; if category pages already exist, reuse their source-of-truth grouping instead of duplicating.

```js
const CATEGORIES = [
  { slug: "brasna",  icon: "brasna",  name: "Брашна и нишестета",     items: ["brashno","nisheste","palnozarnesto-brashno","carevichno-brashno"] },
  { slug: "techno",  icon: "techno",  name: "Течности",               items: ["voda","mlyako","olio","ocet","klenov-sirop"] },
  { slug: "sweet",   icon: "sweet",   name: "Подсладители",           items: ["zahar","pudra-zahar","kafyava-zahar","kakao","med"] },
  { slug: "nuts",    icon: "nuts",    name: "Ядки и сухи плодове",     items: ["orehi","stafidi","kokos","oves"] },
  { slug: "dairy",   icon: "dairy",   name: "Млечни продукти",         items: ["kiselo-mlyako","zakvasena-smetana"] },
  { slug: "spice",   icon: "spice",   name: "Подправки и набухватели", items: ["sol","soda","bakpulver","maslo"] },
  { slug: "grains",  icon: "grains",  name: "Зърнени и бобови",        items: ["oriz","bulgur","gris","lesha"] },
];
```

> **Verify against existing category pages.** If `/kategoria/{slug}/` pages already define membership, that grouping wins — make this array match them so the accordion and the category pages never disagree. The counts above (4/5/5/4/2/4/4 = 28) match the live data's 28 ingredients; confirm `maslo` and `med`'s category placement against the live category pages, since dairy/fats vs sweeteners can be assigned differently.

---

## 5. Ingredient/converter page refinements

Reference: `merilo-page2-real.html`. Every existing section stays (calc, quick-answers, ad, table, US-equiv, print/pin, affiliate, explainer, FAQ, recipe CTA, related, feedback, footer). Apply only these deltas:

### 5a. Quick-answer cards — fix the typography (the main bug)
**Current** `.qa-card` is `display:flex` with name and value side-by-side, which squeezes the name column and breaks words. **Change to stacked block layout:**

```css
.qa-card{display:block;text-decoration:none;background:var(--card);border:1px solid var(--line);
  border-radius:13px;padding:16px 18px;transition:.15s}
.qa-card:hover{border-color:var(--paprika);transform:translateY(-2px);box-shadow:var(--shadow)}
.qa-card b{display:block;font-family:"Spectral",serif;font-weight:600;font-size:16.5px;line-height:1.3;
  color:var(--ink);overflow-wrap:normal;word-break:keep-all;hyphens:none}
.qa-card .v{display:block;margin-top:8px;font-family:"Onest",sans-serif;font-weight:700;font-size:22px;
  color:var(--paprika);font-variant-numeric:tabular-nums;letter-spacing:-.01em}
```
The markup (`<a class="qa-card"><b>…</b><span class="v">…</span></a>`) stays — only CSS changes. **Remove** the old `word-break:break-word` from `.qa-card b`.

### 5b. Content bug — hero placeholder text
The live hero answer ends with leftover placeholder: `…виж таблицата по-долу. aaaa?`. Find the source string in `build.mjs` (the `answer`/`h1_question` copy for brashno, possibly others) and remove the stray `aaaa?`. Audit all ingredients for similar placeholder leftovers.

### 5c. Apply the new line-icons to section headers (optional polish)
The calculator head, the trust line, print/pin buttons, and the swap control gain small inline-SVG icons (see reference file for exact paths). These are stroke icons in `currentColor`. Low priority; the typography fix (5a) and logo (§2) are the high-value changes.

### 5d. Selects — keep the existing chevron
`site.css` already styles `.field select` with an inline-SVG chevron background. Keep it. (The reference file uses a `::after` pseudo-element instead; **prefer the existing background-image approach** already in `site.css` — don't introduce the pseudo-element, it can double up.)

---

## 6. ⚠️ Calculator contract — IDs you must NOT rename

`calc.js` runs on any page containing `.calc` and **populates the selects itself** from the data layer. It requires these exact IDs/structure. Preserve them verbatim:

- Container: `.calc` (with optional `data-ing` / `data-from` / `data-to` / `data-amt` attrs)
- `#amt` (input), `#ing` `#from` `#to` (selects — **leave them empty**, calc.js fills options), `#out`, `#why`, `#chips` (with `.chip[data-amt]` buttons), `#swap`, `#copy`
- Per-page initial state: `<script>window.__PREFILL__={...}</script>` after the calc markup
- Result number markup is `<div class="result__num" id="out">125 <span>г</span></div>` — the `<span>` is honey-colored via `.result__num span`. Keep the span.

In the reference `merilo-page2-real.html` the selects contain hardcoded `<option>`s **only so the static preview shows something** — in the real templates they must stay empty for calc.js to populate. Do not copy those options into `build.mjs`.

---

## 7. Icon set — 7 category line-icons

Stroke-based, `viewBox="0 0 24 24"`, `stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"`. Store as a map in `build.mjs` keyed by the `icon` field in §4a's `CATEGORIES`. Paths:

```js
const CATEGORY_ICONS = {
  brasna: '<path d="M7 8h10l1.2 11a2 2 0 0 1-2 2.2H7.8a2 2 0 0 1-2-2.2L7 8z"/><path d="M7 8c0-2 1.2-3 2.5-3.5C8.8 3.8 9.2 3 10 3M17 8c0-2-1.2-3-2.5-3.5"/><path d="M9.5 13.5h5"/>',
  techno: '<path d="M12 3.5c3.4 4 5.5 6.7 5.5 9.6a5.5 5.5 0 0 1-11 0C6.5 10.2 8.6 7.5 12 3.5z"/>',
  sweet:  '<rect x="6" y="8" width="12" height="13" rx="2"/><path d="M7.5 8V6.5h9V8"/><path d="M9 5h6"/><path d="M12 12v5"/>',
  nuts:   '<path d="M6 10a6 6 0 0 1 12 0c0 4-3 8-6 8s-6-4-6-8z"/><path d="M6.5 10h11"/><path d="M12 4.5V3"/>',
  dairy:  '<path d="M8 8h8v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8z"/><path d="M8 8l1.5-3h5L16 8"/><path d="M10.5 5V3.5h3V5"/>',
  spice:  '<path d="M8 9h8l.6 10a2 2 0 0 1-2 2.1H9.4a2 2 0 0 1-2-2.1L8 9z"/><path d="M8 9V6.5a4 4 0 0 1 8 0V9"/><circle cx="10.5" cy="5" r=".5"/><circle cx="13.5" cy="5" r=".5"/><circle cx="12" cy="4" r=".5"/>',
  grains: '<path d="M12 21V9"/><path d="M12 9c0-2-1.5-3.5-3.5-4 0 2 1.5 3.5 3.5 4z"/><path d="M12 9c0-2 1.5-3.5 3.5-4 0 2-1.5 3.5-3.5 4z"/><path d="M12 14c0-2-1.5-3.5-3.5-4 0 2 1.5 3.5 3.5 4z"/><path d="M12 14c0-2 1.5-3.5 3.5-4 0 2-1.5 3.5-3.5 4z"/>',
};
```
Render each as `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{path}</svg>`. In the accordion, the icon sits in a `.cat-badge` that flips to a paprika fill with white icon when open (see reference CSS).

---

## 8. CSS additions for the home accordion + search

Append to `site.css` (these classes don't exist yet). Copy from `merilo-page1-home.html`'s `<style>` — the relevant blocks are `.search`, `.results`, `.cats`, `.cat`, `.cat-head`, `.cat-badge`, `.cat-meta`, `.cat-name`, `.cat-count`, `.cat-link`, `.cat-chev`, `.cat-body`, `.ing-grid`, `.ing`, and the `@keyframes rise`. They already use the real tokens. No new tokens needed except none — all covered.

---

## 9. Build steps for `build.mjs`

1. Add `CATEGORIES` (§4a) and `CATEGORY_ICONS` (§7) near the existing `INGREDIENTS`/`UNITS`/`ORDER` config (or import category membership from wherever the `/kategoria/` pages already get it).
2. Update the **header render** helper (used by every page) to emit the new `.brand` markup (§2) and the favicon `<link>`s (§2a).
3. Rewrite the **hub page render** (`/bg/merki/index.html`) to output: hero + search + accordion (§4). Emit the accordion HTML server-side from `CATEGORIES`; ship the small JS (toggle + search) either inlined in a `<script>` at the end of that page or, better, as `/assets/merki-home.js` loaded with `defer`.
4. Apply the `.qa-card` CSS change (§5a) and the hero copy fix (§5b) — both are edits to existing render output / data.
5. Keep category-page generation (`/kategoria/{slug}/`) untouched.
6. `npm run build`, then verify §10.

> **JS placement:** prefer a new `/assets/merki-home.js` (defer-loaded only on the hub page) over inlining, to match the project's existing pattern of shared external scripts (`calc.js`, `feedback.js`). Keep it framework-free.

---

## 10. Acceptance criteria (verify before merging)

**Logo**
- [ ] Every page header shows the measure-mark icon + `Мерило.`; no bare `.dot` remains.
- [ ] `favicon.svg` loads; browser tab shows the mark.

**Home page**
- [ ] Loads with 7 category accordions + a search box; **no** flat dump of all ingredients.
- [ ] Tapping a category expands it (others close), ingredients stagger in, badge turns paprika.
- [ ] Each open category shows a working `цялата категория →` link to `/kategoria/{slug}/`.
- [ ] Search filters all 28 ingredients and links to the correct `/bg/merki/{slug}/`.
- [ ] Ingredient names never break mid-word (check "Пълнозърнесто брашно", "Заквасена сметана", "Кокосови стърготини").
- [ ] Displayed per-чаша values match data (flour 125 г, sugar 213 г, brown sugar 225 г).

**Converter page**
- [ ] Quick-answer cards: name on its own line above the value, no mid-word breaks, number is the paprika accent.
- [ ] Hero no longer contains `aaaa?` (and no other ingredient has stray placeholder text).
- [ ] Calculator still works: chips, swap, copy, live result — i.e. `calc.js` IDs intact and selects auto-populate.
- [ ] All lower sections still present and styled (table, US-equiv, print/pin, affiliate, explainer + FAO trust line, FAQ accordions, recipe CTA, related, feedback, footer).

**Regression / SEO**
- [ ] `dist/` diff shows changes ONLY to: header markup (all pages), the hub page body, `.qa-card` CSS, `site.css` additions, hero copy. No structured-data, hreflang, canonical, or `noindex` changes.
- [ ] Category pages still generate and are reachable.
- [ ] BreadcrumbList / ItemList / FAQPage / WebPage JSON-LD unchanged.

---

## 11. Open items for the human (not Claude Code)
- Confirm `maslo` (масло) belongs in "Подправки и набухватели" vs a dedicated fats group, and `med` (мед) in "Подсладители" vs "Течности" — assigned per the current category cards but worth a sanity check against the live `/kategoria/` pages.
- Decide whether to keep the `📌`/`🖨` emoji on the print/Pinterest buttons or swap to the line-icons in the reference file (spec uses line-icons; trivial to revert).
- Provide affiliate URL for the "Виж везни" link (currently `#`).
