/**
 * products.bg.js — Affiliate product data for kitchen scales (BG).
 * ---------------------------------------------------------------------------
 * Same IIFE / globalThis pattern as faqs.bg.js so build.mjs can load it with
 * the identical `new Function("globalThis", readFileSync(...))` trick.
 *
 * Retailer abstraction:
 *   type "affiliate" → render outbound link (affiliateUrl resolved via AFFILIATE)
 *   type "self"      → stubbed for future direct-sales path (no products yet)
 *
 * Fill in AFFILIATE URLs and product details (name, image, priceDisplay, blurb)
 * after registering on Profitshare / Amazon PartnerNet. The build succeeds with
 * "#" placeholders — cards render, links are inert.
 * ---------------------------------------------------------------------------
 */
(function (root) {
  'use strict';

  // ── Affiliate URL config ─────────────────────────────────────────────────
  // ONE place for Mladen to paste real deep links.
  var AFFILIATE = {
    AFFILIATE_URL_BASIC:    '#', // TODO: eMAG Profitshare deep link
    AFFILIATE_URL_STANDARD: '#', // TODO: eMAG Profitshare deep link
    AFFILIATE_URL_SMART:    '#'  // TODO: Amazon.de PartnerNet link
  };

  // ── Retailer registry ────────────────────────────────────────────────────
  var RETAILERS = {
    emag: {
      type:        'affiliate',
      name:        'eMAG',
      cookieDays:  7,
      note:        'Доставка до врата в България'
    },
    amazon_de: {
      type:        'affiliate',
      name:        'Amazon.de',
      cookieDays:  1,
      note:        'Доставка до България, понякога безплатна'
    },
    self: {
      type:        'self',
      name:        'Мерило'
      // future: price, stock, buy-URL fields go here
    }
  };

  // ── Products ─────────────────────────────────────────────────────────────
  // Images must be raster (jpg/webp) — never SVG.
  var PRODUCTS = [
    {
      id:           'basic-5kg',
      tier:         'budget',
      retailer:     'emag',
      name:         '',               // TODO: confirm model name
      image:        '',               // TODO: raster product image URL (jpg/webp)
      priceDisplay: '',               // TODO: e.g. "~25 лв." — display only
      affiliateUrl: 'AFFILIATE_URL_BASIC',
      specs: {
        capacityKg: 5,
        precisionG: 1,
        tare:       true,
        units:      ['g', 'ml'],
        bluetooth:  false
      },
      pros:  ['Точност до 1 г', 'Тара функция', 'Достъпна цена'],
      cons:  ['Без приложение'],
      blurb: 'За тези, които искат точност, без да плащат за допълнителни екстри.'
    },
    {
      id:           'standard-5kg',
      tier:         'standard',
      retailer:     'emag',
      name:         '',
      image:        '',
      priceDisplay: '',
      affiliateUrl: 'AFFILIATE_URL_STANDARD',
      specs: {
        capacityKg: 5,
        precisionG: 1,
        tare:       true,
        units:      ['g', 'ml', 'oz', 'lb'],
        bluetooth:  false
      },
      pros:  ['Точност до 1 г', 'Тара функция', 'Повече мерни единици'],
      cons:  ['Без приложение'],
      blurb: 'Най-добрият баланс между цена, точност и удобство за повечето домакинства.'
    },
    {
      id:           'smart-bt',
      tier:         'smart',
      retailer:     'amazon_de',
      name:         '',
      image:        '',
      priceDisplay: '',
      affiliateUrl: 'AFFILIATE_URL_SMART',
      specs: {
        capacityKg:   5,
        precisionG:   1,
        tare:         true,
        units:        ['g', 'ml', 'oz'],
        bluetooth:    true,
        appLanguages: ['en', 'de'] // surfaced honestly — app not in Bulgarian
      },
      pros:  ['Bluetooth + приложение', 'База с хранителни стойности', 'Проследяване на калории/макроси'],
      cons:  ['Приложението не е на български', 'По-висока цена'],
      blurb: 'Смарт везна с приложение — за тези, които следят хранителни стойности.'
    }
  ];

  // ── Helpers ──────────────────────────────────────────────────────────────
  function getProductsByTier(tier) {
    return PRODUCTS.filter(function (p) { return p.tier === tier; });
  }

  function resolveUrl(product) {
    return AFFILIATE[product.affiliateUrl] || '#';
  }

  var api = {
    AFFILIATE:         AFFILIATE,
    RETAILERS:         RETAILERS,
    PRODUCTS:          PRODUCTS,
    getProductsByTier: getProductsByTier,
    resolveUrl:        resolveUrl
  };

  root.__KITCHEN_PRODUCTS__ = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
