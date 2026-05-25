# Recipe Converter — Master Build & Growth Plan

A reference spec for evolving a single-ingredient kitchen converter into a multilingual recipe utility hub monetized through display ads and affiliate revenue. Written so individual sections can be handed directly to Claude Code as build briefs.

---

## 0\. North Star

**Product:** The recipe utility hub for home cooks — starting in Bulgaria, then expanding to adjacent underserved languages.

**Wedge → killer feature:** A single-ingredient converter brings people in from search. The whole-**recipe scaler** is what makes them stay and share, and it directly solves the pain that current Bulgarian sites don't: stop scrolling a reference table and doing mental math.

**Business model:** Passive revenue from display ads \+ affiliate (kitchen scales, measuring tools, cookbooks).

**Scaling thesis:** One language-independent data engine (ingredient densities, unit math) \+ many localized front-ends \= compounding ad inventory at near-zero marginal cost per new market.

**Sequence:** Own Bulgarian first (you can realistically dominate it) → add imperial-unit support as a feature for European users → clone into adjacent languages.

---

## 1\. Internationalization Decision & Architecture

### What to do

- **Include imperial units fully** (oz, lb, fl oz, cups, sticks of butter, °F, gas mark). Reason: your European users convert *from* these when cooking translated recipes. This is a feature, not a market pivot.  
- **Do not target English-language search head-on.** Competition (King Arthur, AllRecipes, traditionaloven) and Google's own inline answers make it a poor use of effort.  
- **Expand into underserved languages later** using the same engine: Serbian, Croatian, Macedonian, Romanian, Greek. Similar measurement culture, weak local competition, fresh ad markets.

### Architecture implication (build this in from day one)

Separate three layers so adding a language is a content task, not a rebuild:

1. **Data layer (language-independent):** ingredient density table, unit definitions, conversion math. Shared across all markets.  
2. **Content/i18n layer (per language):** UI strings, ingredient display names, SEO page copy, query phrasings.  
3. **Presentation layer:** the UI components, identical everywhere.

**Claude Code brief:** Store ingredient data as structured records keyed by a stable `ingredient_id`, with localized `names[]` per language and a single `density_g_per_ml` value. Units defined once in a shared module. Never hardcode Bulgarian strings into components — pull from an i18n dictionary.

### A Bulgaria-specific nuance worth owning

The Bulgarian "чаша" is ambiguous — a traditional water glass (\~250 ml) vs. the US recipe cup (240 ml) vs. a "кафена чашка." Most local sites ignore this. Let the user pick which cup, and write content explaining it. This precision is part of your moat.

---

## 2\. UX Spec — The Converter

### Design principles

1. **Mobile-first, one-handed.** People use this while cooking, on a phone, often with messy hands. Big tap targets, no tiny controls.  
2. **Live, no submit button.** Result updates as the user types or selects.  
3. **Fast.** Performance is both a UX and an SEO ranking factor. Target Largest Contentful Paint \< 1.5s.  
4. **Trustworthy.** Briefly show *why* a number is what it is (density-based), so it doesn't feel like a black box.

### Core layout (top to bottom on mobile)

- **Ingredient field** with search \+ autocomplete, seeded with the most-googled ingredients.  
- **Quick-tap unit chips:** `1 ч.л.` `1 с.л.` `1 чаша` `1 щипка` — one tap fills common amounts.  
- **Amount input** (numeric, with stepper).  
- **From-unit / To-unit selectors** (default sensible pairs, e.g. чаша → грама).  
- **Result card** — large, prominent, with a **Copy** button.  
- **"Why this number" line** — e.g. "Брашното тежи \~125 г на чаша (250 мл)."  
- **Recently used** conversions, and optional **favorites**.

### States

- **Empty:** show a popular default (e.g. 1 чаша брашно → грама) so the page is never blank — also good for SEO and screenshots.  
- **Typing:** live recompute, debounced.  
- **No match:** offer closest ingredients \+ "request an ingredient" capture (feeds your content backlog and email list).  
- **Cross-unit count items:** "1 яйце ≈ 50 г", "1 чаша брашно ≈ 125 г".

