/* admin/app.js — Merilo admin panel logic */

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  ingredients: [],
  units: {},
  config: {},
  translations: {},   // { bg: {...}, ro: {...}, ... }
  langs: [],
  dirty: {},          // track which files have unsaved changes
};

let selectedIngId = null;
let activeLang = 'bg';

// ── Helpers ────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = 'toast'; }, 2800);
}

async function save(file, content) {
  const res = await fetch('/admin-api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, content }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json;
}

function markDirty(key) {
  state.dirty[key] = true;
  renderNavDots();
}

function renderNavDots() {
  document.querySelectorAll('.nav-item').forEach(el => {
    const tab = el.dataset.tab;
    const dot = el.querySelector('.dirty-dot');
    if (state.dirty[tab]) {
      if (!dot) {
        const d = document.createElement('span');
        d.className = 'dirty-dot';
        d.style.cssText = 'width:6px;height:6px;background:#e8a84c;border-radius:50%;display:inline-block;margin-left:auto;flex-shrink:0';
        el.appendChild(d);
      }
    } else if (dot) {
      dot.remove();
    }
  });
}

// ── Data loading ────────────────────────────────────────────────────────────
async function loadAll() {
  const [ingredients, units, config] = await Promise.all([
    fetch('/data/ingredients.json').then(r => r.json()),
    fetch('/data/units.json').then(r => r.json()),
    fetch('/data/config.json').then(r => r.json()),
  ]);
  state.ingredients = ingredients;
  state.units = units;
  state.config = config;
  state.langs = config.langs || ['bg'];
  activeLang = state.langs[0];

  // Load all translation files
  await Promise.all(
    state.langs.map(async lang => {
      const t = await fetch(`/data/translations.${lang}.json`).then(r => r.json());
      state.translations[lang] = t;
    })
  );
}

// ── Tab routing ─────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach(el => {
    el.classList.toggle('active', el.id === `tab-${tab}`);
  });
  renderTab(tab);
}

function renderTab(tab) {
  const renderers = {
    ingredients: renderIngredients,
    translations: renderTranslations,
    units: renderUnits,
    settings: renderSettings,
    build: renderBuild,
  };
  renderers[tab]?.();
}

