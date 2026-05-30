/**
 * faqs.bg.js — Custom "value-add" FAQ for every ingredient (BG).
 * ---------------------------------------------------------------------------
 * Mirrors the style of data.bg.js: keyed by the SAME slugs as
 * window.__KITCHEN_DATA__.ingredients, so it lines up 1:1.
 *
 * Each entry is ONE extra question that gets appended AFTER the 3
 * auto-generated conversion FAQs your build already renders.
 *
 * The answer (`a`) is an HTML string — formatting (line breaks, <strong>,
 * <em>) is baked in so it renders correctly inside <p>…</p>.
 *
 * USAGE (build / page generator) ------------------------------------------
 *   import { renderFaqDetails, buildFaqJsonLd } from './faqs.bg.js';
 *
 *   // inside the loop that builds each ingredient page:
 *   faqListHtml += renderFaqDetails(slug);   // append the custom <details>
 *
 *   // optional, in <head>:
 *   const ld = buildFaqJsonLd(slug, autoFaqPairs); // autoFaqPairs optional
 *   if (ld) headHtml += `<script type="application/ld+json">${ld}</script>`;
 *
 * Plain <script> usage (no bundler): everything is also exposed on
 *   window.__KITCHEN_FAQS__  ->  { FAQS, renderFaqDetails, renderAllFaqDetails, buildFaqJsonLd }
 * ---------------------------------------------------------------------------
 */