### Visual direction

- Clean, warm, kitchen-friendly. Generous whitespace, one accent color, a readable sans-serif.  
- **Dark mode** (kitchens at night).  
- A subtle **visual reference illustration** of "what 1 чаша of X looks like" — differentiating and inherently shareable on Pinterest.

### Accessibility & performance

- Full keyboard nav, ARIA labels, ≥ 4.5:1 contrast, inputs usable at 200% zoom.  
- No layout shift (reserve space for the result card and ads).  
- Inline-critical CSS, lazy-load anything below the fold.

**Claude Code brief:** Build the converter as a self-contained component that reads from the shared data layer. No `<form>` submit; recompute on input change. Expose a URL-param API (`?ing=brashno&from=cup&to=g&amt=2`) so programmatic SEO pages can deep-link a pre-filled state.

---

## 3\. Recipe Scaler — Full Feature Spec

This is the feature that sets you apart. Treat it as the flagship.

### User stories

- "I found a recipe in cups and °F — convert the whole thing to grams and °C."  
- "This recipe serves 4; I'm cooking for 9 — rescale every ingredient."  
- "Give me a clean shopping list in metric units."

### Input modes

1. **Build mode:** add ingredients line by line (ingredient \+ amount \+ unit), pick servings.  
2. **Paste mode:** paste a full ingredient list as text; the tool parses lines into structured ingredient/amount/unit.

### Parsing approach (paste mode)

- Split on line breaks; per line, detect `{quantity}{unit}{ingredient}` in any order.  
- Match the ingredient against the localized name index (fuzzy match for typos/plurals).  
- Recognize fractions and ranges ("1 1/2", "2-3"), and informal units (щипка, на върха на ножа).  
- Show a **review step**: parsed rows with editable fields and a confidence flag on uncertain matches. Never silently guess — let the user confirm.

### Scaling & rounding logic

- Scale factor \= `target_servings / source_servings`.  
- Convert each line to grams/ml via the density table, then multiply.  
- **Smart rounding** (this is what makes it feel professional):  
  - Round to cooking-sensible increments (e.g. nearest 5 g above 50 g, nearest 1 g below).  
  - Keep eggs and other count items as whole numbers, flag fractional eggs ("≈ 2.5 яйца → use 2 large \+ 1 yolk" as a future nicety).  
  - Preserve a "show original units" toggle so people can sanity-check.

### Output

- **Converted recipe:** every ingredient in chosen target units, plus rescaled servings.  
- **Shopping list:** consolidated, copy/print-friendly.  
- **Temperature line:** if the recipe had °F or gas mark, show °C.  
- **Share/print** buttons (print view \= Pinterest-friendly and a backlink magnet).

### Edge cases

- Unknown ingredient → keep the line, convert what's possible, flag the rest, offer "request this ingredient."  
- Mixed unit systems in one recipe → handle gracefully.  
- Volume-only items with no good density (e.g. "to taste") → pass through unchanged.

### Build phasing

- **P1:** Build mode \+ scaling \+ metric/imperial conversion \+ copy/print.  
- **P2:** Paste mode with review step.  
- **P3:** Save recipes (recipe box) → drives return visits \+ email signups \+ more ad impressions.

**Monetization fit:** The review/result screens are high-dwell-time pages — ideal native spots for affiliate units ("Нямате кухненска везна? Ето добра.") and a contextual display slot.

---

## 4\. Programmatic SEO System

This is your biggest growth lever. The queries are predictable and currently served by clunky pages.

### The idea

Generate one focused landing page per **ingredient × question**, each matching a real search query exactly. Hundreds of pages, each pre-filling the calculator and answering in the first sentence.

### URL structure

/{lang}/merki/{ingredient}/{from-unit}-v-{to-unit}/

e.g. /bg/merki/brashno/chasha-v-gramove/

Plus per-ingredient hub pages: `/bg/merki/brashno/`

### Anatomy of an ingredient page (the template)

