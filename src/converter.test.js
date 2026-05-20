// Phase 2 success-criteria harness. Run: `node src/converter.test.js`.
// Maps 1-to-1 to the four Phase 2 ROADMAP success criteria and CONV-03/04/05/06 + TECH-06.

import { convert } from './converter.js';

let passed = 0;
let failed = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (ok) {
    passed++;
    console.log(`PASS  ${label}`);
  } else {
    failed++;
    console.log(`FAIL  ${label}`);
    console.log(`        expected: ${JSON.stringify(expected)}`);
    console.log(`        actual:   ${JSON.stringify(actual)}`);
  }
}

// --- CONV-05: comma and dot decimals normalize to the same result ---
check('CONV-05 "1,5" брашно супена лъжица',  convert('брашно', 'супена лъжица', '1,5'), '15 гр');
check('CONV-05 "1.5" брашно супена лъжица',  convert('брашно', 'супена лъжица', '1.5'), '15 гр');
check('CONV-05 leading-comma ",5" брашно ч.л.', convert('брашно', 'чаена лъжица', ',5'), '1.5 гр');
check('CONV-05 trailing-comma "2," брашно с.л.', convert('брашно', 'супена лъжица', '2,'), '20 гр');

// --- TECH-06: rounding kills floating-point artifacts AND integer suppression ---
// 2.25 × 10 = 22.5 → "22.5 гр"
check('TECH-06 22.5 stays 22.5', convert('брашно', 'супена лъжица', '2,25'), '22.5 гр');
// 2 × 10 = 20.0 → "20 гр" (NOT "20.0 гр")
check('TECH-06 integer suppression 20 not 20.0', convert('брашно', 'супена лъжица', '2'), '20 гр');
// 1 × 7 = 7.0 → "7 гр"
check('TECH-06 integer 7 not 7.0', convert('масло', 'чаена лъжица', '1'), '7 гр');
// floating noise: 1.5 × 8 = 12 (sol c.l.), already integer
check('TECH-06 1.5 × 8 сол = 12 гр', convert('сол', 'чаена лъжица', '1.5'), '12 гр');
// fractional that must keep 1 decimal: 1.3 × 30 = 39 (integer)
check('TECH-06 1.3 × 30 ориз = 39 гр', convert('ориз', 'супена лъжица', '1.3'), '39 гр');
// fractional that produces .X: 1.35 × 10 = 13.5
check('TECH-06 1.35 × 10 брашно = 13.5 гр', convert('брашно', 'супена лъжица', '1.35'), '13.5 гр');

// --- CONV-04: liquid ingredients render with мл, solids with гр ---
check('CONV-04 вода → мл',         convert('вода', 'супена лъжица', '3'),      '60 мл');
check('CONV-04 олио → мл',         convert('олио', 'чаена лъжица', '2'),       '10 мл');
check('CONV-04 прясно мляко → мл', convert('прясно мляко', 'чаена чаша', '1'), '250 мл');
check('CONV-04 оцет → мл',         convert('оцет', 'чаена лъжица', '1'),       '5 мл');
check('CONV-04 кисело мляко → гр', convert('кисело мляко', 'супена лъжица', '1'), '20 гр');
check('CONV-04 захар → гр',        convert('захар', 'чаена чаша', '1'),        '220 гр');

// --- CONV-06: null leaf → friendly Bulgarian message (never null/0/blank) ---
check('CONV-06 мед ч.л.',       convert('мед', 'чаена лъжица', '1'),      'Тази мярка не се използва за мед');
check('CONV-06 грис с.л.',      convert('грис', 'супена лъжица', '2'),    'Тази мярка не се използва за грис');
check('CONV-06 леща ч.л.',      convert('леща', 'чаена лъжица', '5'),     'Тази мярка не се използва за леща');
check('CONV-06 варен фасул с.л.', convert('варен фасул', 'супена лъжица', '3'), 'Тази мярка не се използва за варен фасул');
check('CONV-06 нишесте ч.ч.',   convert('нишесте', 'чаена чаша', '1'),    'Тази мярка не се използва за нишесте');
check('CONV-06 оцет к.ч.',      convert('оцет', 'кафена чаша', '1'),      'Тази мярка не се използва за оцет');

// --- Empty / zero / negative / non-numeric (UI-SPEC Copywriting Contract) ---
check('Empty input → ""',          convert('брашно', 'супена лъжица', ''),     '');
check('Whitespace input → ""',     convert('брашно', 'супена лъжица', '   '),  '');
check('Zero → guidance message',   convert('брашно', 'супена лъжица', '0'),    'Моля, въведете число по-голямо от нула');
check('Zero with comma → guidance', convert('брашно', 'супена лъжица', '0,0'), 'Моля, въведете число по-голямо от нула');
check('Negative → guidance',       convert('брашно', 'супена лъжица', '-2'),   'Моля, въведете число по-голямо от нула');
check('Non-numeric → "число"',     convert('брашно', 'супена лъжица', 'abc'),  'Моля, въведете число');
check('Double dash → "число"',     convert('брашно', 'супена лъжица', '--'),   'Моля, въведете число');

// --- Defensive: unknown ingredient or unknown unit ---
check('Unknown ingredient',  convert('боза', 'супена лъжица', '1'),         'Непозната комбинация');
check('Unknown unit',        convert('брашно', 'мерителна чашка', '1'),     'Непозната комбинация');

// --- Numeric quantity arg also accepted (defensive: Phase 3 may pass parsed number) ---
check('Numeric arg 2 → "20 гр"', convert('брашно', 'супена лъжица', 2), '20 гр');

console.log('');
console.log(`Total: ${passed + failed}  passed: ${passed}  failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
