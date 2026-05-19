/**
 * Conversions of Bulgarian kitchen measurement units to grams (гр) or milliliters (мл).
 *
 * Source: supichka.com — captured in .planning/PROJECT.md.
 * Schema: per .planning/phases/01-foundation/01-CONTEXT.md D-01, D-02, D-03.
 * Ingredients: per CONV-07 (all 20 ingredients × 4 units).
 *
 * - Top-level keys: 20 ingredients per CONV-07.
 * - Per ingredient: all 4 units present (чаена лъжица, супена лъжица, чаена чаша, кафена чаша).
 * - Each leaf: `{ value: number, unit: "гр" | "мл" }` OR explicit `null` when source has no entry (D-02).
 * - Liquids (вода, олио, прясно мляко, кисело мляко, оцет) carry `unit: "мл"` (D-03).
 * - All other ingredients carry `unit: "гр"` (D-03).
 *
 * Phase 2 lookup: `measurements[ingredient][unit]`.
 *   - null → CONV-06 friendly message: "Тази мярка не се използва за {ingredient}"
 *   - object → multiply value by quantity, render as `${result} ${unit}`
 */
export const measurements = {
  "вода": {
    "чаена лъжица":  { value: 5,   unit: "мл" },
    "супена лъжица": { value: 20,  unit: "мл" },
    "чаена чаша":    { value: 200, unit: "мл" },
    "кафена чаша":   { value: 75,  unit: "мл" }
  },
  "сол": {
    "чаена лъжица":  { value: 8,   unit: "гр" },
    "супена лъжица": { value: 15,  unit: "гр" },
    "чаена чаша":    { value: 220, unit: "гр" },
    "кафена чаша":   null
  },
  "захар": {
    "чаена лъжица":  { value: 10,  unit: "гр" },
    "супена лъжица": { value: 20,  unit: "гр" },
    "чаена чаша":    { value: 220, unit: "гр" },
    "кафена чаша":   { value: 80,  unit: "гр" }
  },
  "пудра захар": {
    "чаена лъжица":  { value: 5,   unit: "гр" },
    "супена лъжица": { value: 18,  unit: "гр" },
    "чаена чаша":    { value: 150, unit: "гр" },
    "кафена чаша":   { value: 55,  unit: "гр" }
  },
  "брашно": {
    "чаена лъжица":  { value: 3,   unit: "гр" },
    "супена лъжица": { value: 10,  unit: "гр" },
    "чаена чаша":    { value: 140, unit: "гр" },
    "кафена чаша":   { value: 50,  unit: "гр" }
  },
  "галета": {
    "чаена лъжица":  { value: 6,   unit: "гр" },
    "супена лъжица": { value: 12,  unit: "гр" },
    "чаена чаша":    { value: 140, unit: "гр" },
    "кафена чаша":   { value: 60,  unit: "гр" }
  },
  "ориз": {
    "чаена лъжица":  { value: 10,  unit: "гр" },
    "супена лъжица": { value: 30,  unit: "гр" },
    "чаена чаша":    { value: 220, unit: "гр" },
    "кафена чаша":   { value: 85,  unit: "гр" }
  },
  "олио": {
    "чаена лъжица":  { value: 5,   unit: "мл" },
    "супена лъжица": { value: 20,  unit: "мл" },
    "чаена чаша":    { value: 180, unit: "мл" },
    "кафена чаша":   { value: 65,  unit: "мл" }
  },
  "масло": {
    "чаена лъжица":  { value: 7,   unit: "гр" },
    "супена лъжица": { value: 40,  unit: "гр" },
    "чаена чаша":    { value: 210, unit: "гр" },
    "кафена чаша":   { value: 80,  unit: "гр" }
  },
  "маргарин": {
    "чаена лъжица":  { value: 10,  unit: "гр" },
    "супена лъжица": { value: 50,  unit: "гр" },
    "чаена чаша":    { value: 240, unit: "гр" },
    "кафена чаша":   { value: 90,  unit: "гр" }
  },
  "мас": {
    "чаена лъжица":  { value: 20,  unit: "гр" },
    "супена лъжица": { value: 50,  unit: "гр" },
    "чаена чаша":    { value: 240, unit: "гр" },
    "кафена чаша":   { value: 75,  unit: "гр" }
  },
  "прясно мляко": {
    "чаена лъжица":  { value: 6,   unit: "мл" },
    "супена лъжица": { value: 15,  unit: "мл" },
    "чаена чаша":    { value: 220, unit: "мл" },
    "кафена чаша":   { value: 85,  unit: "мл" }
  },
  "кисело мляко": {
    "чаена лъжица":  { value: 8,   unit: "мл" },
    "супена лъжица": { value: 20,  unit: "мл" },
    "чаена чаша":    { value: 200, unit: "мл" },
    "кафена чаша":   { value: 80,  unit: "мл" }
  },
  "мед": {
    "чаена лъжица":  null,
    "супена лъжица": { value: 50,  unit: "гр" },
    "чаена чаша":    { value: 300, unit: "гр" },
    "кафена чаша":   { value: 150, unit: "гр" }
  },
  "грис": {
    "чаена лъжица":  null,
    "супена лъжица": null,
    "чаена чаша":    { value: 160, unit: "гр" },
    "кафена чаша":   { value: 70,  unit: "гр" }
  },
  "леща": {
    "чаена лъжица":  null,
    "супена лъжица": null,
    "чаена чаша":    { value: 200, unit: "гр" },
    "кафена чаша":   { value: 70,  unit: "гр" }
  },
  "варен фасул": {
    "чаена лъжица":  null,
    "супена лъжица": null,
    "чаена чаша":    { value: 150, unit: "гр" },
    "кафена чаша":   { value: 60,  unit: "гр" }
  },
  "нишесте": {
    "чаена лъжица":  { value: 10,  unit: "гр" },
    "супена лъжица": { value: 20,  unit: "гр" },
    "чаена чаша":    null,
    "кафена чаша":   null
  },
  "оцет": {
    "чаена лъжица":  { value: 5,   unit: "мл" },
    "супена лъжица": { value: 10,  unit: "мл" },
    "чаена чаша":    null,
    "кафена чаша":   null
  },
  "червен пипер": {
    "чаена лъжица":  { value: 5,   unit: "гр" },
    "супена лъжица": { value: 12,  unit: "гр" },
    "чаена чаша":    null,
    "кафена чаша":   null
  }
};

/**
 * The 20 ingredients in display order (CONV-07).
 * Phase 3's IngredientSelector will iterate this array to render buttons.
 */
export const ingredients = [
  "вода", "сол", "захар", "пудра захар", "брашно", "галета", "ориз",
  "олио", "масло", "маргарин", "мас", "прясно мляко", "кисело мляко",
  "мед", "грис", "леща", "варен фасул", "нишесте", "оцет", "червен пипер"
];

/**
 * The 4 measurement units in display order (CONV-02).
 * Phase 3's UnitSelector will iterate this array to render buttons.
 */
export const units = [
  "чаена лъжица",
  "супена лъжица",
  "чаена чаша",
  "кафена чаша"
];
