/*!
 * consent.js — cookie consent banner + conditional GA4 / AdSense loader + privacy modal
 * GDPR / ePrivacy compliant. No external dependencies.
 */
(function () {
  'use strict';
  console.log('[consent.js] Script loaded and executing');

  var KEY         = 'merilo_consent';   // localStorage key
  var GA4_ID      = 'G-T53EWB6WNB';
  var ADSENSE_PUB = 'ca-pub-6774843990559946';

  /* ---------- loaders ------------------------------------------------------ */
  function loadGA4() {
    if (!GA4_ID) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, {
      'anonymize_ip': true,
      'allow_google_signals': false,
      'allow_ad_personalization_signals': false
    });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);
  }

  function loadAds() {
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_PUB;
    document.head.appendChild(s);
  }

  /* ---------- modal ------------------------------------------------------- */
  function createModal() {
    var overlay = document.createElement('div');
    overlay.id = 'cookie-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Политика за поверителност');

    var modal = document.createElement('div');
    modal.className = 'cookie-modal';
    modal.innerHTML =
      '<button id="modal-close" class="modal-close" aria-label="Затвори">&times;</button>' +
      '<h2>Политика за поверителност</h2>' +
      '<div class="modal-content">' +
      '<h3>Какви данни събираме</h3>' +
      '<p><strong>При дадено съгласие:</strong></p>' +
      '<ul>' +
      '<li><strong>Google Analytics 4</strong> — анонимни данни за посещаемостта, браузър, устройство</li>' +
      '<li><strong>Google AdSense</strong> — персонализирани реклами (бисквитки)</li>' +
      '<li><strong>Google Fonts</strong> — използваме шрифтове от Google, което предава IP адреса ви</li>' +
      '</ul>' +
      '<p><strong>При всеки случай:</strong></p>' +
      '<ul>' +
      '<li>Вашият избор се запазва локално (localStorage) — НЕ се пращат на сървър</li>' +
      '<li>Всички данни са анонимни — без лична информация</li>' +
      '</ul>' +
      '<p><a href="/bg/poveritelnost/" target="_blank" rel="noopener">Прочетете пълната политика →</a></p>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
  }

  function closeModal() {
    var overlay = document.getElementById('cookie-modal-overlay');
    if (overlay) overlay.parentNode.removeChild(overlay);
  }

  function showModal() {
    if (!document.getElementById('cookie-modal-overlay')) {
      createModal();
    }
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
    console.log('[consent.js] showBanner() called');
    if (document.getElementById('cookie-banner')) {
      console.log('[consent.js] banner already exists, skipping');
      return;
    }
    console.log('[consent.js] creating banner');
    var b = document.createElement('div');
    b.id = 'cookie-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Съгласие за бисквитки');

    var text = document.createElement('p');
    text.className = 'cookie-banner__text';
    text.textContent = 'Използваме бисквитки за реклами и анализ на посещаемостта. ';

    var learnBtn = document.createElement('button');
    learnBtn.id = 'learn-more-link';
    learnBtn.textContent = 'Научи повече';
    learnBtn.style.cssText = 'background:none;border:none;color:#f5c77e;text-decoration:underline;cursor:pointer;font:inherit;font-size:inherit;padding:0;margin:0;margin-left:0;';
    learnBtn.addEventListener('click', showModal);
    text.appendChild(learnBtn);

    var actions = document.createElement('div');
    actions.className = 'cookie-banner__actions';

    var acceptBtn = document.createElement('button');
    acceptBtn.id = 'consent-all';
    acceptBtn.className = 'cookie-btn cookie-btn--accept';
    acceptBtn.textContent = 'Приемам';
    acceptBtn.addEventListener('click', function () { applyConsent('all'); });

    var declineBtn = document.createElement('button');
    declineBtn.id = 'consent-min';
    declineBtn.className = 'cookie-btn cookie-btn--decline';
    declineBtn.textContent = 'Само необходими';
    declineBtn.addEventListener('click', function () { applyConsent('minimal'); });

    actions.appendChild(acceptBtn);
    actions.appendChild(declineBtn);

    b.appendChild(text);
    b.appendChild(actions);
    document.body.appendChild(b);
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