1. **H1 \= the exact question:** "Колко грама е една чаша брашно?"  
2. **Direct answer in sentence 1:** "Една чаша (250 мл) брашно тежи около 125 грама." (Google rewards the immediate answer.)  
3. **Pre-filled live calculator** (deep-linked via URL params).  
4. **Small reference table:** common amounts (½, 1, 2 чаши; 1 с.л.; 1 ч.л.) → grams.  
5. **2–3 sentence explainer:** why density matters, sifted vs. packed, the чаша ambiguity.  
6. **Internal links:** to the ingredient hub, the recipe scaler, and 3–5 related ingredient pages.  
7. **Schema markup:** `Recipe`/`HowTo` \+ `FAQPage` for rich results.

### On-page SEO checklist (per page)

- Title tag \= question \+ brand.  
- Meta description \= the answer.  
- One H1, logical H2s for the table and explainer.  
- Fast load, no CLS, mobile-perfect.  
- FAQ schema for the "people also ask" variants.

### Data model that powers it

Each page is generated from a record like:

ingredient\_id: "brashno"

names: { bg: "брашно", sr: "брашно", ... }

density\_g\_per\_ml: 0.53

cup\_ml: 250

notes: { bg: "Меренето зависи от пресяване и натъпкване." }

Generate the page set programmatically from `ingredients × unit_pairs × languages`.

### Starter ingredient list (Bulgarian, with approximate weights per чаша ≈ 250 ml — verify/refine during build)

| Ingredient (BG) | \~g per чаша (250 ml) | Notes |
| :---- | :---- | :---- |
| Брашно (бяло) | \~125 g | varies with sifting |
| Захар (бяла) | \~210 g |  |
| Кафява захар | \~230 g | packed |
| Пудра захар | \~125 g |  |
| Ориз (суров) | \~195 g |  |
| Грис | \~165 g |  |
| Овесени ядки | \~95 g |  |
| Какао | \~90 g |  |
| Нишесте | \~130 g |  |
| Мляко | \~250 g | ≈ volume |
| Олио | \~225 g |  |
| Масло (разтопено) | \~235 g |  |
| Мед | \~355 g |  |
| Заквасена сметана | \~240 g |  |
| Кисело мляко | \~250 g |  |
| Сол | \~300 g | (1 ч.л. ≈ 6 g) |
| Вода | \~250 g | reference |

Count-based reference items to add: 1 яйце ≈ 50 g, 1 жълтък ≈ 18 g, 1 белтък ≈ 33 g, 1 пакетче ванилия / бакпулвер (state grams).

### Units to support (BG \+ imperial)

- **Local/volume:** чаена лъжичка (ч.л. ≈ 5 ml), супена лъжица (с.л. ≈ 15 ml), чаша, кафена чашка, щипка, на върха на ножа.  
- **Imperial:** cup (US, 240 ml), tablespoon, teaspoon, fl oz, oz, lb, stick of butter.  
- **Temperature:** °F ↔ °C, gas mark.

### Query patterns to template (multiply across ingredients)

- "колко грама е една чаша {X}"  
- "{X} една супена лъжица колко грама"  
- "колко е една чаена лъжичка {X} в грамове"  
- "{X} от чаши в грамове"  
- "колко мл е една чаша"

### Internal linking — hub & spoke

- **One pillar page:** "Мерни единици в кухнята" linking to every ingredient hub. Your authority page.  
- **Ingredient hubs** link to their question pages and to the scaler.  
- **Question pages** cross-link to 3–5 related ingredients.

### Editorial content (for reach, dwell time, and backlinks)

First pieces to write:

- "Как да мерим без везна" (no-scale measuring guide).  
- "Как да преведем американска рецепта" (cups/°F → metric) — links the scaler.  
- "Печатна таблица за мерни единици" — a **printable conversion chart** (PDF). This is link-bait and Pinterest fuel; gate the high-res version behind an email signup.  
- Seasonal recipe posts that naturally use the scaler.

---

## 5\. Monetization Architecture

### Display ads