(function (root) {
  'use strict';

  /** slug -> { q: string, a: htmlString } */
  var FAQS = {
    'brashno': {
      q: 'Кои са основните видове брашно в България?',
      a: 'Числото на типа показва пепелното съдържание в проценти — колкото е по-голямо, толкова по-тъмно и пълнозърнесто е брашното. Петте най-използвани са:<br>' +
         '<strong>тип 450</strong> — екстра фино, „козуначено“;<br>' +
         '<strong>тип 500</strong> — бяло, най-разпространено за всичко;<br>' +
         '<strong>тип 700</strong> „Добруджа“ — за домашен хляб;<br>' +
         '<strong>тип 1150</strong> — полупълнозърнесто, „типово“;<br>' +
         '<strong>тип 1850</strong> — пълнозърнесто (грахам).'
    },
    'nisheste': {
      q: 'Колко нишесте замества брашно при сгъстяване?',
      a: 'Нишестето сгъстява около <strong>2 пъти</strong> по-силно от брашното — 1 с.л. нишесте ≈ 2 с.л. брашно. Разбий го първо в малко студена вода („кашичка“), иначе се пресича на бучки.'
    },
    'palnozarnesto-brashno': {
      q: 'Защо чаша пълнозърнесто брашно тежи по-малко от бялото?',
      a: 'Смляно е по-едро и съдържа трици, които задържат повече въздух — <strong>~110 г</strong> срещу ~140 г при бялото. Поема и повече течност, затова тестото иска малко повече вода.'
    },
    'carevichno-brashno': {
      q: 'Едно и също ли са царевично брашно и царевично нишесте?',
      a: 'Не. <strong>Брашното</strong> е смляна цяла царевица — жълто, за качамак и мекици. <strong>Нишестето</strong> е бял прах само от сърцевината, за сгъстяване. Не са взаимозаменяеми.'
    },
    'voda': {
      q: 'Защо при водата 1 мл = 1 г, а при други съставки не?',
      a: 'Плътността на водата е точно <strong>1 г/мл</strong> — тя е еталонът. Олиото е по-леко (0,92), медът по-тежък (~1,4), затова при тях милилитрите и грамовете се разминават.'
    },
    'olio': {
      q: 'Колко грама е една чаша олио?',
      a: 'Около <strong>184 г</strong> — олиото е по-леко от водата (0,92 г/мл). За готвене разликата няма значение, за прецизно сладкарство я отчитай.'
    },
    'maslo': {
      q: 'Колко е „1 stick“ масло от чужда рецепта?',
      a: '1 американски stick = <strong>113 г</strong> (½ cup). Българският пакет е 125 г или 250 г, а 1 с.л. меко масло е ~14 г.'
    },
    'mlyako': {
      q: '100 мл прясно мляко колко грама са?',
      a: 'Около <strong>103 г</strong> — млякото е малко по-тежко от водата (1,03 г/мл). За повечето рецепти милилитрите и грамовете са взаимозаменяеми.'
    },
    'ocet': {
      q: 'Мога ли да заменя един оцет с друг в същото количество?',
      a: 'По обем — да, плътностите са близки до водата. Но киселинността е различна: винен и ябълков <strong>~5–6%</strong>, спиртен <strong>~9%</strong>. За туршии спазвай посочения вид.'
    },
    'zahar': {
      q: 'Защо чаша захар тежи повече от чаша брашно?',
      a: 'Кристалите са плътни и се подреждат без въздух (<strong>~220 г</strong>), докато пухкавото брашно е ~140 г. Затова не се заместват „чаша за чаша“.'
    },
    'pudra-zahar': {
      q: 'Мога ли да заменя кристална захар с пудра 1:1?',
      a: 'По <strong>тегло</strong> — да; по <strong>обем</strong> — не. Чаша пудра захар е ~150 г, а кристална ~220 г. Пудрата съдържа и малко нишесте против слепване, което влияе на глазури.'
    },
    'med': {
      q: 'Защо медът тежи почти двойно повече от водата?',
      a: 'Силно концентриран е (плътност ~1,4) — 1 с.л. мед е <strong>~21 г</strong>. Трик: намажи лъжицата с капка олио и медът се изхлузва чист.'
    },
    'kafyava-zahar': {
      q: 'Защо кафявата захар се мери „натъпкана“?',
      a: 'Съдържа меласа и влага и е лепкава — рохкаво насипана лъже мерката. Затова рецептите казват „пресована чаша“ (<strong>~180 г</strong>).'
    },
    'klenov-sirop': {
      q: 'Мога ли да заменя захарта с кленов сироп?',
      a: 'Да — около <strong>¾ чаша</strong> сироп на 1 чаша захар. Намали другата течност с ~60 мл и печи на малко по-ниска температура, защото сиропът загаря по-бързо.'
    },
    'lesha': {
      q: 'Удвоява ли се лещата при варене?',
      a: 'Да — 1 чаша суха леща (~200 г) дава <strong>~2,5 чаши</strong> сварена. Червената се разварява за крем-супи, зелената и кафявата държат форма за салати.'
    },
    'orehi': {
      q: 'Защо чаша цели орехи и чаша смлени тежат различно?',
      a: 'Смлените се подреждат по-плътно — цели <strong>~100 г</strong>, смлени до ~120 г на чаша. Виж дали рецептата иска „чаша орехи“ или „чаша смлени орехи“.'
    },
    'stafidi': {
      q: 'Защо стафидите потъват на дъното на кекса?',
      a: 'Тежки са спрямо рядкото тесто. <strong>Овъргаляй ги в малко брашно</strong> преди да ги добавиш — полепва по тях и ги задържа равномерно разпределени.'
    },
    'kokos': {
      q: 'Защо чаша кокосови стърготини тежи толкова малко?',
      a: 'Изсушени и фини, с много въздух между влакната — само <strong>~70 г</strong> на чаша. Затова в рецептите кокосът почти винаги се дава в грамове.'
    },
    'kiselo-mlyako': {
      q: 'Защо българското кисело мляко е по-гъсто и влияе ли на мерките?',
      a: 'Заради <strong><em>Lactobacillus bulgaricus</em></strong> — прави го плътно и почти без въздух, затова чаша тежи ~200 г. Мери го натъпкано, без джобове.'
    },
    'zakvasena-smetana': {
      q: 'Мога ли да заменя заквасена сметана с кисело мляко?',
      a: 'Да, почти <strong>1:1</strong> по обем в повечето рецепти. Сметаната е по-мазна; цедено кисело мляко е най-близкият по-лек заместител.'
    },
    'sol': {
      q: 'Защо лъжица фина сол не е равна на лъжица едра морска сол?',
      a: 'Между едрите кристали остава въздух — 1 ч.л. фина сол е <strong>~6 г</strong>, а едра морска <strong>~4–5 г</strong>. Рецепта за фина сол ще е по-блудкава с едра.'
    },
    'soda': {
      q: 'Каква е разликата между сода и бакпулвер?',
      a: 'Содата е чиста основа и иска нещо кисело (кисело мляко, оцет, лимон), за да набухне. Тя е <strong>3–4 пъти по-силна</strong> от бакпулвера — не ги замествай в равни количества.'
    },
    'bakpulver': {
      q: 'Как да си направя бакпулвер вкъщи?',
      a: 'Смеси <strong>½ ч.л. сода + 1 ч.л. винен камък</strong> (или ¼ ч.л. лимонтузу) — получаваш ~1,5 ч.л. бакпулвер. Използвай го веднага, реагира с влагата.'
    },
    'kakao': {
      q: 'Има ли значение дали какаото е натурално или алкализирано?',
      a: 'Да. <strong>Натуралното</strong> е кисело и работи със сода; <strong>алкализираното</strong> (тъмно/Dutch) е неутрално и иска бакпулвер. Объркаш ли ги, сладкишът може да не втаса.'
    },
    'oriz': {
      q: 'Едно и също количество ли е чаша кръгъл и чаша басмати ориз?',
      a: 'По обем — да (~220 г), но водата се различава: кръгъл <strong>~1:2</strong>, басмати <strong>~1:1,5</strong>. Затова „чаша ориз“ дава различен резултат според сорта.'
    },
    'gris': {
      q: 'Защо чаша грис тежи повече от чаша брашно?',
      a: 'Едро смлян от твърда пшеница, зрънцата са плътни и без въздух — <strong>~160 г</strong> срещу ~140 г при брашното. Не са взаимозаменяеми по обем.'
    },
    'bulgur': {
      q: 'Каква е разликата между булгур и грис?',
      a: '<strong>Булгурът</strong> е сварено, изсушено и натрошено пшеничено зърно — набъбва с вряла вода за таратор и салати. <strong>Грисът</strong> е сурово едро брашно за варене. 1 чаша сух булгур дава ~3 чаши готов.'
    },
    'oves': {
      q: 'Защо чаша овесени ядки тежи толкова малко?',
      a: 'Сплескани и леки, с много въздух — само <strong>~76 г</strong> на чаша. Финият (instant) овес е по-плътен от едрия старомоден, затова чаша от тях тежи различно.'
    }
  };

  // --- helpers --------------------------------------------------------------

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Strip tags + collapse whitespace -> plain text (for JSON-LD).
  function stripHtml(html) {
    return String(html)
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Returns the custom FAQ as a <details> block matching the existing markup,
   * or '' if the slug has no custom FAQ. The summary is escaped; the answer is
   * intentionally raw HTML.
   */
  function renderFaqDetails(slug) {
    var f = FAQS[slug];
    if (!f) return '';
    return '<details><summary>' + escapeHtml(f.q) + '</summary><p>' + f.a + '</p></details>';
  }

  /** { slug: '<details>…</details>' } for every entry — handy for batch builds. */
  function renderAllFaqDetails() {
    var out = {};
    Object.keys(FAQS).forEach(function (slug) { out[slug] = renderFaqDetails(slug); });
    return out;
  }

  /**
   * FAQPage JSON-LD string for a slug. Optionally pass the 3 auto-generated
   * conversion FAQs as autoFaqPairs = [{q, a}, …] to include them in the schema.
   * Answers are flattened to plain text. Returns '' if nothing to emit.
   */
  function buildFaqJsonLd(slug, autoFaqPairs) {
    var pairs = (autoFaqPairs || []).slice();
    var extra = FAQS[slug];
    if (extra) pairs.push({ q: extra.q, a: extra.a });
    if (!pairs.length) return '';
    var entities = pairs.map(function (p) {
      return {
        '@type': 'Question',
        name: stripHtml(p.q),
        acceptedAnswer: { '@type': 'Answer', text: stripHtml(p.a) }
      };
    });
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: entities
    });
  }

  var api = {
    FAQS: FAQS,
    renderFaqDetails: renderFaqDetails,
    renderAllFaqDetails: renderAllFaqDetails,
    buildFaqJsonLd: buildFaqJsonLd,
    stripHtml: stripHtml
  };

  // Plain <script> / classic build script (same pattern as data.bg.js)
  root.__KITCHEN_FAQS__ = api;

  // Node build (CommonJS). Object literal so Node's ESM interop can also
  // expose NAMED imports, e.g.  import { renderFaqDetails } from './faqs.bg.js'
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      FAQS: FAQS,
      renderFaqDetails: renderFaqDetails,
      renderAllFaqDetails: renderAllFaqDetails,
      buildFaqJsonLd: buildFaqJsonLd,
      stripHtml: stripHtml
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
