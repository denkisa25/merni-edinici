/**
 * build.mjs — programmatic SEO page generator
 * ---------------------------------------------------------------------------
 * Generates, per language:
 *   • one pillar page                          → /{lang}/merki/index.html
 *   • one hub page per ingredient              → /{lang}/merki/{id}/index.html
 *   • one question page per ingredient×pair    → /{lang}/merki/{id}/{from}-v-{to}/index.html
 *   • assets/data.{lang}.js  (window.__KITCHEN_DATA__)
 *   • sitemap.xml, robots.txt
 *
 * Run:  node build.mjs            (writes to ./dist)
 *
 * Architecture: the DATA LAYER below is language-independent at its core
 * (density is physics, not language). To launch a new market you add a language
 * code to LANGS and a localized name/string set — no new code.
 * ---------------------------------------------------------------------------
 */

import { writeFileSync, mkdirSync, cpSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

// system/faqs.bg.js uses an IIFE that sets globalThis.__KITCHEN_FAQS__.
// With "type":"module" in package.json, createRequire can't load it as CJS,
// so we execute it via new Function with a synthetic globalThis to capture the export.
const _faqsCtx = {};
(new Function("globalThis", readFileSync("./system/faqs.bg.js", "utf8")))(_faqsCtx);
const CUSTOM_FAQS = (_faqsCtx.__KITCHEN_FAQS__ || {}).FAQS || {}; // keyed by ingredient id

/* ===========================================================================
   CONFIG + DATA LAYER — loaded from data/ JSON files
   =========================================================================== */
const cfg             = JSON.parse(readFileSync("data/config.json", "utf8"));
const SITE            = cfg.site;
const LANGS           = cfg.langs;
const ENVIRONMENT     = cfg.environment;
const CLIENT_UNIT_ORDER = cfg.clientUnitOrder;
const REV_ANCHOR      = cfg.revAnchor;
const UNIT_PAIRS        = cfg.unitPairs;
const UNIT_PAIRS_LIQUID = cfg.unitPairsLiquid;

const BUILD_V = Date.now().toString(36);
const NOINDEX = ENVIRONMENT === "experiment";
const GA4_ID  = cfg.ga4 || "";
const ADSENSE_PUB  = "ca-pub-6774843990559946";
const ADSENSE_SLOT = "9011659196";
const adBanner = () =>
  `<div class="ad" role="complementary">` +
  `<ins class="adsbygoogle" style="display:block" ` +
  `data-ad-client="${ADSENSE_PUB}" data-ad-slot="${ADSENSE_SLOT}" ` +
  `data-ad-format="auto" data-full-width-responsive="true"></ins>` +
  `<script>(adsbygoogle=window.adsbygoogle||[]).push({});<\/script></div>`;

const INGREDIENTS = JSON.parse(readFileSync("data/ingredients.json", "utf8"));
const UNITS       = JSON.parse(readFileSync("data/units.json", "utf8"));
const CATEGORIES  = JSON.parse(readFileSync("data/categories.json", "utf8"));

const CATEGORY_ICONS = {
  brasna:    '<path d="M7 8h10l1.2 11a2 2 0 0 1-2 2.2H7.8a2 2 0 0 1-2-2.2L7 8z"/><path d="M7 8c0-2 1.2-3 2.5-3.5C8.8 3.8 9.2 3 10 3M17 8c0-2-1.2-3-2.5-3.5"/><path d="M9.5 13.5h5"/>',
  technosti: '<path d="M12 3.5c3.4 4 5.5 6.7 5.5 9.6a5.5 5.5 0 0 1-11 0C6.5 10.2 8.6 7.5 12 3.5z"/>',
  zahari:    '<rect x="6" y="8" width="12" height="13" rx="2"/><path d="M7.5 8V6.5h9V8"/><path d="M9 5h6"/><path d="M12 12v5"/>',
  yadki:     '<path d="M6 10a6 6 0 0 1 12 0c0 4-3 8-6 8s-6-4-6-8z"/><path d="M6.5 10h11"/><path d="M12 4.5V3"/>',
  mlechni:   '<path d="M8 8h8v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8z"/><path d="M8 8l1.5-3h5L16 8"/><path d="M10.5 5V3.5h3V5"/>',
  podpravki: '<path d="M8 9h8l.6 10a2 2 0 0 1-2 2.1H9.4a2 2 0 0 1-2-2.1L8 9z"/><path d="M8 9V6.5a4 4 0 0 1 8 0V9"/><circle cx="10.5" cy="5" r=".5"/><circle cx="13.5" cy="5" r=".5"/><circle cx="12" cy="4" r=".5"/>',
  zrna:      '<path d="M12 21V9"/><path d="M12 9c0-2-1.5-3.5-3.5-4 0 2 1.5 3.5 3.5 4z"/><path d="M12 9c0-2 1.5-3.5 3.5-4 0 2-1.5 3.5-3.5 4z"/><path d="M12 14c0-2-1.5-3.5-3.5-4 0 2 1.5 3.5 3.5 4z"/><path d="M12 14c0-2 1.5-3.5 3.5-4 0 2-1.5 3.5-3.5 4z"/>',
};

const brandHtml = (lang) =>
  `<a class="brand" href="/${lang}/" aria-label="Мерило — начало">` +
  `<span class="brand__mark" aria-hidden="true"><svg width="38" height="38" viewBox="0 0 30 30" fill="none">` +
  `<rect x="1.2" y="1.2" width="27.6" height="27.6" rx="8" stroke="#C2522C" stroke-width="2.4"/>` +
  `<line x1="8" y1="9" x2="8" y2="21" stroke="#C2522C" stroke-width="2.4" stroke-linecap="round"/>` +
  `<line x1="15" y1="6" x2="15" y2="24" stroke="#E0A12E" stroke-width="2.4" stroke-linecap="round"/>` +
  `<line x1="22" y1="9" x2="22" y2="21" stroke="#C2522C" stroke-width="2.4" stroke-linecap="round"/>` +
  `</svg></span><span class="brand__name">Мерило<b>.</b></span></a>`;

const T = Object.fromEntries(
  LANGS.map(l => [l, JSON.parse(readFileSync(`data/translations.${l}.json`, "utf8"))])
);

function tmpl(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
}

/* ===========================================================================
   HELPERS
   =========================================================================== */
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function round(n) {
  if (!isFinite(n)) return n;
  if (n >= 100) return Math.round(n);
  if (n >= 10)  return Math.round(n * 10) / 10;
  return Math.round(n * 100) / 100;
}
const num = (n) => String(n).replace(".", ","); // Bulgarian decimal comma for display
const gramsFromVolume = (ml, density) => ml * density;

// Exact-first weight for a whole Bulgarian unit: use the source-measured value when
// present, otherwise derive from density. `frac` supports ½ чаша etc.
function unitWeight(ing, unitKey, frac = 1) {
  if (ing.measures && ing.measures[unitKey] != null) return ing.measures[unitKey] * frac;
  const u = UNITS[unitKey];
  if (u && typeof u.ml === "number") return gramsFromVolume(u.ml * frac, ing.density);
  return null;
}

const baseUrl = (lang, ...parts) => `${SITE.domain}/${lang}/${parts.join("/")}/`.replace(/\/+/g, "/").replace(":/", "://");
const hubPath  = (lang, id)         => join(SITE.outDir, lang, "merki", id, "index.html");
const pagePath = (lang, id, slug)   => join(SITE.outDir, lang, "merki", id, slug, "index.html");

function unitPhrase(unitKey, lang) {
  return UNITS[unitKey].label[lang];
}

/* ===========================================================================
   CLIENT DATA EMITTER — closes the data-drift gap between build.mjs and calc.js
   Emits window.__KITCHEN_DATA__ in the exact shape calc.js expects.
   =========================================================================== */
function renderClientData(lang) {
  const ingredients = {};
  for (const ing of INGREDIENTS) {
    ingredients[ing.id] = { name: ing.names[lang], density: ing.density, liquid: !!ing.liquid };
    if (ing.measures) ingredients[ing.id].measures = ing.measures;
  }
  const units = {};
  for (const [k, u] of Object.entries(UNITS)) {
    const label = (u.c && u.c[lang]) || (u.abbr && u.abbr[lang]) || u.label[lang];
    units[k] = u.g != null ? { g: u.g, label } : { ml: u.ml, label };
  }
  return `window.__KITCHEN_DATA__=${JSON.stringify({ ingredients, units, order: CLIENT_UNIT_ORDER })};`;
}

/* ===========================================================================
   PER-PAGE COMPUTATION
   =========================================================================== */
function computeReferenceRows(ing, liquid) {
  const c = UNITS.chasha.ml, sl = UNITS.sl.ml, chl = UNITS.chl.ml;
  if (liquid) {
    const ml = (v) => `= ${num(round(v))} мл`;
    return [
      { label: "¼ чаша",                  value: ml(c * 0.25)              },
      { label: "⅓ чаша",                  value: ml(c / 3)                 },
      { label: "½ чаша",                  value: ml(c * 0.5)               },
      { label: "1 чаша",                  value: ml(c)                     },
      { label: "2 чаши",                  value: ml(c * 2)                 },
      { label: "1 кафена чаша (к.ч.)",   value: ml(UNITS.coffee_cup.ml)   },
      { label: "1 супена лъжица (с.л.)",  value: ml(sl)                    },
      { label: "1 чаена лъжичка (ч.л.)",  value: ml(chl)                   },
    ];
  }
  const gCup = (frac) => `≈ ${num(round(unitWeight(ing, "chasha", frac)))} г`;
  const gUnit = (key)  => `≈ ${num(round(unitWeight(ing, key)))} г`;
  return [
    { label: "¼ чаша",                  value: gCup(0.25)           },
    { label: "⅓ чаша",                  value: gCup(1 / 3)          },
    { label: "½ чаша",                  value: gCup(0.5)            },
    { label: "1 чаша",                  value: gCup(1)              },
    { label: "2 чаши",                  value: gCup(2)              },
    { label: "1 кафена чаша (к.ч.)",   value: gUnit("coffee_cup")  },
    { label: "1 супена лъжица (с.л.)",  value: gUnit("sl")          },
    { label: "1 чаена лъжичка (ч.л.)",  value: gUnit("chl")         },
  ];
}

function getUnitPairs(ing) { return ing.liquid ? UNIT_PAIRS_LIQUID : UNIT_PAIRS; }

function pairCard(ing, pair, lang) {
  const fromU = UNITS[pair.from], toU = UNITS[pair.to];
  // v2v: volume → volume (liquids: e.g. chasha → ml)
  if (typeof fromU.ml === "number" && typeof toU.ml === "number") {
    const toPl = (toU.label_pl && toU.label_pl[lang]) || toU.label[lang];
    const slug = `${fromU.slug}-v-${toU.slug}`;
    return { dir: "v2v", slug, name: `${cap(unitPhrase(pair.from, lang))} → ${toPl}`,
             value: `= ${num(fromU.ml)} мл`, url: baseUrl(lang, "merki", ing.id, slug) };
  }
  // v2m: volume → mass (dry ingredients)
  if (typeof fromU.ml === "number" && typeof toU.g === "number") {
    const grams = round(unitWeight(ing, pair.from));
    const slug = `${fromU.slug}-v-${toU.slug}`;
    return { dir: "v2m", slug, name: `${cap(unitPhrase(pair.from, lang))} → грамове`,
             value: `≈ ${num(grams)} г`, url: baseUrl(lang, "merki", ing.id, slug) };
  }
  // m2v: mass → volume
  const toPl = (toU.label_pl && toU.label_pl[lang]) || toU.label[lang];
  const nVol = round((REV_ANCHOR / ing.density) / toU.ml);
  const slug = `${REV_ANCHOR}-grama-v-${toU.slug}`;
  return { dir: "m2v", slug, name: `${REV_ANCHOR} г → ${toPl}`,
           value: `≈ ${num(nVol)} ${toPl}`, url: baseUrl(lang, "merki", ing.id, slug) };
}

function pairDir(pair) {
  const fromU = UNITS[pair.from], toU = UNITS[pair.to];
  if (typeof fromU.ml === "number" && typeof toU.ml === "number") return "v2v";
  if (typeof fromU.ml === "number" && typeof toU.g  === "number") return "v2m";
  return "m2v";
}

function siblingUrl(ing, pair, lang) {
  const dir = pairDir(pair);
  const pairs = getUnitPairs(ing);
  if (dir === "v2m") {
    const m2v = pairs.find(p => pairDir(p) === "m2v");
    return m2v ? pairCard(ing, m2v, lang).url : null;
  }
  if (dir === "m2v") {
    const v2m = pairs.find(p => pairDir(p) === "v2m");
    return v2m ? pairCard(ing, v2m, lang).url : null;
  }
  return null;
}

function computeQuestionPage(ing, pair, lang) {
  const t = T[lang];
  const name = ing.names[lang];
  const fromU = UNITS[pair.from], toU = UNITS[pair.to];
  const card = pairCard(ing, pair, lang);
  const { slug, url } = card;

  const faq = computeFaqs(ing, lang);

  let title, meta, h1, answer, crumbLeaf, prefill;
  if (card.dir === "v2v") {
    const mlVal = fromU.ml, phrase = unitPhrase(pair.from, lang);
    h1 = tmpl(t.q_h1_liquid, { unitPhrase: phrase, ing: name });
    title = `${h1} | ${t.brand}`;
    meta = tmpl(t.q_meta_liquid, { unitPhrase: phrase, ing: name, n: num(mlVal) });
    answer = tmpl(t.q_ans_liquid, { unitPhrase: phrase, ml: mlVal, ing: name, n: num(mlVal) });
    crumbLeaf = `${cap(phrase)} в милилитри`;
    prefill = { ing: ing.id, from: pair.from, to: pair.to, amt: 1, hubBase: `/${lang}/merki/` };
  } else if (card.dir === "v2m") {
    const ml = fromU.ml, grams = round(gramsFromVolume(ml, ing.density)), phrase = unitPhrase(pair.from, lang);
    h1 = tmpl(t.q_h1, { unitPhrase: phrase, ing: name });
    title = `${h1} | ${t.brand}`;
    meta = tmpl(t.q_meta, { unitPhrase: phrase, ing: name, n: num(grams) });
    answer = tmpl(t.q_ans, { unitPhrase: phrase, ml, ing: name, n: num(grams) });
    crumbLeaf = `${cap(phrase)} в грамове`;
    prefill = { ing: ing.id, from: pair.from, to: pair.to, amt: 1, hubBase: `/${lang}/merki/` };
  } else {
    const toPl = (toU.label_pl && toU.label_pl[lang]) || toU.label[lang];
    const nVol = round((REV_ANCHOR / ing.density) / toU.ml);
    h1 = tmpl(t.qr_h1, { toPl, ing: name, anchor: REV_ANCHOR });
    title = `${h1} | ${t.brand}`;
    meta = tmpl(t.qr_meta, { toPl, ing: name, anchor: REV_ANCHOR, n: num(nVol) });
    answer = tmpl(t.qr_ans, { toPl, ing: name, anchor: REV_ANCHOR, n: num(nVol) });
    crumbLeaf = tmpl(t.qr_crumb, { toPl, anchor: REV_ANCHOR });
    prefill = { ing: ing.id, from: pair.from, to: pair.to, amt: REV_ANCHOR, hubBase: `/${lang}/merki/` };
  }

  return {
    lang, url, slug, ingId: ing.id, title, meta, h1, answer,
    tableTitle: tmpl(ing.liquid ? (t.table_title_liquid || t.table_title) : t.table_title, { ing: name }),
    breadcrumbs: [
      { name: t.home, url: baseUrl(lang) },
      { name: t.section, url: baseUrl(lang, "merki") },
      { name: cap(name), url: baseUrl(lang, "merki", ing.id) },
      { name: crumbLeaf, url: "" },
    ],
    prefill,
    referenceRows: computeReferenceRows(ing, ing.liquid),
    faq,
    ogSlug: slug, ogAnswer: answer,
    siblingUrl: siblingUrl(ing, pair, lang),
    related: relatedFor(ing, lang, slug),
    explainer: buildExplainer(ing, lang),
  };
}

function computeHubPage(ing, lang) {
  const t = T[lang];
  const name = ing.names[lang];
  const questionPages = getUnitPairs(ing).map((pair) => {
    const c = pairCard(ing, pair, lang);
    return { name: c.name, value: c.value, url: c.url };
  });
  const h1 = (ing.title && ing.title[lang]) || tmpl(t.hub_h1, { Ing: cap(name), ing: name });
  const desc = (ing.desc && ing.desc[lang]) || "";
  const tableTitle = tmpl(
    ing.liquid ? (t.table_title_liquid || t.table_title) : t.table_title,
    { ing: name }
  );
  const faq = computeFaqs(ing, lang);
  const ogAnswer = ing.liquid
    ? `1 чаша = ${UNITS.chasha.ml} мл`
    : `1 чаша ≈ ${num(round(unitWeight(ing, "chasha")))} г`;
  return {
    lang, ingId: ing.id, url: baseUrl(lang, "merki", ing.id),
    title: `${h1} | ${t.brand}`,
    meta: tmpl(t.hub_meta, { ing: name }),
    h1,
    intro: tmpl(t.hub_intro, { ing: name }),
    desc,
    ogSlug: "hub", ogAnswer,
    breadcrumbs: [
      { name: t.home, url: baseUrl(lang) },
      { name: t.section, url: baseUrl(lang, "merki") },
      ...(ing.category ? [{ name: CATEGORIES.find(c => c.id === ing.category)?.names[lang] || ing.category,
                             url: baseUrl(lang, "merki", "kategoria", ing.category) }] : []),
      { name: cap(name), url: "" },
    ],
    prefill: { ing: ing.id, from: "chasha", to: ing.liquid ? "ml" : "g", amt: 1, hubBase: `/${lang}/merki/` },
    questionPages,
    tableTitle,
    faq,
    referenceRows: computeReferenceRows(ing, ing.liquid),
    related: relatedFor(ing, lang, null),
    explainer: buildExplainer(ing, lang),
  };
}

function computePillarPage(lang) {
  const t = T[lang];
  const hubs = INGREDIENTS.map((ing) => ({
    name: cap(ing.names[lang]),
    url: baseUrl(lang, "merki", ing.id),
    value: `≈ ${round(unitWeight(ing, "chasha"))} г/чаша`,
  }));
  const categories = CATEGORIES.map(cat => ({
    name: cat.names[lang],
    url: baseUrl(lang, "merki", "kategoria", cat.slug),
    count: INGREDIENTS.filter(i => i.category === cat.id).length,
  }));
  return {
    lang, url: baseUrl(lang, "merki"),
    title: `${t.pillar_h1} | ${t.brand}`,
    meta: t.pillar_meta,
    h1: t.pillar_h1,
    intro: t.pillar_intro,
    breadcrumbs: [
      { name: t.home, url: baseUrl(lang) },
      { name: t.section, url: "" },
    ],
    hubs,
    categories,
  };
}

function computeCategoryPage(cat, lang) {
  const t = T[lang];
  const catName = cat.names[lang];
  const ings = INGREDIENTS.filter(i => i.category === cat.id);
  const url = baseUrl(lang, "merki", "kategoria", cat.slug);
  const items = ings.map(ing => ({
    name: cap(ing.names[lang]),
    url: baseUrl(lang, "merki", ing.id),
    value: ing.liquid
      ? `= ${UNITS.chasha.ml} мл/чаша`
      : `≈ ${num(round(unitWeight(ing, "chasha")))} г/чаша`,
  }));
  return {
    lang, catId: cat.id, url,
    title: `${catName} | ${t.brand}`,
    meta: `Калкулатор и таблици за ${catName.toLowerCase()} — чаши, лъжици в грамове.`,
    h1: catName,
    breadcrumbs: [
      { name: t.home, url: baseUrl(lang) },
      { name: t.section, url: baseUrl(lang, "merki") },
      { name: catName, url: "" },
    ],
    items,
  };
}

function relatedFor(ing, lang, currentSlug) {
  return INGREDIENTS.filter((x) => x.id !== ing.id).slice(0, 5).map((x) => {
    const sameType = !!x.liquid === !!ing.liquid;
    return {
      name: cap(x.names[lang]),
      url: (currentSlug && sameType)
        ? baseUrl(lang, "merki", x.id, currentSlug)
        : baseUrl(lang, "merki", x.id),
    };
  });
}

function buildExplainer(ing, lang) {
  const t = T[lang];
  const paragraphs = [];
  if (ing.note && ing.note[lang]) paragraphs.push(ing.note[lang]);
  paragraphs.push(tmpl(t.explainer_generic, { ing: ing.names[lang] }));
  paragraphs.push(t.explainer_cup);
  return { title: t.explainer_title, paragraphs };
}

function computeFaqs(ing, lang) {
  const t = T[lang];
  const name = ing.names[lang];
  const halfCupMl = UNITS.chasha.ml / 2;
  const items = [];
  if (ing.liquid) {
    items.push({ q: tmpl(t.faq_half_cup_q, { ing: name }),
                 a: tmpl(t.faq_half_cup_a_liquid, { ing: name, n: num(halfCupMl) }) });
    items.push({ q: tmpl(t.faq_100ml_q, { ing: name }),
                 a: tmpl(t.faq_100ml_a, { ing: name, n: num(round(100 * ing.density)) }) });
  } else {
    items.push({ q: tmpl(t.faq_half_cup_q, { ing: name }),
                 a: tmpl(t.faq_half_cup_a, { ing: name, n: num(round(unitWeight(ing, "chasha", 0.5))) }) });
    items.push({ q: tmpl(t.faq_100g_q, { ing: name }),
                 a: tmpl(t.faq_100g_a, { ing: name, n: num(round((100 / ing.density) / UNITS.sl.ml)) }) });
  }
  items.push({ q: t.faq_cups_q, a: t.faq_cups_a });
  const seen = new Set(items.map(f => f.q));
  // admin-managed custom FAQs (multilingual, stored in ingredients.json)
  (ing.faqs || [])
    .map(f => ({ q: f.q?.[lang] || '', a: f.a?.[lang] || '' }))
    .filter(f => f.q && f.a && !seen.has(f.q))
    .forEach(f => { items.push(f); seen.add(f.q); });
  // editorial custom FAQ from system/faqs.bg.js (HTML-formatted, BG only)
  const custom = CUSTOM_FAQS[ing.id];
  if (custom && custom.q && custom.a && !seen.has(custom.q)) {
    items.push({ q: custom.q, a: custom.a });
  }
  return items;
}

const US = { cup: 240, tbsp: 14.7868, tsp: 4.9289 }; // ml

function usEquivLine(ing) {
  const d = ing.density;
  if (ing.liquid) {
    return `В американски рецепти: 1 cup = 240 мл · 1 tbsp ≈ 15 мл · 1 tsp ≈ 5 мл (1 cup ≈ ${num(round(US.cup * d))} г)`;
  }
  return `В американски рецепти: 1 cup ≈ ${num(round(US.cup * d))} г · 1 tbsp ≈ ${num(round(US.tbsp * d))} г · 1 tsp ≈ ${num(round(US.tsp * d))} г`;
}

function trustLine(ing, lang) {
  const t = T[lang];
  let s = ing.liquid ? t.trust_liquid : t.trust_dry;
  if (ing.source)     s += " " + tmpl(t.trust_source,   { source: ing.source });
  if (ing.verifiedOn) s += " " + tmpl(t.trust_verified, { verifiedOn: ing.verifiedOn });
  return `<p class="trust"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>${s}</p>`;
}

/* ===========================================================================
   JSON-LD
   =========================================================================== */
function breadcrumbLd(crumbs) {
  return JSON.stringify({
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem", position: i + 1, name: c.name, ...(c.url ? { item: c.url } : {}),
    })),
  });
}
function stripHtml(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();
}
function faqLd(faq) {
  return JSON.stringify({
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question", name: stripHtml(f.q),
      acceptedAnswer: { "@type": "Answer", text: stripHtml(f.a) },
    })),
  });
}
function itemListLd(pages) {
  return JSON.stringify({
    "@context": "https://schema.org", "@type": "ItemList",
    itemListElement: pages.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: p.url })),
  });
}

