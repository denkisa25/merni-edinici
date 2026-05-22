---
phase: 04-deploy
plan: 01
subsystem: infra
tags: [cpanel, deploy, static-site, rsync, vite, subdirectory]

# Dependency graph
requires:
  - phase: 03-ux
    provides: Complete Vite-built app (index.html, hashed assets, fonts)
provides:
  - Live production site at https://ochen-lekar.com/merni-edinici/
  - .cpanel.yml deployment file (rsync-only strategy)
  - dist/ committed to git for cPanel rsync
  - vite.config.js base path set to /merni-edinici/
affects: [04-02, future-deploy, future-pwa]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "pre-built dist/ committed to git — cPanel rsync-only, no server-side Node.js"
    - "Vite base path set to subdirectory (/merni-edinici/) for correct asset URL resolution"

key-files:
  created: [.cpanel.yml, dist/index.html, dist/assets/index-Cle5yi6q.js, dist/assets/index-Dz8eTdRW.css]
  modified: [.gitignore, vite.config.js]

key-decisions:
  - "Abandoned server-side npm ci + npm run build on cPanel — npm ci hung indefinitely on the shared host with no timeout or error"
  - "Switched to pre-built dist/ strategy: build runs locally, dist/ is committed to git, .cpanel.yml only runs rsync (no Node.js on server at deploy time)"
  - "Removed dist from .gitignore so built assets are tracked and available for rsync"
  - "Set vite base to '/merni-edinici/' because site is at a subdirectory path, not domain root — default '/' caused 404s on all assets"
  - "Made GitHub repo public to allow HTTPS cloning from cPanel without SSH key setup"

patterns-established:
  - "Deploy pattern: npm run build locally -> commit dist/ -> push -> cPanel rsync"
  - "Subdirectory hosting requires Vite base path to match the URL path prefix"

requirements-completed: [DEPLOY-01, DEPLOY-02]

# Metrics
duration: ~90min
completed: 2026-05-22
---

# Phase 04 Plan 01: cPanel Deployment Summary

**cPanel static deploy via pre-built dist/ committed to git and rsync-copied to public_html — site live at https://ochen-lekar.com/merni-edinici/**

## Performance

- **Duration:** ~90 min
- **Started:** 2026-05-21T09:30:00Z (approximate)
- **Completed:** 2026-05-22T13:50:00Z (approximate)
- **Tasks:** 3 (including human-action checkpoint)
- **Files modified:** 6

## Accomplishments

- `.cpanel.yml` created and committed — defines rsync-only deployment, no server-side build
- Local `npm run build` passed, producing `dist/index.html` and hashed assets under `dist/assets/`
- `vite.config.js` updated with `base: '/merni-edinici/'` to fix 404s on subdirectory hosting
- `dist/` committed to git (`.gitignore` updated) so cPanel rsync has files to copy
- Site is live and verified at https://ochen-lekar.com/merni-edinici/

## Task Commits

Each task was committed atomically:

1. **Task 1: Create .cpanel.yml** - `52c53b6` (chore) — initial .cpanel.yml with server-side build strategy
2. **Task 2: Local build smoke test** - `b024fc3` (chore) — build verified locally
3. **Strategy pivot** - `b139245` (chore) — pre-build dist/ locally, simplify .cpanel.yml to rsync-only
4. **Base path fix** - `c4cfabe` (fix) — set vite base to /merni-edinici/ for subdirectory hosting

**Plan metadata:** (this commit — docs: complete plan summary)

## Files Created/Modified

- `.cpanel.yml` — deployment task file; final form: mkdir -p + rsync dist/ to public_html, no Node.js invocation
- `.gitignore` — removed `dist` line, added comment explaining dist is committed for cPanel deployment
- `vite.config.js` — added `base: '/merni-edinici/'` so Vite emits correct asset URLs for subdirectory hosting
- `dist/index.html` — built entry point (committed for rsync)
- `dist/assets/index-Cle5yi6q.js` — hashed JS bundle (committed for rsync)
- `dist/assets/index-Dz8eTdRW.css` — hashed CSS bundle (committed for rsync)

## Decisions Made

1. **Pre-built dist/ strategy** — Server-side `npm ci` hung indefinitely on the shared cPanel host with no error or timeout. After multiple diagnosis attempts the strategy was changed: build runs locally (`npm run build`), `dist/` is committed to git, and `.cpanel.yml` only runs `rsync`. No Node.js is invoked on the server at deploy time. This is simpler, faster, and avoids all Node/npm availability issues on shared hosting.

