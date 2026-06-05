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
    if (!GA4_ID) {
      console.log('[consent.js] GA4_ID not set, skipping GA4');
      return;
    }
    console.log('[consent.js] Loading GA4 with ID: ' + GA4_ID);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, {
      'anonymize_ip': true,
      'allow_google_signals': false,
      'allow_ad_personalization_signals': false
    });
    console.log('[consent.js] gtag configured, loading gtag.js script');

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    s.onload = function() { console.log('[consent.js] gtag.js script loaded successfully'); };
    s.onerror = function() { console.error('[consent.js] Failed to load gtag.js script'); };
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
      '<h3>1. Кой управлява уебсайта</h3>' +
      '<p>Merilo.Pro е безплатен инструмент за кухненски мерки. За въпроси относно данните: <a href="mailto:info@merilo.pro">info@merilo.pro</a></p>' +
      '<h3>2. Какви данни събираме</h3>' +
      '<p><strong>Данни за посещаемостта</strong> (само при дадено съгласие): Google Analytics 4 събира анонимни данни за посетените страници, устройството и браузъра. Информацията е агрегирана и не съдържа лични данни.</p>' +
      '<p><strong>Рекламни данни</strong> (само при дадено съгласие): Google AdSense поставя бисквитки за показване на персонализирани реклами.</p>' +
      '<p><strong>Предпочитания за бисквитки</strong>: Вашият избор се запазва в локалната памет на браузъра (localStorage) само на вашето устройство. Не се изпращат данни към сървър.</p>' +
      '<h3>3. Бисквитки (Cookies)</h3>' +
      '<p>Сайтът може да използва следните видове бисквитки:</p>' +
      '<ul>' +
      '<li><strong>Строго необходими</strong> — запазват предпочитанията ви за поверителност. Не изискват съгласие.</li>' +
      '<li><strong>Аналитични</strong> (при съгласие) — Google Analytics 4 измерва посещаемостта анонимно.</li>' +
      '<li><strong>Рекламни</strong> (при съгласие) — Google AdSense/DoubleClick показва релевантни реклами.</li>' +
      '</ul>' +
      '<p>Можете да оттеглите съгласието си по всяко време, като изчистите ключа <code>merilo_consent</code> от локалната памет на браузъра (DevTools → Application → Local Storage) и презаредите страницата.</p>' +
      '<h3>4. Как да откажете или промените настройките</h3>' +
      '<ul>' +
      '<li>Opt-out от персонализирани реклами: <a href="https://adssettings.google.com" target="_blank" rel="noopener">adssettings.google.com</a></li>' +
      '<li>Opt-out от Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">tools.google.com/dlpage/gaoptout</a></li>' +
      '<li>Политика на Google: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">policies.google.com/technologies/ads</a></li>' +
      '</ul>' +
      '<h3>5. Партньорски и спонсорирани връзки</h3>' +
      '<p>Сайтът може да съдържа партньорски (афилиейт) връзки. При покупка чрез тях може да получим комисиона <strong>без допълнителна цена за вас</strong>. Партньорските връзки са обозначени и не влияят на съдържанието или препоръките ни.</p>' +
      '<h3>6. Трети страни</h3>' +
      '<p>Използваме услуги на следните трети страни:</p>' +
      '<ul><li>Google LLC (Analytics, AdSense, Fonts) — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></li></ul>' +
      '<h3>7. Вашите права (GDPR)</h3>' +
      '<p>Ако сте жител на ЕС/ЕИП, имате право да поискате достъп, коригиране или изтриване на свързаните с вас данни. Тъй като не събираме лична информация директно, повечето права се упражняват спрямо Google (вж. т. 4). За въпроси пишете на <a href="mailto:info@merilo.pro">info@merilo.pro</a>.</p>' +
      '<h3>8. Промени в политиката</h3>' +
      '<p>При съществени промени датата „Последна актуализация" ще бъде обновена. Препоръчваме периодично да преглеждате тази страница.</p>' +
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
