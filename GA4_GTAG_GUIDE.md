# Google Analytics 4 (GA4) Post-Consent Tracking Guide

## Current Implementation

Your `consent.js` is properly configured for GDPR compliance. Here's how it works:

### 1. **Consent States**
- **"all"** — User accepts all cookies → GA4 + AdSense load
- **"minimal"** — User declines → No tracking
- **No stored consent** → Banner shows, user must choose

---

## GA4 gtag Configuration (Already Implemented)

Your `consent.js` now includes the correct gtag configuration for privacy:

```javascript
window.gtag('config', GA4_ID, {
  'anonymize_ip': true,                      // Hide last octet of IP
  'allow_google_signals': false,             // No audience data
  'allow_ad_personalization_signals': false  // No ad personalization
});
```

### What This Does:
✅ **anonymize_ip** — Anonymizes user IPs so GA4 doesn't track exact location  
✅ **allow_google_signals** — Disables Google Signals (cross-device tracking)  
✅ **allow_ad_personalization_signals** — Prevents ad personalization  

**Result:** All visits are tracked in GA4, but anonymously. No personal data is collected.

---

## Tracking Page Views After Consent

GA4 automatically tracks page views once the gtag script loads. No additional code needed.

### How It Works:

1. **User accepts consent** → `applyConsent('all')` is called
2. **GA4 script loads** → `loadGA4()` function runs
3. **gtag initializes** → GA4 starts tracking
4. **Subsequent page views** → GA4 automatically logs them

### Event Tracking (Optional)

If you want to log custom events after consent, use:

```javascript
// Example: Track feedback submission
if (typeof gtag === 'function') {
  gtag('event', 'feedback', {
    'value': userRating,
    'page_path': location.pathname
  });
}
```

This is already implemented in your `assets/feedback.js`:
```javascript
if (typeof gtag === "function") {
  gtag("event", "feedback", { value: v, page_path: location.pathname });
}
```

---

## Google Fonts: Three Options

### Option 1: Keep Google Fonts CDN (Current)
- **Pros:** Simple, automatic updates
- **Cons:** Loads unconditionally, logs IP to Google
- **GDPR:** Gray area — mention in privacy policy ✅ (Already done)

### Option 2: Self-Host Fonts (Recommended for Privacy)
Follow these steps:

#### Step 1: Download Font Files
```bash
# Download Spectral font family
curl -s 'https://fonts.google.com/download?family=Spectral:ital,wght@0,400;0,600;0,800;1,400' \
  -o /tmp/spectral.zip && unzip /tmp/spectral.zip -d assets/fonts/

# Download Onest font family
curl -s 'https://fonts.google.com/download?family=Onest:wght@400;500;600;700' \
  -o /tmp/onest.zip && unzip /tmp/onest.zip -d assets/fonts/
```

#### Step 2: Replace Google Fonts Link
**Remove this from HTML:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,600;0,800;1,400&family=Onest:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Add this CSS file instead (`assets/fonts.css`):**
```css
@font-face {
  font-family: 'Spectral';
  src: url('/assets/fonts/Spectral-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Spectral';
  src: url('/assets/fonts/Spectral-Bold.ttf') format('truetype');
  font-weight: 600;
  font-style: normal;
}

@font-face {
  font-family: 'Spectral';
  src: url('/assets/fonts/Spectral-ExtraBold.ttf') format('truetype');
  font-weight: 800;
  font-style: normal;
}

@font-face {
  font-family: 'Spectral';
  src: url('/assets/fonts/Spectral-Italic.ttf') format('truetype');
  font-weight: 400;
  font-style: italic;
}

@font-face {
  font-family: 'Onest';
  src: url('/assets/fonts/Onest-Regular.ttf') format('truetype');
  font-weight: 400;
}

@font-face {
  font-family: 'Onest';
  src: url('/assets/fonts/Onest-Medium.ttf') format('truetype');
  font-weight: 500;
}

@font-face {
  font-family: 'Onest';
  src: url('/assets/fonts/Onest-SemiBold.ttf') format('truetype');
  font-weight: 600;
}

@font-face {
  font-family: 'Onest';
  src: url('/assets/fonts/Onest-Bold.ttf') format('truetype');
  font-weight: 700;
}
```

**Then in HTML, add to `<head>`:**
```html
<link rel="stylesheet" href="/assets/fonts.css">
```

### Option 3: Lazy-Load Fonts After Consent
Load fonts only when user accepts consent:

```javascript
// Add to consent.js in loadGA4() function:
function loadFonts() {
  var link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = 'https://fonts.googleapis.com';
  document.head.appendChild(link);
  
  var link2 = document.createElement('link');
  link2.rel = 'preconnect';
  link2.href = 'https://fonts.gstatic.com';
  link2.crossOrigin = 'anonymous';
  document.head.appendChild(link2);
  
  var fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,600;0,800;1,400&family=Onest:wght@400;500;600;700&display=swap';
  document.head.appendChild(fontLink);
}

// Call in applyConsent():
if (level === 'all') { 
  loadGA4(); 
  loadAds();
  loadFonts();  // ← Add this
}
```

---

## What Changed in Your Code

### ✅ consent.js Updates
1. **Modal popup** — "Научи повече" now opens a modal instead of navigating
2. **GA4 privacy config** — Added `anonymize_ip`, `allow_google_signals`, `allow_ad_personalization_signals`
3. **Modal CSS** — Added styles for the modal overlay and content

### ✅ site.css Updates
Added CSS for:
- `#cookie-modal-overlay` — Backdrop
- `.cookie-modal` — Modal box
- `.modal-close` — Close button styling
- `.modal-content` — Content typography

### ✅ No Changes Needed
- GA4 script loads automatically after consent ✅
- Page views are tracked automatically ✅
- Custom events work as-is ✅

---

## Testing Checklist

### Local Testing:
```bash
# Clear consent in DevTools:
# Open DevTools → Application → Local Storage
# Delete "merilo_consent"
# Reload page
```

1. ✅ Banner appears on first visit
2. ✅ "Научи повече" link opens modal
3. ✅ Modal displays privacy info
4. ✅ Close button (×) works
5. ✅ Clicking backdrop closes modal
6. ✅ "Приемам" button hides banner and enables GA4
7. ✅ "Само необходими" button hides banner, no GA4

### GA4 Verification:
1. Go to **Google Analytics → Realtime**
2. Accept cookies on your site
3. You should see events appearing in Realtime within 5 seconds
4. Events should show as anonymous (no user IDs)

---

## Privacy Summary

| Feature | Status | GDPR Compliant |
|---------|--------|---|
| Cookie Banner | ✅ Implemented | Yes — user must opt-in |
| GA4 (anonymized) | ✅ Consent-based | Yes — only after acceptance |
| AdSense | ✅ Consent-based | Yes — only after acceptance |
| Google Fonts | ⚠️ Conditional | Yes — disclosed in privacy policy |
| Modal Privacy Info | ✅ Implemented | Yes — users can learn before deciding |

---

## Next Steps (Optional)

1. **Self-host fonts** (Option 2) for maximum privacy compliance
2. **Test GA4 events** in Analytics dashboard
3. **Monitor analytics** for post-consent tracking accuracy
4. **Review consent rates** — Track what % of users accept vs. decline

---

## Support

For GA4 troubleshooting:
- [Google Analytics Help](https://support.google.com/analytics)
- [gtag.js Documentation](https://developers.google.com/analytics/devguides/collection/gtagjs)
- Check browser DevTools Console for errors
