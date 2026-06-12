import './style.css';
import { convert } from './converter.js';
import { ingredients, units, measurements } from './data/measurements.js';

// Module-scope state — D-04 defaults, matched by value not index
const state = {
  ingredient: 'брашно',        // D-04 pre-selection
  unit: 'супена лъжица',       // D-04 pre-selection
  quantity: ''                 // D-05 empty on load
};

// Mount point
const main = document.querySelector('.app-main');

/**
 * Renders the ingredient selector section with two groups: Течности and Сухи.
 * Liquids are derived from data — first non-null leaf with unit === 'мл'.
 *
 * @param {Element} container - DOM element to append into
 * @param {Function} onSelect - callback(ingredientName, btnRefs)
 * @returns {Object} btnRefs — map of ingredient string → button element
 */
function renderIngredientSelector(container, onSelect) {
  const wrapper = document.createElement('div');
  wrapper.className = 'ingredient-scroll-container';

  const section = document.createElement('section');
  section.className = 'ingredient-selector';
  section.setAttribute('aria-label', 'Изберете съставка');

  // Derive liquids from data — do NOT hardcode the list (CONTEXT.md Specific Ideas)
  const liquids = ingredients.filter(ing => {
    const firstNonNull = Object.values(measurements[ing]).find(v => v !== null);
    return firstNonNull && firstNonNull.unit === 'мл';
  });
  // Result derived at runtime: вода, олио, прясно мляко, оцет

  const groups = [
    { label: 'Течности', items: liquids },
    { label: 'Сухи', items: ingredients.filter(ing => !liquids.includes(ing)) }
  ];

  const btnRefs = {};

  groups.forEach((group, i) => {
    const labelId = `ingredient-group-label-${i}`;
    const groupLabel = document.createElement('p');
    groupLabel.className = 'group-label';
    groupLabel.id = labelId;
    groupLabel.textContent = group.label;
    section.appendChild(groupLabel);

    const grid = document.createElement('div');
    grid.className = 'ingredient-grid';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-labelledby', labelId);

    group.items.forEach(ing => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ingredient-btn';
      btn.textContent = ing;   // textContent — never innerHTML
      if (ing === state.ingredient) btn.classList.add('is-selected');
      btn.addEventListener('click', () => onSelect(ing, btnRefs));
      grid.appendChild(btn);
      btnRefs[ing] = btn;
    });

    section.appendChild(grid);
  });

  wrapper.appendChild(section);
  container.appendChild(wrapper);
  return btnRefs;
}

/**
 * Renders the unit selector section with 4 unit buttons.
 *
 * @param {Element} container - DOM element to append into
 * @param {Function} onSelect - callback(unitName, btnRefs)
 * @returns {Object} btnRefs — map of unit string → button element
 */
function renderUnitSelector(container, onSelect) {
  const section = document.createElement('section');
  section.className = 'unit-selector';
  section.setAttribute('aria-label', 'Изберете мерна единица');

  const btnRefs = {};

  units.forEach(unit => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'unit-btn';
    btn.textContent = unit;   // textContent — never innerHTML
    if (unit === state.unit) btn.classList.add('is-selected');
    btn.addEventListener('click', () => onSelect(unit, btnRefs));
    section.appendChild(btn);
    btnRefs[unit] = btn;
  });

  container.appendChild(section);
  return btnRefs;
}

/**
 * Renders the quantity input section with TECH-08 label↔input association.
 *
 * @param {Element} container - DOM element to append into
 * @param {Function} onInput - callback(inputValue)
 * @returns {HTMLInputElement} the input element
 */
function renderQuantityInput(container, onInput) {
  const section = document.createElement('section');
  section.className = 'quantity-section';

  const label = document.createElement('label');
  label.htmlFor = 'qty-input';   // TECH-08: label for="qty-input"
  label.className = 'field-label';
  label.textContent = 'Количество:';

  const input = document.createElement('input');
  input.type = 'text';           // NEVER 'number' — comma decimal must work (CONV-05)
  input.inputMode = 'decimal';   // Mobile numeric keyboard
  input.id = 'qty-input';
  input.className = 'qty-input';
  input.autocomplete = 'off';
  input.setAttribute('autocorrect', 'off');     // iOS keyboard fix (Pitfall 5)
  input.setAttribute('autocapitalize', 'off');  // iOS keyboard fix (Pitfall 5)
  input.setAttribute('spellcheck', 'false');    // Prevent spell-check on numbers
  input.placeholder = '';                       // D-05: blank, no hint

  input.addEventListener('input', () => onInput(input.value));

  section.append(label, input);
  container.appendChild(section);
  return input;
}

/**
 * Renders the result display section.
 *
 * @param {Element} container - DOM element to append into
 * @returns {HTMLParagraphElement} the result value element
 */
function renderResultDisplay(container) {
  const section = document.createElement('section');
  section.className = 'result-display';

  const label = document.createElement('p');
  label.className = 'field-label';
  label.textContent = 'Резултат:';   // Informational — NOT a <label> element

  const value = document.createElement('p');
  value.className = 'result-value';
  value.id = 'result-value';
  value.setAttribute('role', 'status');
  value.setAttribute('aria-live', 'polite');
  value.textContent = '— г';   // D-05: static placeholder; never produced by convert()

  section.append(label, value);
  container.appendChild(section);
  return value;
}

/**
 * Single source of truth for result state machine.
 * convert() output:
 *   ""         → show "— г" placeholder, remove .is-muted
 *   /^\d/      → valid numeric result, remove .is-muted
 *   Cyrillic   → error/missing message, add .is-muted
 *
 * ALWAYS uses textContent — never innerHTML (XSS safety, T-03-04)
 *
 * @param {HTMLParagraphElement} resultEl
 */
function updateResult(resultEl) {
  const output = convert(state.ingredient, state.unit, state.quantity);
  if (output === '') {
    resultEl.textContent = '— г';                 // D-05 placeholder
    resultEl.classList.remove('is-muted');
  } else {
    resultEl.textContent = output;                // verbatim from convert() — no transformation
    resultEl.classList.toggle('is-muted', !/^\d/.test(output));
  }
}

// ── Wire everything together ─────────────────────────────────────────────────
// Result element forward-declared so closures can reference it before
// renderResultDisplay() is called. Render order per D-06:
// IngredientSelector → UnitSelector → QuantityInput → ResultDisplay

let resultEl;

const ingredientBtnRefs = renderIngredientSelector(main, (ing, refs) => {
  Object.values(refs).forEach(b => b.classList.remove('is-selected'));
  refs[ing].classList.add('is-selected');
  state.ingredient = ing;
  updateResult(resultEl);
});

const unitBtnRefs = renderUnitSelector(main, (unit, refs) => {
  Object.values(refs).forEach(b => b.classList.remove('is-selected'));
  refs[unit].classList.add('is-selected');
  state.unit = unit;
  updateResult(resultEl);
});

renderQuantityInput(main, (value) => {
  state.quantity = value;
  updateResult(resultEl);
});

resultEl = renderResultDisplay(main);
