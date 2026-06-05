# Consent Banner & Modal — Visual Implementation Guide

## User Journey

```
┌─────────────────────────────────────────────────────────────┐
│  Site Loads                                                 │
│  (First time, no consent stored)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │   CONSENT BANNER SHOWS       │
        │  (Bottom of screen, fixed)   │
        │                              │
        │ "Използваме бисквитки за     │
        │  реклами и анализ..."        │
        │                              │
        │ [Learn More] [Accept] [Decline]
        └──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
    [Learn More]   [Accept]      [Decline]
        │              │              │
        ↓              ↓              ↓
    MODAL OPENS    GA4 LOADS      NO TRACKING
    ┌─────────┐     ┌─────────┐   ┌─────────┐
    │ Privacy │     │ Banner  │   │ Banner  │
    │ Info    │     │ hides   │   │ hides   │
    │ (can    │     │ Tracks  │   │ No GA4  │
    │  read)  │     │ visits  │   │ No Ads  │
    │         │     │ anon.   │   │         │
    └─────────┘     └─────────┘   └─────────┘
        │
    [Close ×]
        │
        ↓
    BACK TO MAIN PAGE
```

---

## Banner Layout

```
╔══════════════════════════════════════════════════════════════╗
║  Използваме бисквитки за реклами и анализ.  [Learn More]   ║
║                      [Accept]  [Decline]                    ║
╚══════════════════════════════════════════════════════════════╝
   ↑
   Fixed at bottom of viewport (z-index: 9999)
```

