/**
 * build.mjs — programmatic SEO page generator
 * ---------------------------------------------------------------------------
 * Generates, per language:
 *   • one hub page per ingredient            → /{lang}/merki/{id}/index.html
 *   • one question page per ingredient×pair   → /{lang}/merki/{id}/{from}-v-{to}/index.html
 *   • a sitemap.xml with hreflang alternates
 *
 * Run:  node build.mjs            (writes to ./dist)
 *
 * Architecture: the DATA LAYER below is language-independent at its core
 * (density is physics, not language). To launch a new market you add a language
 * code to LANGS and a localized name/string set — no new code.
 *
 * Before running: extract the <style> and calculator <script> from the two HTML
 * templates into /assets/site.css and /assets/calc.js, and copy /assets into ./dist.
 * The render functions below link those shared files (cached once across all pages).
 * ---------------------------------------------------------------------------
 */

import { writeFileSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";

/* ===========================================================================
   CONFIG
   =========================================================================== */
const SITE = { domain: "https://example.com", outDir: "dist", brandKey: "brand" };
const LANGS = ["bg"]; // add "sr", "ro", "mk", "el" … later — same engine

/* ===========================================================================
   DATA LAYER
   density = grams per millilitre (verify against authoritative sources!).
   names: lowercase, used inside sentences. names_title: for headings if needed.
   =========================================================================== */
const INGREDIENTS = [
  { id: "brashno",     density: 0.50, names: { bg: "брашно" } },
  { id: "zahar",       density: 0.85, names: { bg: "захар" } },
  { id: "pudra-zahar", density: 0.50, names: { bg: "пудра захар" } },
  { id: "oriz",        density: 0.78, names: { bg: "ориз" } },
  { id: "kakao",       density: 0.36, names: { bg: "какао" } },
  { id: "oves",        density: 0.38, names: { bg: "овесени ядки" } },
  { id: "mlyako",      density: 1.03, names: { bg: "мляко" } },
  { id: "olio",        density: 0.92, names: { bg: "олио" } },
  { id: "maslo",       density: 0.96, names: { bg: "масло" } },
  { id: "med",         density: 1.42, names: { bg: "мед" } },
  { id: "sol",         density: 1.20, names: { bg: "сол" } },
  { id: "voda",        density: 1.00, names: { bg: "вода" } },
];

// Units. Volume units carry ml; mass units carry g. slug + per-language labels.
const UNITS = {
  chasha: { ml: 250, slug: "chasha",            label: { bg: "чаша" }, label_pl: { bg: "чаши" } },
  sl:     { ml: 15,  slug: "supena-lazhica",    label: { bg: "супена лъжица" }, abbr: { bg: "с.л." } },
  chl:    { ml: 5,   slug: "chaena-lazhichka",  label: { bg: "чаена лъжичка" }, abbr: { bg: "ч.л." } },
  g:      { g: 1,    slug: "gramove",           label: { bg: "грам" }, gen: { bg: "грама" } },
  ml:     { ml: 1,   slug: "ml",                label: { bg: "милилитър" }, gen: { bg: "милилитра" } },
};

// Which conversions become their own pages (high-intent, ingredient-specific).
const UNIT_PAIRS = [
  { from: "chasha", to: "g" },
  { from: "sl",     to: "g" },
  { from: "chl",    to: "g" },
];

// Per-language micro-copy and sentence templates. Add a block per new language.
const T = {
  bg: {
    brand: "Мерки",
    home: "Начало",
    section: "Мерни единици",
    cup_note_ml: 250, // which "cup" the site assumes
    // {ing}=name, {ml}=volume, {n}=number, {unit}=unit phrase
    q_h1:   (unitPhrase, ing) => `Колко грама е една ${unitPhrase} ${ing}?`,
    q_ans:  (unitPhrase, ml, ing, n) => `Една ${unitPhrase} (${ml} мл) ${ing} тежи около ${n} грама.`,
    q_meta: (unitPhrase, ing, n) => `Една ${unitPhrase} ${ing} тежи около ${n} г. Калкулатор и таблица за чаши, лъжици и грамове.`,
    hub_h1:   (ing) => `${cap(ing)}: чаши, лъжици и грамове`,
    hub_meta: (ing) => `Колко тежи ${ing}? Калкулатор и таблица за чаши, супени и чаени лъжици в грамове.`,
    hub_intro:(ing) => `Колко грама е една чаша ${ing}, колко тежи една лъжица — изчисли наведнъж или виж таблицата по-долу.`,
    tbl_measure: "Мярка", tbl_weight: "Тегло",
    quick: (ing) => `Бързи отговори за ${ing}`,
    table_title: (ing) => `Таблица: ${ing} в грамове`,
    faq_title: "Често задавани въпроси",
    faq1_q: (ing) => `Колко грама ${ing} има в една супена лъжица?`,
    faq1_a: (ing, n) => `Една супена лъжица (15 мл) ${ing} тежи около ${n} грама.`,
    faq2_q: (ing) => `Колко чаши ${ing} са 500 грама?`,
    faq2_a: (ing, n) => `500 грама ${ing} са приблизително ${n} ${n === 1 ? "чаша" : "чаши"}.`,
    cta: "Преобразувай цяла рецепта наведнъж",
    cta_sub: "Всички мерки в грамове + смяна на порциите",
    cta_url: "/bg/preobrazuvane-na-recepta/",
    related: "Други съставки",
    affil: "За точни мерки при печене най-сигурна е кухненската везна.",
    affil_link: "Виж везни →",
    footer: "Мерки · Кухненски калкулатор за грамове и милилитри. Стойностите са приблизителни.",
    arrow_to: "грамове",
  },
};

/* ===========================================================================
   HELPERS
   =========================================================================== */
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// sensible cooking rounding for display
function round(n) {
  if (!isFinite(n)) return n;
  if (n >= 100) return Math.round(n);
  if (n >= 10)  return Math.round(n * 10) / 10;
  return Math.round(n * 100) / 100;
}
const gramsFromVolume = (ml, density) => ml * density;

const baseUrl = (lang, ...parts) => `${SITE.domain}/${lang}/${parts.join("/")}/`.replace(/\/+/g, "/").replace(":/", "://");
const hubPath  = (lang, id)         => join(SITE.outDir, lang, "merki", id, "index.html");
const pagePath = (lang, id, slug)   => join(SITE.outDir, lang, "merki", id, slug, "index.html");

function unitPhrase(unitKey, lang) {
  const u = UNITS[unitKey];
  return u.label[lang];
}

/* ===========================================================================
   PER-PAGE COMPUTATION
   =========================================================================== */
function computeReferenceRows(density, lang) {
  const c = UNITS.chasha.ml, sl = UNITS.sl.ml, chl = UNITS.chl.ml;
  const g = (ml) => `≈ ${round(gramsFromVolume(ml, density))} г`;
  return [
    { label: "¼ чаша", value: g(c * 0.25) },
    { label: "⅓ чаша", value: g(c / 3) },
    { label: "½ чаша", value: g(c * 0.5) },
    { label: "1 чаша", value: g(c) },
    { label: "2 чаши", value: g(c * 2) },
    { label: "1 супена лъжица (с.л.)", value: g(sl) },
    { label: "1 чаена лъжичка (ч.л.)", value: g(chl) },
  ];
}

function computeQuestionPage(ing, pair, lang) {
  const t = T[lang];
  const name = ing.names[lang];
  const fromU = UNITS[pair.from];
  const ml = fromU.ml;
  const grams = round(gramsFromVolume(ml, ing.density));
  const phrase = unitPhrase(pair.from, lang);
  const slug = `${fromU.slug}-v-${UNITS[pair.to].slug}`;
  const url = baseUrl(lang, "merki", ing.id, slug);

  // FAQ (computed)
  const slGrams = round(gramsFromVolume(UNITS.sl.ml, ing.density));
  const cupsIn500 = round((500 / ing.density) / UNITS.chasha.ml);

  return {
    lang, url, slug, ingId: ing.id,
    title: `${t.q_h1(phrase, name)} | ${t.brand}`,
    meta: t.q_meta(phrase, name, grams),
    h1: t.q_h1(phrase, name),
    answer: t.q_ans(phrase, ml, name, grams),
    breadcrumbs: [
      { name: t.home, url: baseUrl(lang) },
      { name: t.section, url: baseUrl(lang, "merki") },
      { name: cap(name), url: baseUrl(lang, "merki", ing.id) },
      { name: `${cap(phrase)} в грамове`, url: "" },
    ],
    prefill: { ing: ing.id, from: pair.from, to: pair.to, amt: 1 },
    referenceRows: computeReferenceRows(ing.density, lang),
    faq: [
      { q: t.faq1_q(name), a: t.faq1_a(name, slGrams) },
      { q: t.faq2_q(name), a: t.faq2_a(name, cupsIn500) },
    ],
    related: relatedFor(ing, lang, slug),
  };
}

function computeHubPage(ing, lang) {
  const t = T[lang];
  const name = ing.names[lang];
  const questionPages = UNIT_PAIRS.map((pair) => {
    const fromU = UNITS[pair.from];
    const grams = round(gramsFromVolume(fromU.ml, ing.density));
    return {
      name: `${cap(unitPhrase(pair.from, lang))} → грамове`,
      value: `≈ ${grams} г`,
      url: baseUrl(lang, "merki", ing.id, `${fromU.slug}-v-${UNITS[pair.to].slug}`),
    };
  });
  return {
    lang, ingId: ing.id, url: baseUrl(lang, "merki", ing.id),
    title: `${t.hub_h1(name)} | ${t.brand}`,
    meta: t.hub_meta(name),
    h1: t.hub_h1(name),
    intro: t.hub_intro(name),
    breadcrumbs: [
      { name: t.home, url: baseUrl(lang) },
      { name: t.section, url: baseUrl(lang, "merki") },
      { name: cap(name), url: "" },
    ],
    prefill: { ing: ing.id, from: "chasha", to: "g", amt: 1 },
    questionPages,
    referenceRows: computeReferenceRows(ing.density, lang),
    related: relatedFor(ing, lang, null),
  };
}

function relatedFor(ing, lang, currentSlug) {
  return INGREDIENTS.filter((x) => x.id !== ing.id).slice(0, 5).map((x) => ({
    name: cap(x.names[lang]),
    url: currentSlug
      ? baseUrl(lang, "merki", x.id, currentSlug) // sibling question page
      : baseUrl(lang, "merki", x.id),             // sibling hub
  }));
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
const head = ({ lang, title, meta, canonical }) => `<!DOCTYPE html>
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
<link rel="stylesheet" href="/assets/site.css">`;

const crumbsHtml = (crumbs) => crumbs.map((c, i) =>
  (c.url ? `<a href="${c.url}">${c.name}</a>` : `<span class="here">${c.name}</span>`) +
  (i < crumbs.length - 1 ? `<span class="sep">›</span>` : "")
).join("");

const tableHtml = (rows) =>
  rows.map((r) => `<tr><td>${r.label}</td><td>${r.value}</td></tr>`).join("");

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
<script>window.__PREFILL__=${JSON.stringify(prefill)};</script>
<script src="/assets/calc.js" defer></script>`;

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
<section><h2>${cap(INGREDIENTS.find(i=>i.id===p.ingId).names[p.lang])}: чаши и лъжици в грамове</h2>
<div class="table-card"><table><thead><tr><th>${t.tbl_measure}</th><th>${t.tbl_weight}</th></tr></thead>
<tbody>${tableHtml(p.referenceRows)}</tbody></table></div></section>
<div class="affil"><span>${t.affil}</span><a href="#" rel="sponsored nofollow">${t.affil_link}</a></div>
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
</head><body><div class="wrap">
<header><a class="brand" href="/${p.lang}/"><span class="dot"></span>${t.brand}</a>
<nav class="crumbs" aria-label="breadcrumb">${crumbsHtml(p.breadcrumbs)}</nav></header>
<div class="hero"><h1>${p.h1}</h1><p class="intro">${p.intro}</p></div>
${calcMarkup(t, p.prefill)}
<section><h2>${t.quick(INGREDIENTS.find(i=>i.id===p.ingId).names[p.lang])}</h2>
<div class="qa-grid">${p.questionPages.map(q=>`<a class="qa-card" href="${q.url}"><b>${q.name}</b><span class="v">${q.value}</span></a>`).join("")}</div></section>
<div class="ad" role="complementary">РЕКЛАМА</div>
<section><h2>${t.table_title(INGREDIENTS.find(i=>i.id===p.ingId).names[p.lang])}</h2>
<div class="table-card"><table><thead><tr><th>${t.tbl_measure}</th><th>${t.tbl_weight}</th></tr></thead>
<tbody>${tableHtml(p.referenceRows)}</tbody></table></div></section>
<div class="affil"><span>${t.affil}</span><a href="#" rel="sponsored nofollow">${t.affil_link}</a></div>
<section><a class="cta" href="${t.cta_url}">${t.cta}<small>${t.cta_sub}</small></a></section>
<section><h2>${t.related}</h2><div class="related">${p.related.map(r=>`<a href="${r.url}">${r.name}</a>`).join("")}</div></section>
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
  const sitemap = [];
  let count = 0;

  for (const lang of LANGS) {
    for (const ing of INGREDIENTS) {
      // hub
      const hub = computeHubPage(ing, lang);
      write(hubPath(lang, ing.id), renderHub(hub));
      sitemap.push({ loc: hub.url, alternates: [{ lang, href: hub.url }] });
      count++;

      // question pages
      for (const pair of UNIT_PAIRS) {
        const page = computeQuestionPage(ing, pair, lang);
        write(pagePath(lang, ing.id, page.slug), renderQuestion(page));
        sitemap.push({ loc: page.url, alternates: [{ lang, href: page.url }] });
        count++;
      }
    }
  }

  write(join(SITE.outDir, "sitemap.xml"), renderSitemap(sitemap));

  // copy shared assets if present
  if (existsSync("assets")) cpSync("assets", join(SITE.outDir, "assets"), { recursive: true });

  console.log(`✓ ${count} pages across ${LANGS.length} language(s)`);
  console.log(`✓ sitemap.xml with ${sitemap.length} URLs`);
  console.log(`→ output in ./${SITE.outDir}`);
  console.log(`  (${INGREDIENTS.length} ingredients × (1 hub + ${UNIT_PAIRS.length} pages) = ${INGREDIENTS.length * (1 + UNIT_PAIRS.length)} per language)`);
}

build();
