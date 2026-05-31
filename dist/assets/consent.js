/*!
 * consent.js — cookie consent banner + conditional GA4 / AdSense loader
 * GDPR / ePrivacy compliant. No external dependencies.
 */
(function () {
  'use strict';

  var KEY         = 'merilo_consent';   // localStorage key
  var GA4_ID      = 'G-T53EWB6WNB';
  var ADSENSE_PUB = 'ca-pub-6774843990559946';

  /* ---------- loaders ------------------------------------------------------ */
  function loadGA4() {
    if (!GA4_ID) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID);
  }

  function loadAds() {
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUB;
    document.head.appendChild(s);
  }

  /* ---------- banner ------------------------------------------------------- */
  function applyConsent(level) {
    try { localStorage.setItem(KEY, level); } catch (e) {}
    if (level === 'all') { loadGA4(); loadAds(); }
    removeBanner();
  }

  function removeBanner() {
    var b = document.getElementById('cookie-banner');
    if (b) b.parentNode.removeChild(b);
  }

  function showBanner() {
    if (document.getElementById('cookie-banner')) return;
    var b = document.createElement('div');
    b.id = 'cookie-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Съгласие за бисквитки');
    b.innerHTML =
      '<p class="cookie-banner__text">Използваме бисквитки за реклами и анализ на посещаемостта.' +
      ' <a href="/bg/poveritelnost/">Научи повече</a></p>' +
      '<div class="cookie-banner__actions">' +
      '<button id="consent-all" class="cookie-btn cookie-btn--accept">Приемам</button>' +
      '<button id="consent-min" class="cookie-btn cookie-btn--decline">Само необходими</button>' +
      '</div>';
    document.body.appendChild(b);
    document.getElementById('consent-all').addEventListener('click', function () { applyConsent('all'); });
    document.getElementById('consent-min').addEventListener('click', function () { applyConsent('minimal'); });
  }

  /* ---------- init --------------------------------------------------------- */
  var stored;
  try { stored = localStorage.getItem(KEY); } catch (e) {}

  if (stored === 'all') {
    loadGA4();
    loadAds();
  } else if (!stored) {
    // First visit — show banner after DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
  // stored === 'minimal': no ads, no analytics, no banner — nothing to do
})();