- **Start with Google AdSense** (no traffic minimum) once you have content \+ steady traffic.  
- **Graduate to a managed network** as traffic grows — **Ezoic** has a low/no minimum and suits EU traffic; **Mediavine/Raptive** need \~50k+ sessions/month and skew to US traffic (relevant later, especially if you add English-adjacent markets).  
- **GDPR/consent is mandatory** — you're serving EU users. Implement a proper consent management platform (CMP) before running ads; it also affects ad revenue and legality.  
- **Placement without wrecking UX:** reserve ad slots in the layout to avoid layout shift; never put an ad between the user and the result. Best slots: below the result card, within editorial content, on the scaler review/result screens (high dwell time).

### Affiliate

- **Products:** kitchen scales, measuring cups/spoons, oven thermometers, cookbooks, baking sets.  
- **Natural placements:** "Нямате везна?" prompt on conversion pages; equipment callouts in editorial guides; tool recommendations on the scaler output.  
- Use programs available in your target markets (Amazon affiliate where applicable, plus local retailers' affiliate programs for BG).

### Revenue logic

Pageviews (programmatic SEO) × RPM (improved by editorial/recipe dwell time) \+ affiliate conversions (driven by intent on tool pages). More languages \= more total pageviews on the same engine.

---

## 6\. Build Roadmap (phased, tied to leverage)

**Phase 1 — Foundations (BG only)**

- Move to the dedicated domain; set up the data/i18n/presentation layers.  
- Ship the redesigned converter (Section 2\) with URL-param deep-linking.  
- Stand up the programmatic SEO template \+ first \~30 ingredient pages \+ pillar page.  
- Install GSC, GA4, and a CMP.

**Phase 2 — The differentiator**

- Ship Recipe Scaler P1 (build mode \+ scaling \+ imperial/temperature).  
- Publish the printable chart \+ first 3 editorial guides.  
- Turn on AdSense; add first affiliate placements.

**Phase 3 — Depth & flywheel**

- Scaler P2 (paste \+ parse), then P3 (recipe box \+ email list).  
- Expand to \~150+ ingredient pages; build out editorial calendar.  
- Evaluate Ezoic once traffic justifies.

**Phase 4 — Multiply markets**

- Localize into the first adjacent language (e.g. Serbian or Romanian) using the shared engine.  
- Repeat the SEO playbook per language.

---

## 7\. Distribution & Audience Growth

- **Pinterest:** disproportionately powerful for cooking \+ printables. Pin the conversion chart, the visual ingredient references, and recipe-scaler outputs. Likely your \#1 non-search channel.  
- **Bulgarian Facebook cooking groups:** where your exact users already gather — share genuinely useful tools/charts, don't spam.  
- **Short video (Reels/TikTok):** "преведи цяла рецепта за 2 секунди" demos of the scaler.  
- **Email list:** capture via the printable-chart lead magnet; re-engage with seasonal recipe content.  
- **Backlinks:** pitch the free printable \+ tools to BG recipe blogs and food sites for inclusion.

---

## 8\. Measurement

- **Google Search Console:** track impressions/clicks/position per ingredient page; find new query patterns to template.  
- **GA4:** sessions, top landing pages, scaler usage, affiliate click-throughs.  
- **Ad dashboard:** RPM by page type (expect editorial/scaler \> bare converter).  
- **Leading indicators:** indexed pages, ranking keywords, email signups, returning visitors.  
- **Review cadence:** monthly — double down on top query patterns, prune/merge thin pages.

---

### Quick-start checklist

- [ ] Choose & set up dedicated domain  
- [ ] Build data / i18n / presentation layer separation  
- [ ] Ship redesigned converter with URL-param deep-linking  
- [ ] Build programmatic SEO template \+ first 30 ingredient pages \+ pillar page  
- [ ] Install GSC, GA4, consent management platform  
- [ ] Ship Recipe Scaler P1  
- [ ] Publish printable chart (email gate) \+ 3 editorial guides  
- [ ] Enable AdSense \+ first affiliate links  
- [ ] Set up Pinterest; share to FB cooking groups