const SITE_LD_ID = `${SITE.domain}/#website`;
const ORG_LD_ID  = `${SITE.domain}/#org`;

function orgAndSiteLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": ORG_LD_ID, "name": "Мерки", "url": SITE.domain },
      { "@type": "WebSite", "@id": SITE_LD_ID, "url": SITE.domain, "name": "Мерки",
        "inLanguage": "bg", "publisher": { "@id": ORG_LD_ID } },
    ],
  });
}

function webpageLd(url, title, dateModified) {
  const node = {
    "@context": "https://schema.org", "@type": "WebPage",
    "@id": url, "url": url, "name": title,
    "inLanguage": "bg", "isPartOf": { "@id": SITE_LD_ID },
  };
  if (dateModified) node.dateModified = dateModified;
  return JSON.stringify(node);
}

function ogImagePng(ingName, answerLine) {
  const svg = ogImageSvg(ingName, answerLine);
  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}

function ogImageSvg(ingName, answerLine) {
  const x = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#2A2420"/><text x="60" y="220" font-family="Georgia,serif" font-size="80" font-weight="700" fill="#FBF6EC">${x(ingName)}</text><text x="60" y="360" font-family="Georgia,serif" font-size="64" font-weight="600" fill="#E0A12E">${x(answerLine)}</text><text x="1140" y="600" font-family="Georgia,serif" font-size="36" fill="#9a8878" text-anchor="end">Мерки</text></svg>`;
}

