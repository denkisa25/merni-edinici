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

const INGREDIENTS = JSON.parse(readFileSync("data/ingredients.json", "utf8"));
const UNITS       = JSON.parse(readFileSync("data/units.json", "utf8"));

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
  for (const ing of INGREDIENTS)
    ingredients[ing.id] = { name: ing.names[lang], density: ing.density, liquid: !!ing.liquid };
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
function computeReferenceRows(density, liquid) {
  const c = UNITS.chasha.ml, sl = UNITS.sl.ml, chl = UNITS.chl.ml;
  if (liquid) {
    const ml = (v) => `= ${num(round(v))} мл`;
    return [
      { label: "¼ чаша",                  value: ml(c * 0.25) },
      { label: "⅓ чаша",                  value: ml(c / 3)    },
      { label: "½ чаша",                  value: ml(c * 0.5)  },
      { label: "1 чаша",                  value: ml(c)        },
      { label: "2 чаши",                  value: ml(c * 2)    },
      { label: "1 супена лъжица (с.л.)",  value: ml(sl)       },
      { label: "1 чаена лъжичка (ч.л.)",  value: ml(chl)      },
    ];
  }
  const g = (ml) => `≈ ${num(round(gramsFromVolume(ml, density)))} г`;
  return [
    { label: "¼ чаша",                  value: g(c * 0.25) },
    { label: "⅓ чаша",                  value: g(c / 3)    },
    { label: "½ чаша",                  value: g(c * 0.5)  },
    { label: "1 чаша",                  value: g(c)        },
    { label: "2 чаши",                  value: g(c * 2)    },
    { label: "1 супена лъжица (с.л.)",  value: g(sl)       },
    { label: "1 чаена лъжичка (ч.л.)",  value: g(chl)      },
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
    const grams = round(gramsFromVolume(fromU.ml, ing.density));
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

function computeQuestionPage(ing, pair, lang) {
  const t = T[lang];
  const name = ing.names[lang];
  const fromU = UNITS[pair.from], toU = UNITS[pair.to];
  const card = pairCard(ing, pair, lang);
  const { slug, url } = card;

  const slGrams = round(gramsFromVolume(UNITS.sl.ml, ing.density));
  const cupsIn500 = round((500 / ing.density) / UNITS.chasha.ml);
  const customFaqs = (ing.faqs || []).map(f => ({ q: f.q?.[lang] || '', a: f.a?.[lang] || '' })).filter(f => f.q && f.a);
  const faq = [
    { q: tmpl(t.faq1_q, { ing: name }), a: tmpl(t.faq1_a, { ing: name, n: num(slGrams) }) },
    { q: tmpl(t.faq2_q, { ing: name }), a: tmpl(t.faq2_a, { ing: name, n: num(cupsIn500), cups: cupsIn500 === 1 ? t.cup_sg : t.cup_pl }) },
    ...customFaqs,
  ];

  let title, meta, h1, answer, crumbLeaf, prefill;
  if (card.dir === "v2v") {
    const mlVal = fromU.ml, phrase = unitPhrase(pair.from, lang);
    h1 = tmpl(t.q_h1_liquid, { unitPhrase: phrase, ing: name });
    title = `${h1} | ${t.brand}`;
    meta = tmpl(t.q_meta_liquid, { unitPhrase: phrase, ing: name, n: num(mlVal) });
    answer = tmpl(t.q_ans_liquid, { unitPhrase: phrase, ml: mlVal, ing: name, n: num(mlVal) });
    crumbLeaf = `${cap(phrase)} в милилитри`;
    prefill = { ing: ing.id, from: pair.from, to: pair.to, amt: 1 };
  } else if (card.dir === "v2m") {
    const ml = fromU.ml, grams = round(gramsFromVolume(ml, ing.density)), phrase = unitPhrase(pair.from, lang);
    h1 = tmpl(t.q_h1, { unitPhrase: phrase, ing: name });
    title = `${h1} | ${t.brand}`;
    meta = tmpl(t.q_meta, { unitPhrase: phrase, ing: name, n: num(grams) });
    answer = tmpl(t.q_ans, { unitPhrase: phrase, ml, ing: name, n: num(grams) });
    crumbLeaf = `${cap(phrase)} в грамове`;
    prefill = { ing: ing.id, from: pair.from, to: pair.to, amt: 1 };
  } else {
    const toPl = (toU.label_pl && toU.label_pl[lang]) || toU.label[lang];
    const nVol = round((REV_ANCHOR / ing.density) / toU.ml);
    h1 = tmpl(t.qr_h1, { toPl, ing: name, anchor: REV_ANCHOR });
    title = `${h1} | ${t.brand}`;
    meta = tmpl(t.qr_meta, { toPl, ing: name, anchor: REV_ANCHOR, n: num(nVol) });
    answer = tmpl(t.qr_ans, { toPl, ing: name, anchor: REV_ANCHOR, n: num(nVol) });
    crumbLeaf = tmpl(t.qr_crumb, { toPl, anchor: REV_ANCHOR });
    prefill = { ing: ing.id, from: pair.from, to: pair.to, amt: REV_ANCHOR };
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
    referenceRows: computeReferenceRows(ing.density, ing.liquid),
    faq,
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
  const slGrams = round(gramsFromVolume(UNITS.sl.ml, ing.density));
  const cupsIn500 = round((500 / ing.density) / UNITS.chasha.ml);
  const customFaqs = (ing.faqs || []).map(f => ({ q: f.q?.[lang] || '', a: f.a?.[lang] || '' })).filter(f => f.q && f.a);
  const faq = [
    { q: tmpl(t.faq1_q, { ing: name }), a: tmpl(t.faq1_a, { ing: name, n: num(slGrams) }) },
    { q: tmpl(t.faq2_q, { ing: name }), a: tmpl(t.faq2_a, { ing: name, n: num(cupsIn500), cups: cupsIn500 === 1 ? t.cup_sg : t.cup_pl }) },
    ...customFaqs,
  ];
  return {
    lang, ingId: ing.id, url: baseUrl(lang, "merki", ing.id),
    title: `${h1} | ${t.brand}`,
    meta: tmpl(t.hub_meta, { ing: name }),
    h1,
    intro: tmpl(t.hub_intro, { ing: name }),
    desc,
    breadcrumbs: [
      { name: t.home, url: baseUrl(lang) },
      { name: t.section, url: baseUrl(lang, "merki") },
      { name: cap(name), url: "" },
    ],
    prefill: { ing: ing.id, from: "chasha", to: ing.liquid ? "ml" : "g", amt: 1 },
    questionPages,
    tableTitle,
    faq,
    referenceRows: computeReferenceRows(ing.density, ing.liquid),
    related: relatedFor(ing, lang, null),
    explainer: buildExplainer(ing, lang),
  };
}

function computePillarPage(lang) {
  const t = T[lang];
  const hubs = INGREDIENTS.map((ing) => ({
    name: cap(ing.names[lang]),
    url: baseUrl(lang, "merki", ing.id),
    value: `≈ ${round(gramsFromVolume(UNITS.chasha.ml, ing.density))} г/чаша`,
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

function trustLine(ing, lang) {
  const t = T[lang];
  let s = ing.liquid ? t.trust_liquid : t.trust_dry;
  if (ing.source)     s += " " + tmpl(t.trust_source,   { source: ing.source });
  if (ing.verifiedOn) s += " " + tmpl(t.trust_verified, { verifiedOn: ing.verifiedOn });
  return `<p class="trust">${s}</p>`;
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
function faqLd(faq) {
  return JSON.stringify({
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });
}
function itemListLd(pages) {
  return JSON.stringify({
    "@context": "https://schema.org", "@type": "ItemList",
    itemListElement: pages.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: p.url })),
  });
}

/* ===========================================================================
   RENDER  (link shared cached assets — do not inline CSS per page)
   =========================================================================== */
const head = ({ lang, title, meta, canonical, pageScript = "calc.js" }) => `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${meta}">
<link rel="canonical" href="${canonical}">
${LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${canonical}">`).join("\n")}
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta property="og:title" content="${title}"><meta property="og:description" content="${meta}"><meta property="og:url" content="${canonical}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,600;0,800;1,400&family=Onest:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css?v=${BUILD_V}">
${NOINDEX ? '<meta name="robots" content="noindex">' : ""}
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
<div class="calc"><div class="calc__head">Калкулатор за мерки</div><div class="calc__body">
<div class="chips" id="chips"><button class="chip" data-amt="0.5">½ чаша</button><button class="chip" data-amt="1">1 чаша</button><button class="chip" data-amt="2">2 чаши</button></div>
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
  return `${head({ lang: p.lang, title: p.title, meta: p.meta, canonical: p.url })}
<script type="application/ld+json">${breadcrumbLd(p.breadcrumbs)}</script>
<script type="application/ld+json">${faqLd(p.faq)}</script>
</head><body><div class="wrap">
<header><a class="brand" href="/${p.lang}/"><span class="dot"></span>${t.brand}</a>
<nav class="crumbs" aria-label="breadcrumb">${crumbsHtml(p.breadcrumbs)}</nav></header>
<div class="hero"><h1>${p.h1}</h1><p class="answer">${p.answer}</p></div>
${calcMarkup(t, p.prefill)}
<div class="ad" role="complementary">РЕКЛАМА</div>
<section><h2>${p.tableTitle}</h2>
<div class="table-card"><table><thead><tr><th>${t.tbl_measure}</th><th>${t.tbl_weight}</th></tr></thead>
<tbody>${tableHtml(p.referenceRows)}</tbody></table></div></section>
<div class="affil"><span>${t.affil}</span><a href="#" rel="sponsored nofollow">${t.affil_link}</a></div>
<section class="explainer"><h2>${p.explainer.title}</h2>${p.explainer.paragraphs.map(x=>`<p>${x}</p>`).join("")}${trustLine(INGREDIENTS.find(i=>i.id===p.ingId), p.lang)}</section>
<section><h2>${t.faq_title}</h2>${p.faq.map(f=>`<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join("")}</section>
<section><a class="cta" href="${t.cta_url}">${t.cta}<small>${t.cta_sub}</small></a></section>
<section><h2>${t.related}</h2><div class="related">${p.related.map(r=>`<a href="${r.url}">${r.name}</a>`).join("")}</div></section>
<footer><p>${t.footer}</p></footer>
</div></body></html>`;
}

function renderHub(p) {
  const t = T[p.lang];
  return `${head({ lang: p.lang, title: p.title, meta: p.meta, canonical: p.url })}
<script type="application/ld+json">${breadcrumbLd(p.breadcrumbs)}</script>
<script type="application/ld+json">${itemListLd(p.questionPages)}</script>
${p.faq.length > 2 ? `<script type="application/ld+json">${faqLd(p.faq)}</script>` : ""}
</head><body><div class="wrap">
<header><a class="brand" href="/${p.lang}/"><span class="dot"></span>${t.brand}</a>
<nav class="crumbs" aria-label="breadcrumb">${crumbsHtml(p.breadcrumbs)}</nav></header>
<div class="hero"><h1>${p.h1}</h1>${p.desc ? `<p class="answer">${p.desc}</p>` : `<p class="intro">${p.intro}</p>`}</div>
${calcMarkup(t, p.prefill)}
<section><h2>${tmpl(t.quick, { ing: INGREDIENTS.find(i=>i.id===p.ingId).names[p.lang] })}</h2>
<div class="qa-grid">${p.questionPages.map(q=>`<a class="qa-card" href="${q.url}"><b>${q.name}</b><span class="v">${q.value}</span></a>`).join("")}</div></section>
<div class="ad" role="complementary">РЕКЛАМА</div>
<section><h2>${p.tableTitle}</h2>
<div class="table-card"><table><thead><tr><th>${t.tbl_measure}</th><th>${t.tbl_weight}</th></tr></thead>
<tbody>${tableHtml(p.referenceRows)}</tbody></table></div></section>
<div class="affil"><span>${t.affil}</span><a href="#" rel="sponsored nofollow">${t.affil_link}</a></div>
<section class="explainer"><h2>${p.explainer.title}</h2>${p.explainer.paragraphs.map(x=>`<p>${x}</p>`).join("")}${trustLine(INGREDIENTS.find(i=>i.id===p.ingId), p.lang)}</section>
${p.faq.length > 2 ? `<section><h2>${t.faq_title}</h2>${p.faq.map(f=>`<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join("")}</section>` : ""}
<section><a class="cta" href="${t.cta_url}">${t.cta}<small>${t.cta_sub}</small></a></section>
<section><h2>${t.related}</h2><div class="related">${p.related.map(r=>`<a href="${r.url}">${r.name}</a>`).join("")}</div></section>
<footer><p>${t.footer}</p></footer>
</div></body></html>`;
}

function renderPillar(p) {
  const t = T[p.lang];
  return `${head({ lang: p.lang, title: p.title, meta: p.meta, canonical: p.url })}
<script type="application/ld+json">${breadcrumbLd(p.breadcrumbs)}</script>
</head><body><div class="wrap">
<header><a class="brand" href="/${p.lang}/"><span class="dot"></span>${t.brand}</a>
<nav class="crumbs" aria-label="breadcrumb">${crumbsHtml(p.breadcrumbs)}</nav></header>
<div class="hero"><h1>${p.h1}</h1><p class="intro">${p.intro}</p></div>
<section><div class="qa-grid">${p.hubs.map(h=>`<a class="qa-card" href="${h.url}"><b>${h.name}</b><span class="v">${h.value}</span></a>`).join("")}</div></section>
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
<header><a class="brand" href="/${lang}/"><span class="dot"></span>${t.brand}</a>
<nav class="crumbs" aria-label="breadcrumb">${crumbsHtml(crumbs)}</nav></header>
<div class="hero"><h1>${t.scaler_h1}</h1><p class="lead">${t.scaler_lead}</p></div>
<div class="panel"><div class="panel__body">
<div class="tabs" role="tablist">
<button class="tab" id="tab-manual" role="tab" aria-selected="true">Въведи ръчно</button>
<button class="tab" id="tab-paste" role="tab" aria-selected="false">Постави рецепта</button>
</div>
<div id="paste-panel" hidden>
<textarea id="paste" placeholder="Постави съставките, по една на ред. Напр.:&#10;2 чаши брашно&#10;1 с.л. захар&#10;1/2 ч.л. сол&#10;250 г масло&#10;1 чаша мляко"></textarea>
<button class="add" id="parse-btn" style="margin-top:12px;border-style:solid">Анализирай и добави съставките</button>
<p class="hint">Разпознава дроби (1/2, 1½), диапазони (2–3) и мерки като чаша, с.л., ч.л., г, мл, cup, oz. Прегледай резултата по-долу.</p>
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

    // 3. Hub + question pages per ingredient
    for (const ing of INGREDIENTS) {
      const hub = computeHubPage(ing, lang);
      write(hubPath(lang, ing.id), renderHub(hub));
      sitemap.push({ loc: hub.url, alternates: [{ lang, href: hub.url }] });
      count++;

      for (const pair of getUnitPairs(ing)) {
        const page = computeQuestionPage(ing, pair, lang);
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