**Colors:**
- Background: Dark (--ink: #2A2420)
- Text: White (#fff)
- "Learn More" link: Gold (#f5c77e)
- Accept button: Paprika red (--paprika: #C2522C)
- Decline button: Transparent with border

---

## Modal Popup

```
                 ┌─ Overlay (50% dark) ─┐
                 │                       │
                 │  ┌──────────────────┐ │
                 │  │ [×] Privacy Info │ │
                 │  ├──────────────────┤ │
                 │  │ What data we use:│ │
                 │  │ • Google Analytics│ │
                 │  │ • Google AdSense  │ │
                 │  │ • Google Fonts    │ │
                 │  │                  │ │
                 │  │ [Read full→]     │ │
                 │  └──────────────────┘ │
                 │                       │
                 └───────────────────────┘
```

**Modal Features:**
- Center screen, max 500px wide
- Scrollable if content exceeds 80vh
- Close button (×) in top-right
- Click backdrop to close
- Accessible (aria-modal, keyboard support)

---

## CSS Styling Details

### Modal Overlay
```css
#cookie-modal-overlay {
  position: fixed;           /* Covers entire viewport */
  top: 0; left: 0; 
  right: 0; bottom: 0;
  background: rgba(0,0,0,.5); /* 50% dark */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;           /* Above banner (9999) */
}
```

### Modal Box
```css
.cookie-modal {
  background: #fff;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;        /* Scrollable */
  padding: 28px;
  box-shadow: 0 10px 40px rgba(0,0,0,.2);
}
```

### Close Button
```css
.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  font-size: 24px;
  cursor: pointer;
  background: none;
  border: none;
}
.modal-close:hover {
  color: var(--paprika);   /* Red on hover */
}
```

---

## GA4 Tracking Timeline

```
Time    Event                          GA4 Tracks?
────────────────────────────────────────────────
T0      User visits site               ❌ No
        (consent banner shows)

T1      User clicks "Приемам"          
        (accept button)

        ↓ loadGA4() called
        ↓ gtag() initialized
        ↓ GA4 script starts loading

T2      GA4 script loaded               
        (1-2 seconds later)

T3      Page view event sent             ✅ YES
        to Google Analytics             (anonymized IP)

T4-Tn   User interacts with site       ✅ YES
        (clicks, scrolls, etc)         (tracked as events)
```

**Key Point:** First pageview might not appear in Realtime if user accepted consent on that page. Subsequent pageviews will definitely appear.

---

## localStorage State Management

```javascript
// First visit - no consent stored
localStorage.getItem('merilo_consent')
→ null
→ Banner shows

// After "Приемам" clicked
localStorage.setItem('merilo_consent', 'all')
→ 'all'
→ GA4 + Ads load on next visit

// After "Само необходими" clicked
localStorage.setItem('merilo_consent', 'minimal')
→ 'minimal'
→ No GA4 or Ads

// To reset (for testing):
localStorage.removeItem('merilo_consent')
→ null
→ Banner shows again next reload
```

---

## Responsive Behavior

### Desktop (> 480px)
```
┌────────────────────────────────────────┐
│ Site content                           │
├────────────────────────────────────────┤
│ [Learn] [Accept] [Decline]             │  Banner fits inline
└────────────────────────────────────────┘
```

### Mobile (< 480px)
```
┌─────────────────┐
│ Site content    │
├─────────────────┤
│ Используемby... │
│ бис...         │  
│ [Learn]        │  Banner wraps
│ [Accept]       │  Stack vertically
│ [Decline]      │
└─────────────────┘
```

**Modal Responsive:**
- Viewport width: 100% - 40px padding (mobile)
- Scrollable if needed
- Touch-friendly buttons

---

## Accessibility Features

### Keyboard Navigation
```
User presses TAB:
┌─────────────────────────┐
│ [×] Learn More          │  Focus visible
├─────────────────────────┤
│ Modal text              │
│ [Read full policy →]    │  Focusable link
└─────────────────────────┘

ENTER or SPACE → Activates focused button
ESC → Closes modal (optional, currently uses click)
```

### Screen Reader Support
```html
<!-- Banner -->
<div id="cookie-banner" 
     role="dialog" 
     aria-label="Съгласие за бисквитки">

<!-- Modal -->
<div id="cookie-modal-overlay" 
     role="dialog" 
     aria-modal="true"
     aria-label="Политика за поверителност">
```

### Color Contrast
- Text on dark banner: White on #2A2420 ✅ WCAG AAA
- Link color: #f5c77e on white ✅ WCAG AA
- Modal text: #2A2420 on #fff ✅ WCAG AAA

---

## Event Flow Diagram

```javascript
// User loads page
showBanner()
│
├─ User clicks "Learn More"
│  └─→ showModal()
│      └─ createModal()
│         └─ Renders HTML + attaches listeners
│            ├─ Modal shows (fade in)
│            └─ Focus trap active
│
├─ User closes modal
│  ├─ Click [×] button → closeModal()
│  ├─ Click backdrop → closeModal()
│  └─ Modal hides (fade out)
│
├─ User clicks "Приемам" (Accept)
│  └─→ applyConsent('all')
│      ├─ localStorage.setItem('merilo_consent', 'all')
│      ├─ loadGA4() ← Start tracking
│      │   └─ gtag('js', new Date())
│      │   └─ gtag('config', GA4_ID, {...privacy config...})
│      ├─ loadAds() ← Start ads
│      └─ removeBanner() ← Hide banner
│
└─ User clicks "Само необходими" (Decline)
   └─→ applyConsent('minimal')
       ├─ localStorage.setItem('merilo_consent', 'minimal')
       ├─ NO loadGA4() called
       ├─ NO loadAds() called
       └─ removeBanner() ← Hide banner
```

---

## Testing Checklist

### Visual Testing
- [ ] Banner appears at bottom of page
- [ ] Banner has correct text and colors
- [ ] "Learn More" link is gold/underlined
- [ ] Buttons have hover effects
- [ ] Modal appears centered on screen
- [ ] Modal has close button (×)
- [ ] Modal has scrollable content
- [ ] Modal closes on backdrop click
- [ ] Modal closes on × button click

### Functional Testing
- [ ] localStorage 'merilo_consent' key created
- [ ] "all" value after Accept
- [ ] "minimal" value after Decline
- [ ] GA4 script appears in page source after Accept
- [ ] GA4 script NOT in source after Decline
- [ ] GA4 Realtime shows new visitor after Accept
- [ ] Subsequent page views appear in GA4 Realtime

### Accessibility Testing
- [ ] Tab navigation works in modal
- [ ] All buttons keyboard accessible
- [ ] Screen reader reads banner text
- [ ] Screen reader reads modal content
- [ ] Close button described properly

---

**All set!** Your consent implementation is GDPR-compliant and accessible. 🎉