/* ===========================================================================
   RENDER  (link shared cached assets — do not inline CSS per page)
   =========================================================================== */
const head = ({ lang, title, meta, canonical, pageScript = "calc.js", ogImage = "" }) => `<!DOCTYPE html>
<html lang="${lang}">
<head>
${GA4_ID ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');</script>` : ""}
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${meta}">
<link rel="canonical" href="${canonical}">
${LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${canonical}">`).join("\n")}
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta property="og:title" content="${title}"><meta property="og:description" content="${meta}"><meta property="og:url" content="${canonical}">${ogImage ? `\n<meta property="og:image" content="${ogImage}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${ogImage}">` : ""}
<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/brand/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/brand/favicon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,600;0,800;1,400&family=Onest:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css?v=${BUILD_V}">
${NOINDEX ? '<meta name="robots" content="noindex">' : ""}
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6774843990559946" crossorigin="anonymous"></script>
<script src="/assets/data.${lang}.js"></script>
<script src="/assets/${pageScript}" defer></script>`;

const crumbsHtml = (crumbs) => crumbs.map((c, i) =>
  (c.url ? `<a href="${c.url}">${c.name}</a>` : `<span class="here">${c.name}</span>`) +
  (i < crumbs.length - 1 ? `<span class="sep">›</span>` : "")
).join("");

const tableHtml = (rows) =>
  rows.map((r) => `<tr><td>${r.label}</td><td>${r.value}</td></tr>`).join("");

// calc.js is loaded via head() — only inject __PREFILL__ here
const calcMarkup = (t, prefill) => `
<div class="calc"><div class="calc__head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2.5"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="10" y2="11"/><line x1="14" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="10" y2="15"/><line x1="14" y1="15" x2="16" y2="15"/><line x1="8" y1="19" x2="10" y2="19"/></svg>Калкулатор за мерки</div><div class="calc__body">
<div class="chips" id="chips"><button class="chip" data-amt="0.5">½ чаша</button><button class="chip" data-amt="1">1 чаша</button><button class="chip" data-amt="2">2 чаши</button><button class="chip" data-amt="1" data-from="coffee_cup">1 к.ч.</button><button class="chip" data-amt="1" data-from="sl">1 с.л.</button><button class="chip" data-amt="1" data-from="chl">1 ч.л.</button></div>
<div class="row"><div class="field"><label for="amt">Количество</label><input id="amt" type="number" inputmode="decimal" min="0" step="any" value="${prefill.amt}"></div>
<div class="field"><label for="ing">Съставка</label><select id="ing"></select></div></div>
<div class="row"><div class="field"><label for="from">От</label><select id="from"></select></div>
<div class="field"><label for="to">Към</label><select id="to"></select></div></div>
<div class="swap"><button id="swap" type="button">↕ размени мерките</button></div>
<div class="result" aria-live="polite"><button class="result__copy" id="copy" type="button">Копирай</button>
<div class="result__num" id="out">—</div><div class="result__sub" id="why"></div></div></div></div>
<script>window.__PREFILL__=${JSON.stringify(prefill)};</script>`;

function renderQuestion(p) {
  const t = T[p.lang];
  const ing = INGREDIENTS.find(i => i.id === p.ingId);
  const ogImage = `${SITE.domain}/assets/og/${p.ingId}-${p.ogSlug}.png`;
  return `${head({ lang: p.lang, title: p.title, meta: p.meta, canonical: p.url, ogImage })}
<script type="application/ld+json">${breadcrumbLd(p.breadcrumbs)}</script>
<script type="application/ld+json">${faqLd(p.faq)}</script>
<script type="application/ld+json">${webpageLd(p.url, p.title, ing.verifiedOn || "")}</script>
</head><body><div class="wrap">
<header>${brandHtml(p.lang)}
<nav class="crumbs" aria-label="breadcrumb">${crumbsHtml(p.breadcrumbs)}</nav></header>
<div class="hero"><h1>${p.h1}</h1><p class="answer">${p.answer}</p>${(ing.verifiedOn || ing.source) ? `<p class="updated"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg>${[ing.verifiedOn ? 'обновено: ' + ing.verifiedOn : '', ing.source ? 'източник: ' + ing.source : ''].filter(Boolean).join(' · ')}</p>` : ""}</div>
${calcMarkup(t, p.prefill)}
${adBanner()}
${p.siblingUrl ? `<p class="sibling-link"><a href="${p.siblingUrl}">↔ Обратно изчисление</a></p>` : ""}
<section><h2>${p.tableTitle}</h2>
<div class="table-card"><table><thead><tr><th>${t.tbl_measure}</th><th>${t.tbl_weight}</th></tr></thead>
<tbody>${tableHtml(p.referenceRows)}</tbody></table></div>
<p class="us-equiv">${usEquivLine(ing)}</p></section>
<div class="page-actions"><button class="btn-print" onclick="window.print()">🖨 Принтирай таблицата</button><a class="btn-pin" href="https://pinterest.com/pin/create/button/?url=${encodeURIComponent(p.url)}&media=${encodeURIComponent(ogImage)}&description=${encodeURIComponent(p.title)}" target="_blank" rel="noopener">📌 Запази в Pinterest</a></div>
<div class="affil"><span>${t.affil}</span><a href="#" rel="sponsored nofollow">${t.affil_link}</a></div>
<section class="explainer"><h2>${p.explainer.title}</h2>${p.explainer.paragraphs.map(x=>`<p>${x}</p>`).join("")}${trustLine(INGREDIENTS.find(i=>i.id===p.ingId), p.lang)}</section>
<section><h2>${t.faq_title}</h2>${p.faq.map(f=>`<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join("")}</section>
<section><a class="cta" href="${t.cta_url}">${t.cta}<small>${t.cta_sub}</small></a></section>
<section><h2>${t.related}</h2><div class="related">${p.related.map(r=>`<a href="${r.url}">${r.name}</a>`).join("")}</div></section>
<div class="feedback" id="feedback"><span>Беше ли полезно?</span><button data-vote="up">👍</button><button data-vote="down">👎</button><span class="feedback-msg"></span></div>
<footer><p>${t.footer}</p></footer>
</div><script src="/assets/feedback.js" defer></script></body></html>`;
}

function renderHub(p) {
  const t = T[p.lang];
  const ing = INGREDIENTS.find(i => i.id === p.ingId);
  const ogImage = `${SITE.domain}/assets/og/${p.ingId}-${p.ogSlug}.png`;
  return `${head({ lang: p.lang, title: p.title, meta: p.meta, canonical: p.url, ogImage })}
<script type="application/ld+json">${breadcrumbLd(p.breadcrumbs)}</script>
<script type="application/ld+json">${itemListLd(p.questionPages)}</script>
${p.faq.length > 0 ? `<script type="application/ld+json">${faqLd(p.faq)}</script>` : ""}
<script type="application/ld+json">${webpageLd(p.url, p.title, ing.verifiedOn || "")}</script>
</head><body><div class="wrap">
<header>${brandHtml(p.lang)}
<nav class="crumbs" aria-label="breadcrumb">${crumbsHtml(p.breadcrumbs)}</nav></header>
<div class="hero"><h1>${p.h1}</h1><p class="answer">${p.desc || p.intro}</p>${(ing.verifiedOn || ing.source) ? `<p class="updated"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg>${[ing.verifiedOn ? 'обновено: ' + ing.verifiedOn : '', ing.source ? 'източник: ' + ing.source : ''].filter(Boolean).join(' · ')}</p>` : ""}</div>
${calcMarkup(t, p.prefill)}
<section><h2>${tmpl(t.quick, { ing: INGREDIENTS.find(i=>i.id===p.ingId).names[p.lang] })}</h2>
<div class="qa-grid">${p.questionPages.map(q=>`<a class="qa-card" href="${q.url}"><b>${q.name}</b><span class="v">${q.value}</span></a>`).join("")}</div></section>
${adBanner()}
<section><h2>${p.tableTitle}</h2>
<div class="table-card"><table><thead><tr><th>${t.tbl_measure}</th><th>${t.tbl_weight}</th></tr></thead>
<tbody>${tableHtml(p.referenceRows)}</tbody></table></div>
<p class="us-equiv">${usEquivLine(ing)}</p></section>
<div class="page-actions"><button class="btn-print" onclick="window.print()">🖨 Принтирай таблицата</button><a class="btn-pin" href="https://pinterest.com/pin/create/button/?url=${encodeURIComponent(p.url)}&media=${encodeURIComponent(ogImage)}&description=${encodeURIComponent(p.title)}" target="_blank" rel="noopener">📌 Запази в Pinterest</a></div>
<div class="affil"><span>${t.affil}</span><a href="#" rel="sponsored nofollow">${t.affil_link}</a></div>
<section class="explainer"><h2>${p.explainer.title}</h2>${p.explainer.paragraphs.map(x=>`<p>${x}</p>`).join("")}${trustLine(INGREDIENTS.find(i=>i.id===p.ingId), p.lang)}</section>
${p.faq.length > 0 ? `<section><h2>${t.faq_title}</h2>${p.faq.map(f=>`<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join("")}</section>` : ""}
<section><a class="cta" href="${t.cta_url}">${t.cta}<small>${t.cta_sub}</small></a></section>
<section><h2>${t.related}</h2><div class="related">${p.related.map(r=>`<a href="${r.url}">${r.name}</a>`).join("")}</div></section>
<div class="feedback" id="feedback"><span>Беше ли полезно?</span><button data-vote="up">👍</button><button data-vote="down">👎</button><span class="feedback-msg"></span></div>
<footer><p>${t.footer}</p></footer>
</div><script src="/assets/feedback.js" defer></script></body></html>`;
}

function renderPillar(p) {
  const t = T[p.lang];
  const lang = p.lang;
  const svgIcon = (paths) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  const chevron = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

  const accordionHtml = CATEGORIES.map(cat => {
    const items = INGREDIENTS.filter(i => i.category === cat.id);
    const itemsHtml = items.map((ing, idx) => {
      const val = ing.liquid ? `≈ ${num(UNITS.chasha.ml)} мл/чаша` : `≈ ${round(unitWeight(ing, "chasha"))} г/чаша`;
      return `<a class="home-ing" href="${baseUrl(lang,"merki",ing.id)}" style="animation-delay:${idx*40}ms">` +
        `<span class="nm">${cap(ing.names[lang])}</span><span class="vl">${val}</span></a>`;
    }).join("");
    return `<div class="cat" id="cat-${cat.id}">` +
      `<button class="cat-head" onclick="toggleCat('${cat.id}')" aria-expanded="false">` +
      `<span class="cat-badge">${svgIcon(CATEGORY_ICONS[cat.id] || "")}</span>` +
      `<span class="cat-meta"><span class="cat-name">${cat.names[lang]}</span><span class="cat-count">${items.length} съставки</span></span>` +
      `<a class="cat-link" href="${baseUrl(lang,"merki","kategoria",cat.slug)}" onclick="event.stopPropagation()">цялата категория →</a>` +
      `<span class="cat-chev">${chevron}</span>` +
      `</button>` +
      `<div class="cat-body" id="body-${cat.id}"><div class="cat-body-inner"><div class="home-ing-grid">${itemsHtml}</div></div></div>` +
      `</div>`;
  }).join("\n");

  const homeIngs = JSON.stringify(INGREDIENTS.map(ing => ({
    slug: ing.id,
    name: cap(ing.names[lang]),
    val:  ing.liquid ? `≈ ${num(UNITS.chasha.ml)} мл/чаша` : `≈ ${round(unitWeight(ing, "chasha"))} г/чаша`,
    url:  baseUrl(lang, "merki", ing.id),
  })));

  return `${head({ lang, title: p.title, meta: p.meta, canonical: p.url, pageScript: "merki-home.js" })}
<script type="application/ld+json">${breadcrumbLd(p.breadcrumbs)}</script>
<script type="application/ld+json">${orgAndSiteLd()}</script>
<script type="application/ld+json">${webpageLd(p.url, p.title, "")}</script>
</head><body><div class="wrap">
<header>${brandHtml(lang)}
<nav class="crumbs" aria-label="breadcrumb">${crumbsHtml(p.breadcrumbs)}</nav></header>
<div class="hero"><h1>Мерни единици в <em>кухнята</em></h1><p class="lead">${p.intro}</p></div>
<div class="search">
<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
<input id="q" type="text" placeholder="Търсете съставка — напр. брашно, захар, мляко…" autocomplete="off">
<div class="results" id="results"></div>
</div>
<p class="section-label">Категории</p>
<div class="cats">${accordionHtml}</div>
<section><a class="cta" href="${t.cta_url}">${t.cta}<small>${t.cta_sub}</small></a></section>
<footer><p>${t.footer}</p></footer>
</div>
<script>window.__HOME_INGS__=${homeIngs};</script>
</body></html>`;
}

function renderCategory(p) {
  const t = T[p.lang];
  return `${head({ lang: p.lang, title: p.title, meta: p.meta, canonical: p.url })}
<script type="application/ld+json">${breadcrumbLd(p.breadcrumbs)}</script>
<script type="application/ld+json">${itemListLd(p.items)}</script>
<script type="application/ld+json">${webpageLd(p.url, p.title, "")}</script>
</head><body><div class="wrap">
<header>${brandHtml(p.lang)}
<nav class="crumbs" aria-label="breadcrumb">${crumbsHtml(p.breadcrumbs)}</nav></header>
<div class="hero"><h1>${p.h1}</h1></div>
<section><div class="qa-grid">${p.items.map(i=>`<a class="qa-card" href="${i.url}"><b>${i.name}</b><span class="v">${i.value}</span></a>`).join("")}</div></section>
<section><a class="cta" href="${t.cta_url}">${t.cta}<small>${t.cta_sub}</small></a></section>
<footer><p>${t.footer}</p></footer>
</div></body></html>`;
}

function renderScaler(lang) {
  const t = T[lang];
  const url = baseUrl(lang, "preobrazuvane-na-recepta");
  const crumbs = [
    { name: t.home, url: baseUrl(lang) },
    { name: "Преобразуване на рецепта", url: "" },
  ];
  return `${head({ lang, title: `${t.scaler_title} | ${t.brand}`, meta: t.scaler_meta, canonical: url, pageScript: "scaler.js" })}
${breadcrumbLd(crumbs) ? `<script type="application/ld+json">${breadcrumbLd(crumbs)}</script>` : ""}
</head><body><div class="wrap">
<header>${brandHtml(lang)}
<nav class="crumbs" aria-label="breadcrumb">${crumbsHtml(crumbs)}</nav></header>
<div class="hero"><h1>${t.scaler_h1}</h1><p class="lead">${t.scaler_lead}</p></div>
<div class="panel"><div class="panel__body">
<div class="tabs" role="tablist">
<button class="tab" id="tab-manual" role="tab" aria-selected="true">Въведи ръчно</button>
<button class="tab" id="tab-paste" role="tab" aria-selected="false">Постави рецепта</button>
<button class="tab" id="tab-url" role="tab" aria-selected="false">От URL</button>
</div>
<div id="url-panel" hidden>
<div class="url-fetch-row">
<input type="url" id="recipe-url" placeholder="https://example.com/recepta-za-banichka/" autocomplete="url" spellcheck="false">
<button class="add" id="fetch-btn" style="border-style:solid;white-space:nowrap">Вземи рецептата</button>
</div>
<p class="hint" id="fetch-status">Поддържа сайтове с рецепти с JSON-LD (schema.org) като повечето модерни кулинарни сайтове. Съставките се добавят автоматично.</p>
</div>
<div id="paste-panel" hidden>
<textarea id="paste" placeholder="Постави съставките — по една на ред или разделени със запетая. Напр.:&#10;2 чаши брашно&#10;1 с.л. захар, 1/2 ч.л. сол&#10;250 г масло&#10;1 чаша мляко"></textarea>
<button class="add" id="parse-btn" style="margin-top:12px;border-style:solid">Анализирай и добави съставките</button>
<p class="hint">Разпознава дроби (1/2, 1½), диапазони (2–3), запетаи и мерки като чаша, с.л., ч.л., г, мл, cup, oz. Работи и с неформатиран текст.</p>
</div>
<div id="manual-panel">
<div class="rows" id="rows"></div>
<button class="add" id="add-row">+ добави съставка</button>
<datalist id="ing-names"></datalist>
</div>
</div></div>
<div class="panel"><div class="panel__head">Порции и мерки</div><div class="panel__body">
<div class="controls">
<div class="ctrl"><label for="src">Рецептата е за</label>
<div class="stepper"><button type="button" data-step="src" data-d="-1">−</button><input id="src" type="number" min="1" value="4"><button type="button" data-step="src" data-d="1">+</button></div></div>
<div class="ctrl"><label for="tgt">Искам порции</label>
<div class="stepper"><button type="button" data-step="tgt" data-d="-1">−</button><input id="tgt" type="number" min="1" value="6"><button type="button" data-step="tgt" data-d="1">+</button></div></div>
<div class="ctrl"><label>Изход</label>
<label class="toggle"><input type="checkbox" id="to-grams" checked> Покажи в грамове</label></div>
</div>
<p class="factor" id="factor"></p>
</div></div>
<div id="output"></div>
<footer><p>${t.footer}</p></footer>
</div></body></html>`;
}

/* ===========================================================================
   SITEMAP (hreflang-aware)
   =========================================================================== */
function renderSitemap(entries) {
  const ns = `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"`;
  const urls = entries.map((e) => `  <url>\n    <loc>${e.loc}</loc>\n` +
    e.alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>`).join("\n") +
    `\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset ${ns}>\n${urls}\n</urlset>\n`;
}

/* ===========================================================================
   GENERATE
   =========================================================================== */
function write(path, content) {
  mkdirSync(join(...path.split("/").slice(0, -1)), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function build() {
  // 1. Emit client data files first so cpSync picks them up
  for (const lang of LANGS) {
    write(`assets/data.${lang}.js`, renderClientData(lang));
  }

  const sitemap = [];
  let count = 0;

  for (const lang of LANGS) {
    // 2. Pillar page
    const pillar = computePillarPage(lang);
    write(join(SITE.outDir, lang, "merki", "index.html"), renderPillar(pillar));
    sitemap.push({ loc: pillar.url, alternates: [{ lang, href: pillar.url }] });
    count++;

    // 2b. Recipe scaler page
    const scalerUrl = baseUrl(lang, "preobrazuvane-na-recepta");
    write(join(SITE.outDir, lang, "preobrazuvane-na-recepta", "index.html"), renderScaler(lang));
    sitemap.push({ loc: scalerUrl, alternates: [{ lang, href: scalerUrl }] });
    count++;

    // 3. Category pages
    for (const cat of CATEGORIES) {
      const catPage = computeCategoryPage(cat, lang);
      write(join(SITE.outDir, lang, "merki", "kategoria", cat.slug, "index.html"), renderCategory(catPage));
      sitemap.push({ loc: catPage.url, alternates: [{ lang, href: catPage.url }] });
      count++;
    }

    // 4. Hub + question pages per ingredient
    for (const ing of INGREDIENTS) {
      const hub = computeHubPage(ing, lang);
      writeFileSync(join(SITE.outDir, "assets", "og", `${ing.id}-hub.png`), ogImagePng(cap(ing.names[lang]), hub.ogAnswer));
      write(hubPath(lang, ing.id), renderHub(hub));
      sitemap.push({ loc: hub.url, alternates: [{ lang, href: hub.url }] });
      count++;

      for (const pair of getUnitPairs(ing)) {
        const page = computeQuestionPage(ing, pair, lang);
        writeFileSync(join(SITE.outDir, "assets", "og", `${ing.id}-${page.slug}.png`), ogImagePng(cap(ing.names[lang]), page.ogAnswer));
        write(pagePath(lang, ing.id, page.slug), renderQuestion(page));
        sitemap.push({ loc: page.url, alternates: [{ lang, href: page.url }] });
        count++;
      }
    }
  }

  // 4. Sitemap + robots.txt + .htaccess (root + bg/ subdirectory)
  write(join(SITE.outDir, "sitemap.xml"), renderSitemap(sitemap));
  write(join(SITE.outDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE.domain}/sitemap.xml\n`);
  const base = "DirectoryIndex index.html\nOptions -Indexes\n";
  write(join(SITE.outDir, ".htaccess"), base + "RedirectMatch 301 ^/$ /bg/merki/\n");
  write(join(SITE.outDir, "bg", ".htaccess"), base + "RedirectMatch 301 ^/bg/?$ /bg/merki/\n");

  // 5. Copy shared assets (includes newly written data.{lang}.js files)
  if (existsSync("assets")) cpSync("assets", join(SITE.outDir, "assets"), { recursive: true });

  console.log(`✓ ${count} pages across ${LANGS.length} language(s)`);
  console.log(`  (1 pillar + ${INGREDIENTS.length} hubs + ${INGREDIENTS.length * UNIT_PAIRS.length} question pages)`);
  console.log(`✓ sitemap.xml with ${sitemap.length} URLs`);
  console.log(`✓ robots.txt → ${SITE.domain}/sitemap.xml`);
  console.log(`✓ assets/data.${LANGS.join(", data.")}.js emitted`);
  console.log(`→ output in ./${SITE.outDir}`);
  if (NOINDEX) console.log(`⚠  ENVIRONMENT="${ENVIRONMENT}" — all pages carry noindex`);
}

build();
