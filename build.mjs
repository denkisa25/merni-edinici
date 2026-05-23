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

import { writeFileSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";

/* ===========================================================================
   CONFIG
   =========================================================================== */
const SITE = { domain: "https://merilo.pro", outDir: "dist", brandKey: "brand" };
const LANGS = ["bg"]; // add "sr", "ro", "mk", "el" … later — same engine

const ENVIRONMENT = "experiment"; // flip to "live" to enable indexing
const NOINDEX = ENVIRONMENT === "experiment";

/* ===========================================================================
   DATA LAYER
   density = grams per millilitre (verify against authoritative sources!).
   names: lowercase, used inside sentences.
   =========================================================================== */
const INGREDIENTS = [
  { id: "brashno",               density: 0.50, names: { bg: "брашно" },               note: { bg: 'Брашното е „пухкаво" и задържа въздух, затова една чаша пресято брашно тежи по-малко от натъпкано.' } },
  { id: "zahar",                 density: 0.85, names: { bg: "захар" },                 note: { bg: "Кристалната захар е по-плътна, затова една чаша тежи доста повече от чаша брашно." } },
  { id: "pudra-zahar",           density: 0.50, names: { bg: "пудра захар" },           note: { bg: "Пудрата захар е лека и често се сляга — пресявайте я за по-точно мерене." } },
  { id: "kafyava-zahar",         density: 0.90, names: { bg: "кафява захар" },          note: { bg: "Кафявата захар се натъпква в чашата, затова тежи повече от кристалната." } },
  { id: "oriz",                  density: 0.78, names: { bg: "ориз" },                  note: { bg: "Сухият ориз е плътен и се сляга в чашата; при варене обемът му нараства 2–3 пъти, но ориентир остава теглото на сухия." } },
  { id: "bulgur",                density: 0.78, names: { bg: "булгур" },                note: { bg: "Сухият булгур е плътен; при варене обемът му нараства неколкократно." } },
  { id: "gris",                  density: 0.67, names: { bg: "грис" },                  note: { bg: "Грисът е ситен и се сипе плътно, без много въздух между зрънцата." } },
  { id: "kakao",                 density: 0.36, names: { bg: "какао" },                 note: { bg: "Какаото е леко и лесно се сбива на бучки — пресявайте го, за да не го натъпчете в чашата." } },
  { id: "oves",                  density: 0.38, names: { bg: "овесени ядки" },          note: { bg: "Овесените ядки са люспести и между тях има много въздух, затова една чаша тежи изненадващо малко." } },
  { id: "nisheste",              density: 0.52, names: { bg: "нишесте" },               note: { bg: "Нишестето е леко и пухкаво и лесно се сбива — разрохквайте го преди мерене." } },
  { id: "palnozarnesto-brashno", density: 0.55, names: { bg: "пълнозърнесто брашно" }, note: { bg: "Малко по-тежко от бялото брашно заради триците, които съдържа." } },
  { id: "carevichno-brashno",    density: 0.60, names: { bg: "царевично брашно" },      note: { bg: "По-плътно от пшеничното, със ситна, песъчлива структура." } },
  { id: "mlyako",                density: 1.03, names: { bg: "мляко" },                 note: { bg: "Млякото е течност — теглото в грамове е почти равно на обема в милилитри (1 чаша ≈ 250 г)." } },
  { id: "kiselo-mlyako",         density: 1.03, names: { bg: "кисело мляко" },          note: { bg: "Гъсто е и тежи почти колкото водата (1 чаша ≈ 258 г)." } },
  { id: "zakvasena-smetana",     density: 0.96, names: { bg: "заквасена сметана" },     note: { bg: "Гъста млечна съставка — мери се добре с лъжица или чаша." } },
  { id: "olio",                  density: 0.92, names: { bg: "олио" },                  note: { bg: "Олиото е малко по-леко от водата, затова една чаша тежи малко под 250 г." } },
  { id: "maslo",                 density: 0.96, names: { bg: "масло" },                 note: { bg: "Стойностите са за разтопено масло; твърдото масло обикновено се мери на блокчета или по грамажа на опаковката." } },
  { id: "med",                   density: 1.42, names: { bg: "мед" },                   note: { bg: "Медът е гъст и тежък — една чаша мед тежи значително повече от чаша вода." } },
  { id: "klenov-sirop",          density: 1.32, names: { bg: "кленов сироп" },          note: { bg: "Сиропът е гъст и тежък — една чаша тежи доста повече от чаша вода." } },
  { id: "sol",                   density: 1.20, names: { bg: "сол" },                   note: { bg: "Солта е тежка и плътна; фината сол се сбива повече от едрата, затова за точност я мерете на грамове." } },
  { id: "soda",                  density: 0.92, names: { bg: "сода бикарбонат" },       note: { bg: "Използва се в малки количества — една чаена лъжичка тежи около 5 г." } },
  { id: "bakpulver",             density: 0.80, names: { bg: "бакпулвер" },             note: { bg: "Мери се на лъжички — една чаена лъжичка е около 4 г." } },
  { id: "lesha",                 density: 0.85, names: { bg: "леща" },                  note: { bg: "Стойностите са за суха леща — сварена набъбва около 2–3 пъти." } },
  { id: "orehi",                 density: 0.50, names: { bg: "орехи" },                 note: { bg: "За едро счукани орехи; целите ядки заемат повече място и тежат по-малко на чаша." } },
  { id: "stafidi",               density: 0.62, names: { bg: "стафиди" },               note: { bg: "Стафидите са лепкави и се сбиват леко в чашата." } },
  { id: "kokos",                 density: 0.35, names: { bg: "кокосови стърготини" },   note: { bg: "Много леки и обемисти — една чаша тежи съвсем малко." } },
  { id: "ocet",                  density: 1.01, names: { bg: "оцет" },                  note: { bg: "Оцетът е течност с тегло, почти равно на това на водата." } },
  { id: "voda",                  density: 1.00, names: { bg: "вода" },                  note: { bg: "Водата е еталонът: 1 мл тежи точно 1 г, затова 1 чаша (250 мл) е 250 г." } },
];

// Units. slug/label used for SEO URLs and sentences; c used for calculator/scaler UI labels.
const UNITS = {
  chasha: { ml: 250,     slug: "chasha",           label: { bg: "чаша" },            label_pl: { bg: "чаши" }, c: { bg: "чаша" } },
  sl:     { ml: 15,      slug: "supena-lazhica",   label: { bg: "супена лъжица" },   abbr: { bg: "с.л." },     c: { bg: "с.л." } },
  chl:    { ml: 5,       slug: "chaena-lazhichka", label: { bg: "чаена лъжичка" },   abbr: { bg: "ч.л." },     c: { bg: "ч.л." } },
  ml:     { ml: 1,       slug: "ml",               label: { bg: "милилитър" },       gen: { bg: "милилитра" }, c: { bg: "мл" } },
  l:      { ml: 1000,    slug: "l",                label: { bg: "литър" },                                     c: { bg: "л" } },
  cup_us: { ml: 240,     slug: "cup",              label: { bg: "американска чаша" },                          c: { bg: "cup (US)" } },
  floz:   { ml: 29.5735, slug: "fl-oz",            label: { bg: "течна унция" },                               c: { bg: "fl oz" } },
  g:      { g: 1,        slug: "gramove",          label: { bg: "грам" },            gen: { bg: "грама" },     c: { bg: "г" } },
  kg:     { g: 1000,     slug: "kg",               label: { bg: "килограм" },                                  c: { bg: "кг" } },
  oz:     { g: 28.3495,  slug: "oz",               label: { bg: "унция" },                                     c: { bg: "oz" } },
  lb:     { g: 453.592,  slug: "lb",               label: { bg: "паунд" },                                     c: { bg: "lb" } },
};

// Order units appear in the calculator/scaler UI (emitted into data.{lang}.js).
const CLIENT_UNIT_ORDER = ["chasha", "sl", "chl", "ml", "l", "cup_us", "floz", "g", "kg", "oz", "lb"];

// Anchor amount (grams) for reverse mass→volume question pages.
const REV_ANCHOR = 100;

// Which conversions become their own pages (high-intent, ingredient-specific).
const UNIT_PAIRS = [
  { from: "chasha", to: "g" },
  { from: "sl",     to: "g" },
  { from: "chl",    to: "g" },
  { from: "g",      to: "chasha" }, // reverse: "Колко чаши са 100 грама X?"
];

// Per-language micro-copy and sentence templates. Add a block per new language.
const T = {
  bg: {
    brand: "Мерки",
    home: "Начало",
    section: "Мерни единици",
    cup_note_ml: 250,
    // {ing}=name, {ml}=volume, {n}=number, {unit}=unit phrase
    q_h1:   (unitPhrase, ing) => `Колко грама е една ${unitPhrase} ${ing}?`,
    q_ans:  (unitPhrase, ml, ing, n) => `Една ${unitPhrase} (${ml} мл) ${ing} тежи около ${num(n)} грама.`,
    q_meta: (unitPhrase, ing, n) => `Една ${unitPhrase} ${ing} тежи около ${num(n)} г. Калкулатор и таблица за чаши, лъжици и грамове.`,
    qr_h1:   (toPl, ing, anchor) => `Колко ${toPl} са ${anchor} грама ${ing}?`,
    qr_ans:  (toPl, ing, anchor, n) => `${anchor} грама ${ing} са приблизително ${num(n)} ${toPl}.`,
    qr_meta: (toPl, ing, anchor, n) => `${anchor} грама ${ing} са около ${num(n)} ${toPl}. Калкулатор за грамове, чаши и лъжици.`,
    qr_crumb:(toPl, anchor) => `${anchor} г в ${toPl}`,
    hub_h1:   (ing) => `${cap(ing)}: чаши, лъжици и грамове`,
    hub_meta: (ing) => `Колко тежи ${ing}? Калкулатор и таблица за чаши, супени и чаени лъжици в грамове.`,
    hub_intro:(ing) => `Колко грама е една чаша ${ing}, колко тежи една лъжица — изчисли наведнъж или виж таблицата по-долу.`,
    pillar_h1:    "Мерни единици в кухнята",
    pillar_meta:  "Калкулатор и таблици за брашно, захар, ориз и още съставки — чаши, лъжици в грамове.",
    pillar_intro: "Изберете съставка, за да видите точните тегла в чаши, супени и чаени лъжички.",
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
    scaler_title: "Преобразувай цяла рецепта — мерки в грамове",
    scaler_meta:  "Постави рецепта или въведи съставките и я преобразувай в грамове наведнъж. Смяна на порциите и готов списък за пазаруване.",
    scaler_h1:   "Преобразувай цяла рецепта",
    scaler_lead: "Постави рецепта или въведи съставките — и ги получаваш в грамове наведнъж, със смяна на порциите и готов списък за пазаруване.",
    explainer_title: "Защо теглото варира",
    explainer_generic: (ing) => `Когато мерите ${ing} по обем, точното тегло зависи от това колко плътно е натъпкана съставката — затова за прецизност при печене грамовете са по-надеждни от чашите.`,
    explainer_cup: 'Имайте предвид и коя „чаша" ползвате: българската водна чаша е около 250 мл, а американската мерителна чаша (cup) — 240 мл. Този калкулатор смята спрямо 250 мл.',
  },
};

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
    ingredients[ing.id] = { name: ing.names[lang], density: ing.density };
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
function computeReferenceRows(density) {
  const c = UNITS.chasha.ml, sl = UNITS.sl.ml, chl = UNITS.chl.ml;
  const g = (ml) => `≈ ${num(round(gramsFromVolume(ml, density)))} г`;
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

function pairCard(ing, pair, lang) {
  const fromU = UNITS[pair.from], toU = UNITS[pair.to];
  if (typeof fromU.ml === "number" && typeof toU.g === "number") {
    const grams = round(gramsFromVolume(fromU.ml, ing.density));
    const slug = `${fromU.slug}-v-${toU.slug}`;
    return { dir: "v2m", slug, name: `${cap(unitPhrase(pair.from, lang))} → грамове`,
             value: `≈ ${num(grams)} г`, url: baseUrl(lang, "merki", ing.id, slug) };
  }
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
  const faq = [
    { q: t.faq1_q(name), a: t.faq1_a(name, slGrams) },
    { q: t.faq2_q(name), a: t.faq2_a(name, cupsIn500) },
  ];

  let title, meta, h1, answer, crumbLeaf, prefill;
  if (card.dir === "v2m") {
    const ml = fromU.ml, grams = round(gramsFromVolume(ml, ing.density)), phrase = unitPhrase(pair.from, lang);
    h1 = t.q_h1(phrase, name);
    title = `${h1} | ${t.brand}`;
    meta = t.q_meta(phrase, name, grams);
    answer = t.q_ans(phrase, ml, name, grams);
    crumbLeaf = `${cap(phrase)} в грамове`;
    prefill = { ing: ing.id, from: pair.from, to: pair.to, amt: 1 };
  } else {
    const toPl = (toU.label_pl && toU.label_pl[lang]) || toU.label[lang];
    const nVol = round((REV_ANCHOR / ing.density) / toU.ml);
    h1 = t.qr_h1(toPl, name, REV_ANCHOR);
    title = `${h1} | ${t.brand}`;
    meta = t.qr_meta(toPl, name, REV_ANCHOR, nVol);
    answer = t.qr_ans(toPl, name, REV_ANCHOR, nVol);
    crumbLeaf = t.qr_crumb(toPl, REV_ANCHOR);
    prefill = { ing: ing.id, from: pair.from, to: pair.to, amt: REV_ANCHOR };
  }

  return {
    lang, url, slug, ingId: ing.id, title, meta, h1, answer,
    breadcrumbs: [
      { name: t.home, url: baseUrl(lang) },
      { name: t.section, url: baseUrl(lang, "merki") },
      { name: cap(name), url: baseUrl(lang, "merki", ing.id) },
      { name: crumbLeaf, url: "" },
    ],
    prefill,
    referenceRows: computeReferenceRows(ing.density),
    faq,
    related: relatedFor(ing, lang, slug),
    explainer: buildExplainer(ing, lang),
  };
}

function computeHubPage(ing, lang) {
  const t = T[lang];
  const name = ing.names[lang];
  const questionPages = UNIT_PAIRS.map((pair) => {
    const c = pairCard(ing, pair, lang);
    return { name: c.name, value: c.value, url: c.url };
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
    referenceRows: computeReferenceRows(ing.density),
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
  return INGREDIENTS.filter((x) => x.id !== ing.id).slice(0, 5).map((x) => ({
    name: cap(x.names[lang]),
    url: currentSlug
      ? baseUrl(lang, "merki", x.id, currentSlug)
      : baseUrl(lang, "merki", x.id),
  }));
}

function buildExplainer(ing, lang) {
  const t = T[lang];
  const paragraphs = [];
  if (ing.note && ing.note[lang]) paragraphs.push(ing.note[lang]);
  paragraphs.push(t.explainer_generic(ing.names[lang]));
  paragraphs.push(t.explainer_cup);
  return { title: t.explainer_title, paragraphs };
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
<link rel="stylesheet" href="/assets/site.css">
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
<section><h2>${cap(INGREDIENTS.find(i=>i.id===p.ingId).names[p.lang])}: чаши и лъжици в грамове</h2>
<div class="table-card"><table><thead><tr><th>${t.tbl_measure}</th><th>${t.tbl_weight}</th></tr></thead>
<tbody>${tableHtml(p.referenceRows)}</tbody></table></div></section>
<div class="affil"><span>${t.affil}</span><a href="#" rel="sponsored nofollow">${t.affil_link}</a></div>
<section class="explainer"><h2>${p.explainer.title}</h2>${p.explainer.paragraphs.map(x=>`<p>${x}</p>`).join("")}</section>
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
<section class="explainer"><h2>${p.explainer.title}</h2>${p.explainer.paragraphs.map(x=>`<p>${x}</p>`).join("")}</section>
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

      for (const pair of UNIT_PAIRS) {
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
  const htaccess = "DirectoryIndex index.html\nOptions -Indexes\n";
  const rootHtaccess = `DirectoryIndex index.html\nOptions -Indexes\nRedirectMatch 301 ^/$ /bg/merki/\n`;
  write(join(SITE.outDir, ".htaccess"), rootHtaccess);
  write(join(SITE.outDir, "bg", ".htaccess"), htaccess);

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
