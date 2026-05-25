/*! calc.js — shared kitchen converter engine
 * ---------------------------------------------------------------------------
 * Framework-free. Load once, cached across every page:  <script src="/assets/calc.js" defer></script>
 *
 * INITIAL-STATE RESOLUTION (the important part) — first source that provides a
 * value wins, field by field:
 *
 *   1. URL query params      ?ing=&from=&to=&amt=   ← explicit override (shared/edited link)
 *   2. window.__PREFILL__    { ing, from, to, amt } ← per-page default injected by the generator
 *   3. data-* attributes     on the .calc element   ← optional inline default
 *   4. built-in defaults     (brashno, chasha → g, 1)
 *
 * Rationale: a generated landing page sets its intended state via __PREFILL__, but
 * if someone arrives on a deliberately constructed ?param link, that explicit
 * choice takes precedence. Landing-page canonical URLs stay clean (no query string),
 * so on a normal visit only __PREFILL__ applies.
 *
 * DATA LAYER: prefers window.__KITCHEN_DATA__ (inject it from your single source of
 * truth — e.g. have build.mjs emit /assets/data.js). Falls back to DEFAULT_DATA below,
 * which mirrors build.mjs so the script is self-sufficient. Keep ONE source authoritative.
 * density = grams per millilitre — verify against authoritative sources before launch.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  /* ----------------------------- data layer ----------------------------- */
  // Each ingredient carries `density` (g/ml) and optionally `measures`: exact gram weights
  // per Bulgarian unit from source data. measures win over density × ml.
  var DEFAULT_DATA = {
    ingredients: {
      brashno:       { name: "Брашно",        density: 0.70, measures: { chl: 3,  sl: 10, chasha: 140, coffee_cup: 50  } },
      zahar:         { name: "Захар",         density: 1.10, measures: { chl: 10, sl: 20, chasha: 220, coffee_cup: 80  } },
      "pudra-zahar": { name: "Пудра захар",   density: 0.75, measures: { chl: 5,  sl: 18, chasha: 150, coffee_cup: 55  } },
      oriz:          { name: "Ориз (суров)",  density: 1.10, measures: { chl: 10, sl: 30, chasha: 220, coffee_cup: 85  } },
      mlyako:        { name: "Мляко",         density: 1.10, liquid: true, measures: { chl: 6, sl: 15, chasha: 220, coffee_cup: 85 } },
      "kiselo-mlyako": { name: "Кисело мляко", density: 1.00, measures: { chl: 8, sl: 20, chasha: 200, coffee_cup: 80 } },
      olio:          { name: "Олио",          density: 0.90, liquid: true, measures: { chl: 5, sl: 20, chasha: 180, coffee_cup: 65 } },
      maslo:         { name: "Масло",         density: 1.05, measures: { chl: 7,  sl: 40, chasha: 210, coffee_cup: 80  } },
      med:           { name: "Мед",           density: 1.50, liquid: true, measures: { sl: 50, chasha: 300, coffee_cup: 150 } },
      sol:           { name: "Сол",           density: 1.10, measures: { chl: 8,  sl: 15, chasha: 220 } },
      voda:          { name: "Вода",          density: 1.00, liquid: true, measures: { chl: 5, sl: 20, chasha: 200, coffee_cup: 75 } },
      kakao:         { name: "Какао",         density: 0.36 },
      oves:          { name: "Овесени ядки",  density: 0.38 }
    },
    // volume units carry ml; mass units carry g
    units: {
      chasha:     { ml: 200,     label: "чаена чаша" },
      coffee_cup: { ml: 75,      label: "кафена чаша" },
      sl:         { ml: 15,      label: "с.л." },
      chl:        { ml: 5,       label: "ч.л." },
      ml:         { ml: 1,       label: "мл" },
      l:          { ml: 1000,    label: "л" },
      cup_us:     { ml: 240,     label: "cup (US)" },
      floz:       { ml: 29.5735, label: "fl oz" },
      g:          { g: 1,        label: "г" },
      kg:         { g: 1000,     label: "кг" },
      oz:         { g: 28.3495,  label: "oz" },
      lb:         { g: 453.592,  label: "lb" }
    },
    order: ["chasha", "coffee_cup", "sl", "chl", "ml", "l", "cup_us", "floz", "g", "kg", "oz", "lb"]
  };

  var DATA = (typeof window !== "undefined" && window.__KITCHEN_DATA__) || DEFAULT_DATA;
  var ING = DATA.ingredients, UNITS = DATA.units, ORDER = DATA.order;

  var DEFAULTS = { ing: "brashno", from: "chasha", to: "g", amt: "1" };
  var SYNC_URL = false; // set true to mirror current state into the query string (off: avoids touching SEO URLs)

  /* ------------------------------ helpers ------------------------------- */
  function isVol(u) { return UNITS[u] && typeof UNITS[u].ml === "number"; }

  // any source quantity → grams. Priority: exact source measure → volume×density → mass unit.
  function toGrams(amount, unit, ing) {
    if (ing.measures && ing.measures[unit] != null) return amount * ing.measures[unit];
    return isVol(unit) ? amount * UNITS[unit].ml * ing.density : amount * UNITS[unit].g;
  }
  // grams → any target unit (same priority, inverted)
  function fromGrams(grams, unit, ing) {
    if (ing.measures && ing.measures[unit] != null) return grams / ing.measures[unit];
    return isVol(unit) ? (grams / ing.density) / UNITS[unit].ml : grams / UNITS[unit].g;
  }

  function parseAmount(raw) {
    if (raw == null) return NaN;
    return parseFloat(String(raw).replace(",", ".").trim()); // accept "1,5"
  }

  function pretty(n) {
    if (!isFinite(n)) return "—";
    if (n >= 100) return String(Math.round(n));
    if (n >= 10)  return String(Math.round(n * 10) / 10);
    return String(Math.round(n * 100) / 100);
  }

  // first defined, non-empty value across the prioritized sources
  function pick(field, urlParams, prefill, dataset) {
    var fromUrl = urlParams.get(field);
    if (fromUrl != null && fromUrl !== "") return fromUrl;
    if (prefill && prefill[field] != null && prefill[field] !== "") return String(prefill[field]);
    if (dataset && dataset[field] != null && dataset[field] !== "") return dataset[field];
    return DEFAULTS[field];
  }

  function valid(state) {
    return ING[state.ing] && UNITS[state.from] && UNITS[state.to];
  }

  /* -------------------------------- init -------------------------------- */
  function init() {
    var root = document.querySelector(".calc");
    if (!root) return; // page has no calculator — nothing to do

    var el = {
      ing:  document.getElementById("ing"),
      from: document.getElementById("from"),
      to:   document.getElementById("to"),
      amt:  document.getElementById("amt"),
      out:  document.getElementById("out"),
      why:  document.getElementById("why"),
      chips: document.getElementById("chips"),
      swap: document.getElementById("swap"),
      copy: document.getElementById("copy")
    };
    if (!el.ing || !el.from || !el.to || !el.amt || !el.out) return;

    // populate selects from the data layer
    Object.keys(ING).forEach(function (id) { el.ing.add(new Option(ING[id].name, id)); });
    ORDER.forEach(function (u) {
      if (!UNITS[u]) return;
      el.from.add(new Option(UNITS[u].label, u));
      el.to.add(new Option(UNITS[u].label, u));
    });

    // resolve initial state by priority: URL > __PREFILL__ > data-* > ingredient-type default
    var params  = new URLSearchParams(window.location.search);
    var prefill = window.__PREFILL__ || null;
    var ds      = root.dataset || {};
    var resolvedIng = pick("ing", params, prefill, ds);
    var explicitTo  = params.get("to") ||
                      (prefill && prefill.to != null && prefill.to !== "" ? String(prefill.to) : null) ||
                      (ds && ds.to) || null;
    var state = {
      ing:  resolvedIng,
      from: pick("from", params, prefill, ds),
      to:   explicitTo || ((ING[resolvedIng] && ING[resolvedIng].liquid) ? "ml" : "g"),
      amt:  pick("amt",  params, prefill, ds)
    };
    if (!valid(state)) state = { ing: DEFAULTS.ing, from: DEFAULTS.from, to: DEFAULTS.to, amt: state.amt || DEFAULTS.amt };

    el.ing.value = state.ing;
    el.from.value = state.from;
    el.to.value = state.to;
    el.amt.value = state.amt;

    /* ------------------------------ compute ----------------------------- */
    function compute() {
      var ing = ING[el.ing.value];
      var amount = parseAmount(el.amt.value);
      if (!ing || isNaN(amount)) {
        el.out.innerHTML = "—";
        if (el.why) el.why.textContent = "";
        return;
      }
      var grams = toGrams(amount, el.from.value, ing);
      var result = fromGrams(grams, el.to.value, ing);
      el.out.innerHTML = pretty(result) + ' <span>' + UNITS[el.to.value].label + "</span>";
      if (el.why) {
        var usedExact = (ing.measures && (ing.measures[el.from.value] != null || ing.measures[el.to.value] != null));
        el.why.textContent =
          pretty(amount) + " " + UNITS[el.from.value].label + " " + ing.name.toLowerCase() +
          " ≈ " + pretty(result) + " " + UNITS[el.to.value].label +
          (usedExact ? " · по таблица" : " · плътност " + ing.density.toFixed(2) + " г/мл");
      }
      if (SYNC_URL) {
        var q = new URLSearchParams({ ing: el.ing.value, from: el.from.value, to: el.to.value, amt: el.amt.value });
        history.replaceState(null, "", window.location.pathname + "?" + q.toString());
      }
    }

    /* ------------------------------ events ------------------------------ */
    [el.from, el.to, el.amt].forEach(function (node) {
      node.addEventListener("input", compute);
    });
    el.ing.addEventListener("input", function () {
      // auto-switch to-unit between g and ml when user picks a different ingredient
      var ing = ING[el.ing.value];
      if (ing && (el.to.value === "g" || el.to.value === "ml")) {
        el.to.value = ing.liquid ? "ml" : "g";
      }
      compute();
    });

    if (el.chips) {
      el.chips.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip) return;
        el.chips.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("on"); });
        chip.classList.add("on");
        if (chip.dataset.amt != null) el.amt.value = chip.dataset.amt;
        el.from.value = chip.dataset.from || "chasha"; // chips default to volume input
        compute();
      });
    }

    if (el.swap) {
      el.swap.addEventListener("click", function () {
        var f = el.from.value; el.from.value = el.to.value; el.to.value = f;
        compute();
      });
    }

    if (el.copy) {
      el.copy.addEventListener("click", function () {
        var txt = el.out.textContent.trim();
        var done = function () {
          el.copy.textContent = "Копирано ✓";
          setTimeout(function () { el.copy.textContent = "Копирай"; }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(done).catch(function () {});
        }
      });
    }

    compute();
  }

  // defer-safe: run now if DOM is ready, otherwise wait
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