// ── INGREDIENTS tab ─────────────────────────────────────────────────────────
function renderIngredients() {
  const panel = document.getElementById('tab-ingredients');
  const rows = state.ingredients.map(ing => {
    const name = ing.names[activeLang] || ing.id;
    const sel = ing.id === selectedIngId ? ' selected' : '';
    return `<div class="ing-row${sel}" data-id="${esc(ing.id)}">
      <span class="ing-id">${esc(ing.id)}</span>
      <span class="ing-name">${esc(name)}</span>
      <span class="ing-density">${ing.density} g/ml</span>
    </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Ingredients</div>
        <div class="page-sub">${state.ingredients.length} ingredients · click to edit</div>
      </div>
      <button class="btn btn-success btn-sm" id="btn-add-ing">+ Add ingredient</button>
    </div>
    <div class="panel">
      <div class="panel-body">
        <div class="ing-list">${rows}</div>
      </div>
    </div>
    <div class="edit-drawer${selectedIngId ? ' open' : ''}" id="ing-drawer"></div>`;

  // List click
  panel.querySelector('.ing-list').addEventListener('click', e => {
    const row = e.target.closest('.ing-row');
    if (!row) return;
    selectedIngId = row.dataset.id === selectedIngId ? null : row.dataset.id;
    renderIngredients();
    if (selectedIngId) renderIngDrawer();
  });

  // Add button
  panel.querySelector('#btn-add-ing').addEventListener('click', () => {
    const id = prompt('New ingredient ID (lowercase, hyphens only):');
    if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) { toast('Invalid ID', true); return; }
    if (state.ingredients.find(x => x.id === id)) { toast('ID already exists', true); return; }
    const newIng = { id, density: 0.5, names: {}, title: {}, desc: {}, note: {}, blocks: [] };
    state.langs.forEach(l => { newIng.names[l] = ''; newIng.title[l] = ''; newIng.desc[l] = ''; newIng.note[l] = ''; });
    state.ingredients.push(newIng);
    selectedIngId = id;
    markDirty('ingredients');
    renderIngredients();
    renderIngDrawer();
  });

  if (selectedIngId) renderIngDrawer();
}

// Auto-resize a textarea to fit its content
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function initAutoResize(root) {
  root.querySelectorAll('textarea.auto-resize').forEach(el => {
    autoResize(el);
    el.addEventListener('input', () => autoResize(el));
  });
}

// Mirror of build.mjs tmpl() — replaces {key} placeholders
function tmpl(template, vars) {
  return (template || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

// Gradient box styling matching .answer from site.css
const ANSWER_PREVIEW_STYLE = [
  'margin-top:8px', 'padding:14px 16px',
  'background:linear-gradient(180deg,#FFFDF8,#F4ECDC)',
  'border:1px solid #E4D8C4', 'border-left:4px solid #C2522C',
  'border-radius:10px', 'font-size:14px', 'line-height:1.6',
  'color:#2A2420', 'min-height:40px', 'white-space:pre-wrap',
  'font-family:Onest,system-ui,sans-serif',
].join(';');

function renderFaqList(container, langs, initialFaqs) {
  let items = (initialFaqs || []).map(f => JSON.parse(JSON.stringify(f)));

  function snapshotValues() {
    container.querySelectorAll('.faq-item').forEach(el => {
      const i = parseInt(el.dataset.faqIdx);
      if (!items[i]) items[i] = { q: {}, a: {} };
      el.querySelectorAll('[data-faq-field]').forEach(input => {
        const [part, lang] = input.dataset.faqField.split('.');
        if (!items[i][part]) items[i][part] = {};
        items[i][part][lang] = input.value;
      });
    });
  }

  function build() {
    if (items.length === 0) {
      container.innerHTML = '<p style="font-size:12px;color:var(--muted);margin:4px 0 8px">No custom FAQs yet — click &ldquo;+ Add FAQ item&rdquo; below.</p>';
      return;
    }
    container.innerHTML = items.map((item, i) => `
      <div class="faq-item" data-faq-idx="${i}" style="margin-bottom:10px;padding:12px;background:rgba(0,0,0,.14);border:1px solid var(--border);border-radius:var(--radius)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-size:10px;color:var(--accent);text-transform:uppercase;letter-spacing:.06em;font-weight:700">FAQ #${i + 1}</span>
          <button class="btn btn-ghost btn-sm btn-rm-faq" data-rm-idx="${i}" style="padding:3px 8px;font-size:11px">&#10005; Remove</button>
        </div>
        ${langs.map(l => `
          <div style="margin-bottom:${l === langs[langs.length - 1] ? '0' : '8px'};padding:8px;background:rgba(91,141,238,.04);border:1px solid var(--border);border-radius:4px">
            <div style="font-size:9px;color:var(--accent);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">[${l.toUpperCase()}]</div>
            <div class="field">
              <label>Question</label>
              <input type="text" data-faq-field="q.${l}" value="${esc(item.q?.[l] || '')}">
            </div>
            <div class="field" style="margin-top:8px;margin-bottom:0">
              <label>Answer <span style="color:var(--muted);font-size:10px;text-transform:none;letter-spacing:0;font-weight:400">(HTML allowed: &lt;b&gt; &lt;br&gt; &lt;ul&gt;&lt;li&gt;)</span></label>
              <textarea class="auto-resize" data-faq-field="a.${l}" style="min-height:52px">${esc(item.a?.[l] || '')}</textarea>
              <div class="faq-ans-preview" style="margin-top:4px;padding:8px 10px;background:rgba(0,0,0,.22);border:1px solid rgba(91,141,238,.2);border-radius:4px;font-size:12px;color:var(--text);line-height:1.6;min-height:26px">${item.a?.[l] || '<em style="color:var(--muted)">Preview…</em>'}</div>
            </div>
          </div>`).join('')}
      </div>`).join('');

    container.querySelectorAll('[data-faq-field^="a."]').forEach(ta => {
      const preview = ta.nextElementSibling;
      if (!preview) return;
      ta.addEventListener('input', () => {
        preview.innerHTML = ta.value.trim() || '<em style="color:var(--muted)">Preview…</em>';
      });
    });

    container.querySelectorAll('.btn-rm-faq').forEach(btn => {
      btn.addEventListener('click', () => {
        snapshotValues();
        items.splice(parseInt(btn.dataset.rmIdx), 1);
        build();
        initAutoResize(container);
      });
    });

    initAutoResize(container);
  }

  function addItem() {
    snapshotValues();
    const newItem = { q: {}, a: {} };
    langs.forEach(l => { newItem.q[l] = ''; newItem.a[l] = ''; });
    items.push(newItem);
    build();
    container.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function collect() {
    snapshotValues();
    return items.filter(f =>
      langs.some(l => (f.q?.[l] || '').trim() || (f.a?.[l] || '').trim())
    );
  }

  build();
  return { addItem, collect };
}

function renderIngDrawer() {
  const drawer = document.getElementById('ing-drawer');
  if (!drawer) return;
  const ing = state.ingredients.find(x => x.id === selectedIngId);
  if (!ing) return;

  const t = state.translations[activeLang] || {};
  const langSections = state.langs.map(l => {
    const name = esc(ing.names?.[l] || '');
    const titleVal = esc(ing.title?.[l] || '');
    const descVal = esc(ing.desc?.[l] || '');
    const noteVal = esc(ing.note?.[l] || '');
    // Compute default hub title for placeholder hint
    const rawName = ing.names?.[l] || ing.id;
    const capName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const defaultTitle = `${capName}: чаши, лъжици и грамове`;

    return `
    <div style="margin-bottom:20px;padding:14px;background:rgba(91,141,238,.05);border:1px solid var(--border);border-radius:var(--radius)">
      <div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-bottom:12px;font-weight:700">[${l.toUpperCase()}]</div>
      <div class="field">
        <label>Name</label>
        <input type="text" data-field="names.${l}" value="${name}">
      </div>
      <div class="field">
        <label>Page Title <span style="color:var(--muted);font-size:10px;text-transform:none;letter-spacing:0">(leave empty to use template)</span></label>
        <input type="text" data-field="title.${l}" value="${titleVal}" placeholder="${esc(defaultTitle)}">
      </div>
      <div class="field">
        <label>Hero Description <span style="color:var(--muted);font-size:10px;text-transform:none;letter-spacing:0">(shown under title in styled box · leave empty to use template)</span></label>
        <textarea class="auto-resize" data-field="desc.${l}" data-preview="desc-preview-${l}" style="min-height:72px">${descVal}</textarea>
        <div id="desc-preview-${l}" style="${ANSWER_PREVIEW_STYLE}">${descVal || '<span style="color:#9a9a9a;font-style:italic">Preview appears here…</span>'}</div>
      </div>
      <div class="field" style="margin-top:12px">
        <label>Note — paragraph 1 <span style="color:var(--muted);font-size:10px;text-transform:none;letter-spacing:0">(ingredient-specific · explainer section)</span></label>
        <textarea class="auto-resize" data-field="note.${l}" data-explainer-preview="expl-${l}" style="min-height:72px">${noteVal}</textarea>
        <div style="margin-top:10px;padding:12px 14px;background:rgba(0,0,0,.18);border:1px solid var(--border);border-radius:var(--radius)">
          <div style="font-size:10px;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">Explainer preview (as it appears on the page)</div>
          <p id="expl-${l}-p1" style="margin-bottom:10px;font-size:13px;color:var(--text)">${noteVal || '<em style="color:var(--muted)">(empty — add a note above)</em>'}</p>
          <p style="margin-bottom:10px;font-size:13px;color:var(--muted)">${esc(tmpl(state.translations[l]?.explainer_generic || '', { ing: ing.names?.[l] || ing.id }))}</p>
          <p style="font-size:13px;color:var(--muted)">${esc(state.translations[l]?.explainer_cup || '')}</p>
          <div style="margin-top:8px;font-size:10px;color:var(--muted);border-top:1px solid var(--border);padding-top:6px">Paragraphs 2 &amp; 3 come from <strong>Translations → explainer_generic / explainer_cup</strong></div>
        </div>
      </div>
    </div>`;
  }).join('');

  drawer.innerHTML = `
    <div class="drawer-title">
      <span>Editing: ${esc(ing.id)}</span>
      <button class="btn btn-ghost btn-sm" id="btn-close-drawer">✕ Close</button>
    </div>
    <div class="row row-3">
      <div class="field">
        <label>Density (g/ml)</label>
        <input type="number" data-field="density" step="0.01" min="0" value="${ing.density}">
      </div>
      <div class="field">
        <label>Type</label>
        <select data-field="liquid">
          <option value="false" ${!ing.liquid ? 'selected' : ''}>🌾 Dry</option>
          <option value="true"  ${ing.liquid  ? 'selected' : ''}>💧 Liquid</option>
        </select>
      </div>
      <div class="field">
        <label>ID (read-only)</label>
        <input type="text" value="${esc(ing.id)}" disabled>
      </div>
    </div>
    <div class="row row-2">
      <div class="field">
        <label>Source <span style="color:var(--muted);font-size:10px;text-transform:none;letter-spacing:0">(URL or name of measurement source)</span></label>
        <input type="text" data-field="source" value="${esc(ing.source || '')}" placeholder="e.g. USDA, личен тест">
      </div>
      <div class="field">
        <label>Verified on <span style="color:var(--muted);font-size:10px;text-transform:none;letter-spacing:0">(YYYY-MM-DD)</span></label>
        <input type="text" data-field="verifiedOn" value="${esc(ing.verifiedOn || '')}" placeholder="2026-05-24">
      </div>
    </div>
    <hr>
    ${langSections}
    <hr>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);margin-bottom:10px">
      Custom FAQs
      <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0;font-size:10px"> — appended after the 2 generic questions on hub &amp; question pages</span>
    </div>
    <div id="faq-list"></div>
    <button class="btn btn-ghost btn-sm" id="btn-add-faq" style="margin-top:6px">+ Add FAQ item</button>
    <div class="btn-row">
      <button class="btn btn-primary" id="btn-save-ing">Save ingredient</button>
      <button class="btn btn-danger btn-sm" id="btn-del-ing">Delete</button>
    </div>`;

  drawer.classList.add('open');
  initAutoResize(drawer);

  const faqCtrl = renderFaqList(
    document.getElementById('faq-list'),
    state.langs,
    ing.faqs || []
  );
  document.getElementById('btn-add-faq').addEventListener('click', faqCtrl.addItem);

  // Live preview for desc textareas (hero answer box)
  drawer.querySelectorAll('textarea[data-preview]').forEach(ta => {
    const preview = document.getElementById(ta.dataset.preview);
    if (!preview) return;
    ta.addEventListener('input', () => {
      preview.innerHTML = ta.value.trim()
        ? ta.value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        : '<span style="color:#9a9a9a;font-style:italic">Preview appears here…</span>';
    });
  });

  // Live update paragraph 1 of explainer preview when note textarea changes
  drawer.querySelectorAll('textarea[data-explainer-preview]').forEach(ta => {
    const p1Id = ta.dataset.explainerPreview + '-p1';
    const p1 = document.getElementById(p1Id);
    if (!p1) return;
    ta.addEventListener('input', () => {
      p1.innerHTML = ta.value.trim()
        ? ta.value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        : '<em style="color:var(--muted)">(empty — add a note above)</em>';
    });
  });

  document.getElementById('btn-close-drawer').onclick = () => {
    selectedIngId = null;
    drawer.classList.remove('open');
    renderIngredients();
  };

  document.getElementById('btn-save-ing').onclick = async () => {
    drawer.querySelectorAll('[data-field]').forEach(el => {
      const path = el.dataset.field.split('.');
      let val;
      if (el.type === 'number') val = parseFloat(el.value);
      else if (el.tagName === 'SELECT' && (el.value === 'true' || el.value === 'false')) val = el.value === 'true';
      else val = el.value;
      if (path.length === 1) {
        ing[path[0]] = val;
      } else {
        if (!ing[path[0]]) ing[path[0]] = {};
        ing[path[0]][path[1]] = val;
      }
    });
    ing.faqs = faqCtrl.collect();
    try {
      await save('data/ingredients.json', state.ingredients);
      state.dirty['ingredients'] = false;
      renderNavDots();
      toast('Saved ingredients.json');
      renderIngredients();
    } catch (e) { toast(e.message, true); }
  };

  document.getElementById('btn-del-ing').onclick = async () => {
    if (!confirm(`Delete "${ing.id}"? This cannot be undone.`)) return;
    state.ingredients = state.ingredients.filter(x => x.id !== ing.id);
    selectedIngId = null;
    try {
      await save('data/ingredients.json', state.ingredients);
      toast('Deleted and saved');
      renderIngredients();
    } catch (e) { toast(e.message, true); }
  };
}

// ── TRANSLATIONS tab ────────────────────────────────────────────────────────
// Keys that hint the user what placeholders are available
const TRANS_HINTS = {
  q_h1: '{unitPhrase} {ing}',
  q_ans: '{unitPhrase} {ml} {ing} {n}',
  q_meta: '{unitPhrase} {ing} {n}',
  qr_h1: '{toPl} {ing} {anchor}',
  qr_ans: '{toPl} {ing} {anchor} {n}',
  qr_meta: '{toPl} {ing} {anchor} {n}',
  qr_crumb: '{toPl} {anchor}',
  hub_h1: '{Ing} (capitalised name)',
  hub_meta: '{ing}',
  hub_intro: '{ing}',
  quick: '{ing}',
  table_title: '{ing}',
  faq1_q: '{ing}',
  faq1_a: '{ing} {n}',
  faq2_q: '{ing}',
  faq2_a: '{ing} {n} {cups}',
  explainer_generic: '{ing}',
};

function renderTranslations() {
  const panel = document.getElementById('tab-translations');
  const t = state.translations[activeLang] || {};

  const langButtons = state.langs.map(l =>
    `<button class="btn ${l === activeLang ? 'btn-primary' : 'btn-ghost'} btn-sm" data-lang="${l}">${l.toUpperCase()}</button>`
  ).join('');

  const fields = Object.entries(t).map(([key, val]) => {
    if (typeof val === 'number') {
      return `<div class="field">
        <div class="trans-key">${esc(key)}</div>
        <input type="number" step="any" data-key="${esc(key)}" value="${val}">
      </div>`;
    }
    const hint = TRANS_HINTS[key];
    const isLong = typeof val === 'string' && val.length > 80;
    const input = isLong
      ? `<textarea data-key="${esc(key)}">${esc(val)}</textarea>`
      : `<input type="text" data-key="${esc(key)}" value="${esc(val)}">`;
    return `<div class="field">
      <div class="trans-key">${esc(key)}</div>
      ${input}
      ${hint ? `<div class="trans-hint">vars: ${esc(hint)}</div>` : ''}
    </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Translations</div>
        <div class="page-sub">translations.${activeLang}.json</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        ${langButtons}
        <button class="btn btn-ghost btn-sm" id="btn-add-lang">+ Add lang</button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-body">${fields}</div>
    </div>
    <div class="btn-row">
      <button class="btn btn-primary" id="btn-save-trans">Save translations.${activeLang}.json</button>
    </div>`;

  panel.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => { activeLang = btn.dataset.lang; renderTranslations(); });
  });

  document.getElementById('btn-add-lang').addEventListener('click', () => {
    const lang = prompt('New language code (e.g. ro, sr, mk):');
    if (!lang || !/^[a-z]{2,3}$/.test(lang)) { toast('Invalid code', true); return; }
    if (state.langs.includes(lang)) { toast('Already exists', true); return; }
    // Clone bg translations as starting point
    state.translations[lang] = JSON.parse(JSON.stringify(state.translations['bg'] || {}));
    state.langs.push(lang);
    state.config.langs = state.langs;
    activeLang = lang;
    toast(`Added ${lang}. Remember to save Settings and Translations.`);
    renderTranslations();
  });

  document.getElementById('btn-save-trans').addEventListener('click', async () => {
    const updated = { ...state.translations[activeLang] };
    panel.querySelectorAll('[data-key]').forEach(el => {
      const key = el.dataset.key;
      const orig = state.translations[activeLang][key];
      updated[key] = typeof orig === 'number' ? Number(el.value) : el.value;
    });
    state.translations[activeLang] = updated;
    try {
      await save(`data/translations.${activeLang}.json`, updated);
      toast(`Saved translations.${activeLang}.json`);
    } catch (e) { toast(e.message, true); }
  });
}

// ── UNITS tab ───────────────────────────────────────────────────────────────
function renderUnits() {
  const panel = document.getElementById('tab-units');
  const rows = Object.entries(state.units).map(([key, u]) => {
    const labelBg = u.label?.bg || '';
    const cBg = u.c?.bg || '';
    const mlOrG = u.ml != null ? `ml: ${u.ml}` : `g: ${u.g}`;
    return `<tr data-key="${esc(key)}">
      <td><code>${esc(key)}</code></td>
      <td><input type="text" data-unit="${esc(key)}" data-field="slug" value="${esc(u.slug)}"></td>
      <td><code>${esc(mlOrG)}</code></td>
      <td><input type="text" data-unit="${esc(key)}" data-field="label.bg" value="${esc(labelBg)}"></td>
      <td><input type="text" data-unit="${esc(key)}" data-field="c.bg" value="${esc(cBg)}"></td>
    </tr>`;
  }).join('');

  panel.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Units</div>
        <div class="page-sub">units.json · slug and labels</div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-body" style="overflow-x:auto">
        <table class="units-table">
          <thead><tr><th>Key</th><th>Slug</th><th>Value</th><th>Label [bg]</th><th>UI label [bg]</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn btn-primary" id="btn-save-units">Save units.json</button>
    </div>`;

  document.getElementById('btn-save-units').addEventListener('click', async () => {
    panel.querySelectorAll('[data-unit]').forEach(el => {
      const key = el.dataset.unit;
      const field = el.dataset.field.split('.');
      const unit = state.units[key];
      if (!unit) return;
      if (field.length === 1) {
        unit[field[0]] = el.value;
      } else {
        if (!unit[field[0]]) unit[field[0]] = {};
        unit[field[0]][field[1]] = el.value;
      }
    });
    try {
      await save('data/units.json', state.units);
      toast('Saved units.json');
    } catch (e) { toast(e.message, true); }
  });
}

// ── SETTINGS tab ─────────────────────────────────────────────────────────────
function renderSettings() {
  const panel = document.getElementById('tab-settings');
  const cfg = state.config;

  panel.innerHTML = `
    <div class="page-header">
      <div class="page-title">Settings</div>
    </div>
    <div class="panel">
      <div class="panel-header">config.json</div>
      <div class="panel-body">
        <div class="row row-2">
          <div class="field">
            <label>Domain</label>
            <input type="text" id="cfg-domain" value="${esc(cfg.site?.domain || '')}">
          </div>
          <div class="field">
            <label>Output dir</label>
            <input type="text" id="cfg-outdir" value="${esc(cfg.site?.outDir || 'dist')}">
          </div>
        </div>
        <div class="row row-2">
          <div class="field">
            <label>Environment</label>
            <select id="cfg-env">
              <option value="experiment" ${cfg.environment === 'experiment' ? 'selected' : ''}>experiment (noindex)</option>
              <option value="live" ${cfg.environment === 'live' ? 'selected' : ''}>live (indexed)</option>
            </select>
          </div>
          <div class="field">
            <label>Active languages</label>
            <input type="text" id="cfg-langs" value="${esc((cfg.langs || []).join(', '))}">
            <div class="trans-hint">comma-separated, e.g. bg, ro</div>
          </div>
        </div>
        <div class="field">
          <label>Reverse anchor (grams)</label>
          <input type="number" id="cfg-rev-anchor" value="${cfg.revAnchor ?? 100}">
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="btn-save-cfg">Save config.json</button>
        </div>
      </div>
    </div>`;

  document.getElementById('btn-save-cfg').addEventListener('click', async () => {
    cfg.site = {
      ...cfg.site,
      domain: document.getElementById('cfg-domain').value.trim(),
      outDir: document.getElementById('cfg-outdir').value.trim(),
    };
    cfg.environment = document.getElementById('cfg-env').value;
    cfg.langs = document.getElementById('cfg-langs').value.split(',').map(l => l.trim()).filter(Boolean);
    cfg.revAnchor = Number(document.getElementById('cfg-rev-anchor').value);
    state.langs = cfg.langs;
    try {
      await save('data/config.json', cfg);
      toast('Saved config.json');
    } catch (e) { toast(e.message, true); }
  });
}

// ── BUILD tab ────────────────────────────────────────────────────────────────
function renderBuild() {
  const panel = document.getElementById('tab-build');
  panel.innerHTML = `
    <div class="page-header">
      <div class="page-title">Build</div>
    </div>
    <div class="panel">
      <div class="panel-body">
        <p style="color:var(--muted);font-size:12px;margin-bottom:16px">
          Runs <code>node build.mjs</code> — regenerates all SEO pages in <code>dist/</code>.
        </p>
        <button class="btn btn-success" id="btn-build">▶ Run build</button>
        <div style="margin-top:16px">
          <div id="build-status" style="font-size:11px;color:var(--muted);margin-bottom:8px">Idle</div>
          <div class="build-output idle" id="build-out">Output will appear here…</div>
        </div>
      </div>
    </div>`;

  document.getElementById('btn-build').addEventListener('click', async () => {
    const out = document.getElementById('build-out');
    const status = document.getElementById('build-status');
    out.textContent = '';
    out.className = 'build-output';
    status.textContent = 'Building…';
    document.getElementById('btn-build').disabled = true;

    try {
      const res = await fetch('/admin-api/build', { method: 'POST' });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        out.textContent += decoder.decode(value, { stream: true });
        out.scrollTop = out.scrollHeight;
      }
      status.textContent = 'Done';
      toast('Build complete');
    } catch (e) {
      out.textContent += `\nError: ${e.message}`;
      status.textContent = 'Error';
      toast(e.message, true);
    } finally {
      document.getElementById('btn-build').disabled = false;
    }
  });
}

// ── Navigation ───────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => switchTab(el.dataset.tab));
});

// ── Init ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await loadAll();
    renderTab('ingredients');
    toast('Data loaded');
  } catch (e) {
    toast('Failed to load data: ' + e.message, true);
    console.error(e);
  }
})();
