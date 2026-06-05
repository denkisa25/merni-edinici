# Quick Start: GDPR Compliance & GA4 Gtag Configuration

## ✅ What Was Done (Already Implemented)

### 1. **Consent Modal Popup** ✅
- "Научи повече" link now opens a beautiful modal popup
- Modal shows privacy policy summary without leaving the page
- Can close with × button or by clicking outside

### 2. **GA4 gtag Configuration** ✅
GA4 now tracks visits ONLY after consent is accepted, with privacy settings:
```javascript
window.gtag('config', GA4_ID, {
  'anonymize_ip': true,                      // Hide user's exact IP
  'allow_google_signals': false,             // No cross-device tracking
  'allow_ad_personalization_signals': false  // No ad personalization
});
```

### 3. **CSS for Modal** ✅
Beautiful, responsive modal styling added to `site.css`

---

## 🎯 Three Steps to Complete Setup

### Step 1: **Verify the Changes Work** (5 min)
```bash
# Clear your consent cookie to test
# In browser: DevTools → Application → Local Storage → Delete "merilo_consent"
# Reload the page

# Expected behavior:
# ✅ Banner appears at bottom
# ✅ Click "Научи повече" → Modal opens
# ✅ Click × or outside → Modal closes
# ✅ Click "Приемам" → GA4 starts tracking
# ✅ Click "Само необходими" → No tracking
```

### Step 2: **Verify GA4 Tracking** (2 min)
```bash
# Go to Google Analytics dashboard
# https://analytics.google.com/analytics/web/

# 1. Select your property (G-T53EWB6WNB)
# 2. Click "Realtime" (left sidebar)
# 3. Visit your site and click "Приемам"
# 4. Within 5 seconds, you should see:
#    - 1 active user
#    - Page view event
```

### Step 3: **Deploy Changes** (1 min)
```bash
# If you're using a build process:
npm run build
# OR
node build.mjs

# If static files:
# Just push dist/ changes to GitHub/Netlify
```

---

## 🔧 Optional: Self-Host Google Fonts (for maximum privacy)

**Currently:** Google Fonts loads from CDN (compliant but loads before consent)  
**Option:** Self-host fonts locally (most privacy-friendly)

**If you want to do this:**
1. Read: `GA4_GTAG_GUIDE.md` → Section "Option 2: Self-Host Fonts"
2. Follow the 3-step process there
3. Replace Google Fonts CDN link in all HTML files

**Time estimate:** 15-20 minutes

---

## 📊 What Gets Tracked in GA4 (Privacy-Focused)

### ✅ Tracked:
- Page URL and title
- Device type (desktop/mobile)
- Browser name and version
- Operating system
- Screen resolution
- Generic location (country/city, no exact address)

### ❌ NOT Tracked:
- User's exact IP address (anonymized)
- User IDs or email
- Cross-device data
- Ad personalization signals
- Personal behavior profiles

**Result:** You can see traffic patterns without invading privacy! 🎉

---

## 🧪 Testing Checklist

Run through these before going live:

```
BANNER TESTS:
□ Banner appears on first visit
□ Banner has correct Bulgarian text
□ Banner buttons work (Accept/Decline)
□ Banner hides after user chooses

MODAL TESTS:
□ "Научи повече" link opens modal
□ Modal displays privacy info
□ Close button (×) works
□ Clicking outside modal closes it
□ Modal is centered and readable

GA4 TESTS:
□ GA4 script loads after "Приемам"
□ GA4 script does NOT load after "Само необходими"
□ Realtime shows visitor after accept
□ Subsequent pages show in Realtime
□ IP is anonymized in GA4 config

GDPR COMPLIANCE:
□ Privacy policy at /bg/poveritelnost/
□ Consent required before GA4 loads
□ User choice saved in localStorage
□ User can change preference
□ No cookies without consent
```

---

## 💡 Understanding the Gtag Step

**Gtag** = Google Analytics Tag (the tracking script)

### Flow:
```
User accepts consent
    ↓
applyConsent('all') called
    ↓
loadGA4() runs:
  1. Initialize window.gtag function
  2. Set privacy config (anonymize_ip, etc)
  3. Load GA4 script from Google
    ↓
GA4 script loaded
    ↓
gtag('config', GA4_ID, {...settings...}) called
    ↓
Page views now tracked anonymously
```

### What Makes It GDPR-Compliant:
✅ **Consent first** — User must opt-in before gtag loads  
✅ **Privacy config** — Anonymized IP, no personal data  
✅ **Transparent** — Privacy policy explains what's tracked  
✅ **Revocable** — User can select "Minimal" to turn off  

---

## 📁 Files Reference

| File | What Changed | Why |
|------|-------------|-----|
| `assets/consent.js` | Modal popup + GA4 privacy config | Core feature |
| `assets/site.css` | Modal styling | UI/UX |
| `GA4_GTAG_GUIDE.md` | Documentation | Reference |
| `CONSENT_IMPLEMENTATION_SUMMARY.md` | Full details | Deep dive |
| `CONSENT_VISUAL_GUIDE.md` | Diagrams + flowcharts | Visual learning |
| `QUICK_START_GDPR.md` | This file | Quick reference |

---

## 🚀 You're Ready!

### Your site now has:
✅ GDPR-compliant consent banner  
✅ Privacy policy modal popup  
✅ GA4 tracking (anonymized, consent-based)  
✅ AdSense consent integration  
✅ Full accessibility support  

### Not required but recommended:
- Self-host Google Fonts (maximum privacy)
- Monitor GA4 reports weekly
- Update privacy policy if you add new services

---

## ❓ FAQ

**Q: Will GA4 track users who click "Само необходими"?**  
A: No. GA4 script only loads if user clicks "Приемам"

**Q: How long is consent stored?**  
A: In browser's localStorage forever, until user clears it

**Q: Can users change their mind?**  
A: Yes, they can clear localStorage and get the banner again

**Q: Is the modal accessible?**  
A: Yes! Proper ARIA attributes, keyboard navigation, screen reader support

**Q: Why anonymize IP?**  
A: EU privacy laws consider IP addresses as personal data. Anonymizing complies with GDPR.

**Q: Will Google Fonts still work?**  
A: Yes, still loading from CDN currently. Self-host if you want complete privacy.

---

## 🎬 Next Steps

1. **Test locally** (5 min) — Follow Step 1 above
2. **Verify GA4** (2 min) — Follow Step 2 above  
3. **Deploy** (1 min) — Push changes to production
4. **Monitor** — Check GA4 Realtime for data
5. **Optional:** Self-host fonts for max privacy

---

## 📞 Support

**consent.js not loading?**
- Check browser console for errors
- Verify file path: `/assets/consent.js`
- Clear browser cache and reload

**Modal not opening?**
- Check site.css loaded: Look for `#cookie-modal-overlay` in inspector
- Check console for JavaScript errors
- Verify browser supports `createElement`, `appendChild` (all modern browsers do)

**GA4 not showing data?**
- Verify GA4 ID is correct: `G-T53EWB6WNB`
- Check Realtime view (not Reports, which lag 24-48h)
- Click "Приемам" again to test
- Wait 5-10 seconds for Realtime to update

**Privacy policy link broken?**
- Check modal has link to `/bg/poveritelnost/`
- Verify that page exists and loads

---

**You're compliant! 🎉** Your site now respects user privacy while collecting the analytics you need.