2. **Vite base path `/merni-edinici/`** — The app is served from `https://ochen-lekar.com/merni-edinici/` (a subdirectory), not the domain root. Vite's default `base: '/'` caused all asset references in `index.html` to be root-relative (e.g., `/assets/index.js`), which 404'd. Setting `base: '/merni-edinici/'` makes Vite emit subdirectory-relative paths, fixing the blank-page issue.

3. **Public GitHub repo** — Repository was made public to allow cPanel to clone over HTTPS without needing SSH key configuration. Acceptable for this project because the codebase contains no secrets (`.env*` gitignored, no API keys in source).

## Deviations from Plan

### Strategy Changes (plan-level pivots, not auto-fix rules)

**1. Server-side build abandoned — switched to pre-built dist/ approach**
- **Found during:** Task 3 (first cPanel deploy attempt)
- **Issue:** `npm ci` hung indefinitely on the shared cPanel host. The deployment task runner showed no output, no error, no timeout — it simply stalled. Multiple attempts confirmed the shared host could not reliably run Node.js as a deployment step.
- **Fix:** Changed strategy to pre-built dist/: removed `npm ci` and `npm run build` from `.cpanel.yml`, added dist/ tracking to git, simplified `.cpanel.yml` to only `mkdir -p` + `rsync`. Build now runs locally before every push.
- **Files modified:** `.cpanel.yml`, `.gitignore`
- **Committed in:** `b139245`

**2. [Rule 1 - Bug] Vite base path fix for subdirectory hosting**
- **Found during:** Task 3 (first browser verification after deploy)
- **Issue:** Site loaded the HTML but all JS/CSS assets 404'd. `dist/index.html` referenced `/assets/index.js` (root-relative), but assets actually live at `/merni-edinici/assets/index.js`. Vite's default `base: '/'` was wrong for subdirectory hosting.
- **Fix:** Added `base: '/merni-edinici/'` to `vite.config.js`, rebuilt locally, recommitted dist/.
- **Files modified:** `vite.config.js`, `dist/index.html`, `dist/assets/*`
- **Verification:** Site loaded correctly with all assets at https://ochen-lekar.com/merni-edinici/
- **Committed in:** `c4cfabe`

**3. GitHub repo made public**
- **Found during:** Task 3 (cPanel Git Version Control clone attempt)
- **Issue:** cPanel could not clone the private repo over HTTPS without credentials. SSH key setup would have required manual key registration in GitHub — adding complexity and another manual step.
- **Fix:** Repository visibility changed to public on GitHub. No secrets in codebase (`.env*` gitignored), so this is safe.
- **Files modified:** (GitHub settings, no local file change)

---

**Total deviations:** 3 (1 strategy pivot due to host limitations, 1 bug fix for incorrect asset paths, 1 operational change for repo visibility)
**Impact on plan:** All deviations were necessary for the deploy to succeed. The final deploy strategy (pre-built dist/ + rsync) is simpler and more reliable than the original server-side build approach. No functional scope was added or removed.

## Issues Encountered

- `npm ci` hung with no output on the shared cPanel host — no error, no timeout, indefinite stall. Root cause likely: shared host memory/CPU limits killing the Node.js process silently, or npm network access blocked. Resolved by eliminating the server-side build entirely.
- Site loaded blank after first successful rsync — all asset requests returned 404. Root cause: Vite default `base: '/'` incompatible with subdirectory URL prefix. Resolved by setting `base: '/merni-edinici/'` in `vite.config.js`.

## User Setup Required

None beyond what was already performed during Task 3. The deploy runbook for future releases is:

1. Make changes locally
2. `npm run build` (builds to `dist/`)
3. `git add dist/ && git commit -m "chore: update dist"` (or include in feature commit)
4. `git push origin main`
5. Log into cPanel > Git Version Control > merni-edinici > Manage > Pull or Deploy > Update from Remote > Deploy HEAD Commit

## Next Phase Readiness

- Live site confirmed at https://ochen-lekar.com/merni-edinici/ — foundation for plan 04-02 (vite.config.js cleanup) and future PWA work
- `vite.config.js` now has the correct base path — plan 04-02 should preserve `base: '/merni-edinici/'`
- Pre-built dist/ deploy pattern is established — all future plans that modify source files must rebuild and recommit dist/ as part of their task commits

## Known Stubs

None — the deployed app is fully wired. Calculator UI, ingredient data, and unit conversion logic are all live.

---
*Phase: 04-deploy*
*Completed: 2026-05-22*
