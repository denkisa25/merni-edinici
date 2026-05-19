<!-- GSD:project-start source:PROJECT.md -->
## Project

**Мерни Единици в Кухнята**

A Bulgarian-language web app that lets home cooks — including those with little internet experience — instantly convert Bulgarian kitchen measurements (чаена лъжица, супена лъжица, чаена чаша, кафена чаша) to grams and milliliters for common ingredients. The interface is styled like an intuitive calculator so users never need instructions to understand it.

**Core Value:** A Bulgarian home cook picks an ingredient, selects a unit, enters a quantity, and immediately sees the gram/ml equivalent — no scrolling, no reading, no confusion.

### Constraints

- **Language**: Bulgarian-only UI — all labels, units, ingredient names in Bulgarian
- **Stack**: Must be deployable as a fully static site (no server, no database)
- **UX**: Must be usable without any instructions — calculator-style metaphor
- **Accessibility**: Large touch targets, readable font sizes for older users
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Language | Vanilla HTML/CSS/JavaScript | ES2022+ (no transpile) | No build step required |
| Bundler/Toolchain | Vite | 5.x | Optional but recommended for PWA plugin |
| PWA | vite-plugin-pwa | 0.20.x | Wraps Workbox; zero-config service worker |
| Service Worker | Workbox (via plugin) | 7.x | Cache-first strategy for full offline |
| CSS | Plain CSS with custom properties | — | No framework; hand-written is fastest |
| Font | Noto Sans / Noto Sans Display | Latest (Google Fonts) | Best Cyrillic coverage + free + hinted |
| Deployment | GitHub Pages or Netlify | — | Both support static, free tier sufficient |
| Version control | Git | — | Standard |
## Rationale
### Vanilla JS — not a framework
### Vite as toolchain (optional but worth it)
- Fast local dev server with HMR
- Automatic asset hashing for cache-busting on deploy
- The PWA plugin, which makes service worker setup a single config block
### PWA via vite-plugin-pwa + Workbox
### Plain CSS — no Tailwind, no CSS-in-JS
### Noto Sans for Cyrillic
- Free and open source (SIL OFL)
- Rendered correctly on all platforms including Android 8+ and iOS 14+
- Designed specifically to avoid tofu (missing glyph boxes) across scripts
### GitHub Pages vs Netlify vs Vercel
| Host | Pros | Cons |
|------|------|------|
| GitHub Pages | Zero new account if repo is on GitHub; push-to-deploy via Actions | No built-in form handling (not needed here); custom domain needs CNAME |
| Netlify | Drag-and-drop deploy; automatic HTTPS; deploy previews | Another account |
| Vercel | Fast CDN; good DX | Optimized for Next.js; overkill for vanilla static |
## What NOT to Use
### React
### Vue 3
### Svelte / SvelteKit
### Next.js / Nuxt
### Tailwind CSS
### i18n libraries (i18next, vue-i18n, etc.)
### IndexedDB / localStorage persistence
### TypeScript (at v1)
## Cyrillic-Specific Notes
## Confidence
| Decision | Confidence | Basis |
|----------|-----------|-------|
| Vanilla JS (no framework) | HIGH | Well-established principle: use the simplest tool that solves the problem. App complexity does not justify a framework. |
| Vite 5.x | HIGH | Dominant standard for vanilla and framework builds as of 2025; stable major version; no viable challenger for this use case. |
| vite-plugin-pwa + Workbox 7 | HIGH | Official Workbox is Google-maintained; vite-plugin-pwa is the de facto standard integration. Version numbers accurate to training cutoff Aug 2025. |
| Plain CSS | HIGH | No complexity justifies a CSS framework for a single-screen calculator UI. |
| Noto Sans for Cyrillic | HIGH | Noto is explicitly designed for cross-script Unicode coverage; this is the canonical recommendation for Cyrillic on the web. |
| GitHub Pages deployment | HIGH | Mature, free, zero-dependency hosting for static sites. |
| No TypeScript at v1 | MEDIUM | Judgment call — a counter-argument exists if the team prefers type safety from day one. Low risk either way. |
| Google Fonts CDN for Noto | MEDIUM | Works for most users. For strict offline-first, self-host the font files in the repo and cache them via the service worker. GDPR note: Google Fonts CDN logs IPs; self-hosting avoids this entirely. |
## Open Questions for Roadmap
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
