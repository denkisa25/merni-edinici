// src/converter.js — Phase 2 pure conversion engine.
// Contract: src/converter.test.js. Spec: .planning/phases/02-conversion-engine/02-UI-SPEC.md.
// No DOM. No side effects. Imports measurements only.

import { measurements } from './data/measurements.js';

const MSG_EMPTY            = '';
const MSG_INVALID_NUMBER   = 'Моля, въведете число';
const MSG_NOT_POSITIVE     = 'Моля, въведете число по-голямо от нула';
const MSG_UNKNOWN          = 'Непозната комбинация';

/**
 * Convert a Bulgarian kitchen measurement to its gram/ml equivalent.
 *
 * @param {string} ingredient — key in `measurements`
 * @param {string} unit       — one of: "чаена лъжица", "супена лъжица", "чаена чаша", "кафена чаша"
 * @param {string|number} quantity — raw input; comma or dot decimal accepted
 * @returns {string} display-ready string (never null, never undefined)
 */
export function convert(ingredient, unit, quantity) {
  // 1. Empty / whitespace-only quantity → empty string (Phase 3 shows placeholder)
  const raw = quantity == null ? '' : String(quantity);
  if (raw.trim() === '') return MSG_EMPTY;

  // 2. Normalize Bulgarian comma decimal → dot. Replace ONLY the first comma.
  const normalized = raw.trim().replace(',', '.');

  // 3. Parse. parseFloat is lenient — guard against trailing garbage with a regex check.
  //    Accept patterns: "-?\d*\.?\d*" but require at least one digit somewhere.
  if (!/^-?\d*\.?\d*$/.test(normalized) || !/\d/.test(normalized)) {
    return MSG_INVALID_NUMBER;
  }
  const n = parseFloat(normalized);
  if (Number.isNaN(n)) return MSG_INVALID_NUMBER;

  // 4. Zero or negative → guidance message (CONV-03: instant feedback, not a crash)
  if (n <= 0) return MSG_NOT_POSITIVE;

  // 5. Defensive: unknown ingredient or unit
  const ingEntry = measurements[ingredient];
  if (!ingEntry || !(unit in ingEntry)) return MSG_UNKNOWN;

  // 6. Explicit null leaf → CONV-06 friendly message
  const leaf = ingEntry[unit];
  if (leaf === null) return `Тази мярка не се използва за ${ingredient}`;

  // 7. Compute and format. TECH-06: round to 1 decimal, suppress trailing .0.
  const rawResult = n * leaf.value;
  const rounded = Math.round(rawResult * 10) / 10;
  const numStr = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
  return `${numStr} ${leaf.unit}`;
}
