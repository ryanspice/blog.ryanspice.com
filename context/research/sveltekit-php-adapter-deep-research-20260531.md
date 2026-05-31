# SvelteKit PHP Adapter — Deep Research Report (Expanded)

**Date:** 2026-05-31  
**Scope:** All sources: adapter repo code walkthrough, ryanspice.com legacy copy, PixelBoats planning docs, AI Wiki vault graph, B:\Search local broker sweep, session history, build scripts, test suite, and runtime templates

---

## 1. The Adapter Project

### 1.1 Canonical Source

**Location:** `B:\Dev\sveltekit-php`  
**Package name:** `@ryanspice/sveltekit-adapter-php`  
**Status:** Active development, strong partial green verification signal

The adapter is a custom SvelteKit adapter that compiles SvelteKit builds into PHP-hostable deployment packages. It lives in a standalone repo at `B:\Dev\sveltekit-php` with:

- `adapter/src/index.ts` — the full adapter implementation (~2150 lines)
- `adapter/src/runtime/` — PHP runtime templates (router, htaccess, templates for both modes)
- `adapter/src/utils/` — routing, paths, HTML, filesystem utilities
- `scripts/` — 11 build/verification/serve scripts (MJS, JS, TS)
- `tests/` — 7 Playwright E2E specs (php-static: smoke, structure, negotiation, fallback, base-mode-auto, base-mode-subdir; node-ssr), 2 unit test files (assets-output, paths), shared test-utils.ts
- `docs/` — 7 audit/execution plan documents dating back to Jan 2026

### 1.2 Source Hierarchy

| Source | Role | Decision |
|---|---|---|
| `B:\Dev\sveltekit-php` | Canonical adapter implementation | **Use as contract source** |
| `B:\Dev\ryanspice.com` | Real consumer / legacy local copy | Reference only |
| `B:\Dev\PixelBoats` | Future consumer | Planning/docs only |

---

## 2. Adapter Source Code Deep Dive

### 2.1 Entry Point (`adapter/src/index.ts`, 2154 lines)

The adapter exports a factory function `sveltekitPhpAdapter(options)` that returns a SvelteKit `adapt(builder)` contract. Options and defaults:

```ts
{
    mode = 'php-static',      // 'php-static' | 'node-ssr'
    ssr = true,
    out = './build',           // build output directory
    assets = './build',        // client assets directory  
    precompress = false,       // generate .br / .gz variants
    fallback = false,          // fallback page (200.html)
    strict = true,             // strict output validation
    baseMode = 'fixed'         // 'fixed' | 'auto' base path
}
```

**Build pipeline (in order):**

1. **Clean and prepare** — Robust `rmSync` with retry for Windows ENOTEMPTY, create out/tmp dirs
2. **Write client assets** — `builder.writeClient()` to assets dir
3. **Prerender pages** — `builder.writePrerendered()` to temp dir, handle fallback
4. **Discover PHP server files** — glob for `+*.server.php` and `+server.php` in routes
5. **Build protected server map** — PHP server files get namespace-prefixed (`sk_<route_hash>_load()`) and copied to `_protected/`
6. **Generate `_runtime/compat.php`** — PHP 7.4-safe runtime compatibility layer
7. **Write route-level shims** — For each prerendered page that needs it: `__data.php`, `__action.php`, `index.php`
8. **Generate `route-manifest.php`** — Maps URL patterns to route IDs, params, layout chains
9. **Generate `router.php`** — PHP-built-in server router for development
10. **Generate `.htaccess`** — Apache rewrite rules
11. **Generate `index.php`** — Entry point (for php-static: bootstrap + route dispatch; for node-ssr: proxy)
12. **Handle node-ssr mode** — If node-ssr: produce `server/handler.mjs` (Node entry) and PHP proxy `index.php`

**PHP 7.4 safety checks:** The adapter runs regex-based validation to reject PHP 8+ features (constructor property promotion, mixed types, match expressions, nullsafe operator, readonly, attributes) in generated PHP.

### 2.2 PHP Runtime Templates (`adapter/src/runtime/php-templates.ts`, 1149 lines)

Generates PHP code for:

- **`__data.php`** — Handles `__data.json` requests for client-side navigation. Includes runtime hardening (output buffering, error handler, display_errors=off, log_errors=stderr). Includes the `SK_URLSearchParams` class, `fetch()` wrapper, redirect/error helpers. The actual route data is injected via `$includes` array of PHP server function calls.
- **`__action.php`** — Handles form action POST requests. Dispatches to the correct `action_default()` or `action_<name>()` PHP function.
- **`index.php` bootstrap** — Main entry point. Resolves base path from env vars (`SK_BASE_PATH`, `DEPLOY_BASE`), handles route dispatch, calls the correct server function, renders prerendered HTML with data injection.
- **`api.php`** — Wraps `+server.php` endpoints into standalone PHP-requestable scripts.
- **`router.php`** — PHP built-in dev server router. Handles file existence checks, base path stripping, `__data.json` → `__data.php` rewrite, trailing slash behavior.
- **`compat.php`** — PHP 7.4+ compatibility shims.

### 2.3 Apache .htaccess Generation (`adapter/src/runtime/htaccess/php-static.ts`, 171 lines)

Generates production `.htaccess` with:

```
1. Deny dotfiles:          RewriteRule (^|/)\. - [F,L]
2. Deny _protected:        RewriteRule _protected/ - [F,L]
3. Stop rewrite loops:     index.php, router.php, __data.php, __action.php
4. Data/action rewrite:    __data.json → __data.php, __action → __action.php
5. Precompression:         Brotli/Gzip rules (EXCLUDING __data.json and __action)
6. _App asset routing:     Normalize nested /_app/ hits to root
7. Existing files pass:    Let real _app assets and static files through
8. Directory index:        index.php > index.html
9. Extension-less to .php: Route matching
10. Final fallback:         router.php or index.php
```

Cache control:
- `_app/immutable/*` → 1 year, immutable
- `__data.json` → no-store
- `__action` → no-store

**Trailing slash canonicalization** (`htaccess/trailing-slash.ts`, 41 lines):
- `trailingSlash='always'` — 308 redirect non-slash → slash (excludes `__data.json`, `__action`, `_app/`)
- `trailingSlash='never'` — 308 redirect slash → non-slash (uses `THE_REQUEST` to avoid loops with Apache DirectorySlash)

### 2.4 Node SSR Mode (`adapter/src/runtime/node-ssr-templates.ts`)

When `mode='node-ssr'`, the adapter generates:
- `build/server/handler.mjs` — Node entry point (starts SvelteKit server)
- `build/server/index.js` — SvelteKit server bundle
- PHP `index.php` becomes a **reverse proxy** to the Node sidecar

**PHP proxy features:**
- `PROXY_TIMEOUT_MS` (default 10000), `PROXY_CONNECT_TIMEOUT_MS` (default 500)
- `MAX_BODY_BYTES` (default 10MB)
- `SIDECAR_HOST` restricted to localhost (SSRF prevention)
- `ALLOW_NONLOCAL_SIDECAR=1` to override
- Forwards `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Forwarded-Prefix` (ignoring client-provided values)
- Strips hop-by-hop headers from sidecar response
- Generates `X-Request-Id` for tracing
- Logs to stderr with request IDs

Health endpoints:
- `GET /__health` → JSON `{ ok: true, ... }`
- `GET /__ready` → 200 when ready
- Sidecar down → 502 Bad Gateway

### 2.5 Routing (`adapter/src/utils/routing.ts`)

Key functions:
- **`findRouteForNavPath()`** — Matches nav path (with/without trailing slash) against `builder.routes` by pattern, picking the longest matching route ID.
- **`buildLayoutChainCandidates()`** — Walks up route ID parents to find layout server files.
- **`compilePhpRouteMatcher()`** — Converts SvelteKit route pattern to PHP regex.
- **`generateRouteManifest()`** — Produces the PHP route manifest with pattern, id, params, layout chain for each route.

### 2.6 PHP 7.4 Compatibility

The adapter explicitly targets PHP 7.4+ compatibility. Generated PHP avoids:
- Constructor property promotion (`__construct(public $x)`)
- `mixed` type hints
- `match()` expressions
- Nullsafe operator (`?->`)
- `readonly` properties
- PHP 8 attributes (`#[Attribute]`)

---

## 3. Verification Pipeline

### 3.1 Scripts (`scripts/`)

| Script | Purpose |
|---|---|
| `verify-all.mjs` (778 lines) | Main orchestrator. Runs in phases: build → unit → static verification → sanity HTTP → E2E. Supports `--mode=php-static\|node-ssr\|all`, `--skipBuild`, `--skipE2E`, `--skipSanity`, `--skipUnit`, `--skipPhp` |
| `build-e2e.mjs` | Single build for all configs (php-static base=/dev/sveltekit, node-root base=/, node-subdir base=/dev/sveltekit) |
| `serve-e2e.mjs` | Unified server starter for all modes with stamp verification |
| `verify-build-routes.mjs` | Route-level verification against route manifest |
| `verify-build-output.mjs` | File structure verification |
| `build-php.js` | PHP-specific build step |
| `dev-php.mjs` | Hybrid dev server orchestrator (Vite + PHP side-by-side) |
| `serve-php-static.ts` | PHP static mode server |

### 3.2 Test Structure

```
tests/
├── e2e/
│   ├── php-static/
│   │   ├── smoke.spec.ts          — Base HTML, deep routes, data JSON format
│   │   ├── structure.spec.ts      — File structure, trailing slash canonicalization
│   │   ├── negotiation.spec.ts    — Content negotiation (Accept header)
│   │   ├── fallback.spec.ts       — Fallback page behavior (SPA-like)
│   │   ├── base-mode-auto.spec.ts — Auto base path detection
│   │   └── base-mode-subdir.spec.ts — Subdirectory base path
│   └── node-ssr/
│       └── node-ssr.spec.ts       — Home, deep links, SSR data, streaming, assets, form actions
├── unit/
│   ├── assets-output.test.ts      — Asset file generation
│   └── paths.test.ts              — Path utilities
├── test-utils.ts                  — Shared helpers (startPhpAndSidecar, etc.)
└── fixtures/                      — Test app source (SRC routes, PHP server files)
```

### 3.3 E2E Configuration

Three build artifacts:
- `build-e2e-php-static` (Base: `/dev/sveltekit`) — served on **8086**
- `build-e2e-node-root` (Base: `/`) — served on **8087** PHP / **3001** Node
- `build-e2e-node-subdir` (Base: `/dev/sveltekit`) — served on **8088** PHP / **3002** Node

Each build directory contains `_runtime/build-stamp.json`. Verify scripts check this stamp before starting.

### 3.4 Known E2E Failures

Three `php-static` tests fail with `beforeAll` timeout at 30s:
- `fallback.spec.ts`
- `base-mode-auto.spec.ts`
- `base-mode-subdir.spec.ts`

Root cause analysis: These tests run a **full build inside `beforeAll`** (bun run build:adapter + bun run build) then start a PHP server. The build step can take >30s on this machine. The fix is to run these tests serially with `--workers=1 --timeout=120000`, or use the pre-built artifacts.

Evidence that this is timing, not logic failure:
- Static verification passes
- Route verification passes (0 failed checks)
- PHP server starts in at least one timeout case
- 13 Playwright tests pass before the failed/blocked set

---

## 4. ryanspice.com Legacy Usage

### 4.1 Location
`B:\Dev\ryanspice.com` — the older personal site repo (separate from the new blog)

### 4.2 Adapter Integration

`svelte.config.js` imports a local copy:
```js
import php from './adapter/sveltekit-php.js';

adapter: php({
    apiDir: 'api',
    allowReservedSwaRoutes: true
}),
```

The legacy adapter at `B:\Dev\ryanspice.com\adapter\sveltekit-php.js` is a **single-file JS implementation (~725 lines)** with similar core logic but less comprehensive than the canonical TS version. It:
- Writes `__data.php` and `__action.php` into prerendered output
- Prepends PHP bootstrap and renames `.html` → `.php` for SSR routes
- Replaces inline `const data = ...` payloads with PHP `$__SK_DATA`
- Namespaces PHP route functions (`load()` → `sk_<hash>_load()`)
- Copies PHP server files to `_protected/`

The old site uses PHP endpoints (`src/routes/testPhp/+page.server.php`) and has static PHP files (`static/api/log-error.php`).

### 4.3 Relationship to Canonical

The `ADAPTER_SOURCE_DECISION.md` in PixelBoats docs explicitly says: **Do not use the older ryanspice.com copy as the source of truth.** The canonical `sveltekit-php` repo has:
- Proper TypeScript source (not JS)
- Modular architecture (17+ files vs 1)
- Full test suite and verification pipeline
- Proper documentation

---

## 5. AI Wiki References (B:\Search Local Broker Findings)

The local broker search found these adapter-related traces in the AI Wiki:

| Source | Reference | What It Says |
|---|---|---|
| `brain-demo.html` | Knowledge graph node | `{id:'Adapter',label:'SvelteKit PHP Adapter',type:'project',path:'Vault/CANOPYDIGITAL/SVELTEKIT-PHP-ADAPTER'}` |
| `vault-graph.json` | Semantic graph entry | `"id": "Vault/CANOPYDIGITAL/SVELTEKIT-PHP-ADPATER"` (note typo: ADPATER) |
| `vault-file-inventory.md` | File inventory | `Vault/CANOPYDIGITAL/SVELTEKIT-PHP-ADPATER/Errors.md` (7725 bytes, 2026-01-20) |
| `semantic-graph-human.md` | Human-readable graph | Lists `Vault/CANOPYDIGITAL/SVELTEKIT-PHP-ADPATER` as a node and `Errors.md` as a child |

Note: The `Errors.md` file from Jan 2026 is referenced in the index but was not found on disk during this pass — it may have been in a prior vault structure or was cleaned up in the 2026-05-13 legacy cutover.

The AI Wiki also contains the SvelteKit PHP Adapter as a knowledge graph node under the "Canopy" project cluster, alongside Programming and Ideas nodes. This predates the current adapter structure.

---

## 6. The New Blog (blog.ryanspice.com)

### 6.1 Location
`S:\OneDrive\Obsidan\AI-Wiki\07_Projects\blog.ryanspice.com`

### 6.2 Adapter Status

The blog does **NOT** use the PHP adapter. It uses `@sveltejs/adapter-static`:

```js
import adapter from '@sveltejs/adapter-static';
adapter({ pages: 'build', assets: 'build', fallback: undefined, precompress: false, strict: false })
```

The blog is fully static — prerendered SvelteKit output, no PHP, no `+server.php` routes, no `.htaccess` or `router.php` in the build. Deployment is static-hosted via standard SvelteKit static build.

### 6.3 Draft Article

The blog has a draft at `drafts/pixelboats-php-adapter-phase1-groundwork-draft.md` about the adapter. This is a planned blog post about the PixelBoats architecture decision — it does not reflect blog infrastructure.

---

## 7. PixelBoats Adapter Planning (Expanded)

### 7.1 Current State

Documented in `B:\Dev\PixelBoats\docs\networking\php-adapter\` (8 documents):

| Document | Key Content |
|---|---|
| `ADAPTER_SOURCE_DECISION.md` | Source hierarchy freeze: canonical = `B:\Dev\sveltekit-php` |
| `SVELTEKIT_PHP_CONTRACT.md` | Build output contract spec, required adapter behaviours, env vars |
| `PIXELBOATS_PHASE1_ADAPTER_PLAN.md` | 5-step phase plan, stop conditions |
| `PHP_FPM_APACHE_DEPLOYMENT_NOTES.md` | Deployment split: PHP for app/API, sidecar for realtime |
| `REALTIME_SIDECAR_PROCESS_PLAN.md` | 4 authority modes (local, player-hosted, sidecar, dedicated) |
| `STRESS_TEST_MATRIX.md` | HTTP tiers (T0-T3) + realtime checks |
| `E2E_TIMEOUT_NOTES.md` | 3 E2E timeouts, reproduction steps |
| `PHASE1_VERIFICATION_CHECKLIST.md` | Acceptance checklist |

### 7.2 PixelBoats PHP Scripts

The PixelBoats repo has 4 PHP adapter readiness scripts:

| Script | Purpose |
|---|---|
| `Compare-PixelBoatsAgainstAdapter.ps1` | Checks for adapter source, PixelBoats package.json, svelte.config.js, build dir. Scans package.json for adapter/php/sveltekit mentions. |
| `Check-PixelBoatsPhpAdapter.ps1` | Validates build output: `index.php`, `.htaccess`, `_app/version.json` required; `router.php`, `route-manifest.php`, `compat.php`, `_protected/.htaccess`, `200.html` optional. Checks `.htaccess` for `__data.json`, `RewriteEngine`, `_protected`. HTTP checks against base URL + version.json. |
| `Inspect-SvelteKitPhpSource.ps1` | Generates a deep inventory of the adapter source. Reads key files and outputs tree of adapter/scripts/tests directories. |
| `Find-SvelteKitPhpAdapterRepos.ps1` | (Exists but not reviewed in detail) |

Current status: Running these scripts confirms PixelBoats has **not yet been built with the PHP adapter** — required output files are missing, which is expected before Phase 1 adapter wiring.

### 7.3 Deployment Architecture (Planned)

```
Apache/PHP-FPM:
  /pixelboats/              app shell (via adapter)
  /pixelboats/_app/...      immutable assets
  /pixelboats/api/...       PHP API endpoints
  /pixelboats/signaling/... WebRTC signaling

Sidecar (process-launch or player-hosted):
  WebRTC DataChannel        peer-hosted realtime
  or /boat-ws               dev/custom Node sidecar
```

**Responsibility split:**
| PHP owns (always) | Realtime owns (never in PHP-FPM) |
|---|---|
| Static app serving | 30 Hz ship simulation |
| Route rewrites | Projectile physics |
| PHP API endpoints | Combat outcomes |
| Auth/session/cookies | NPC AI |
| Lobby/metadata | Snapshot generation |
| WebRTC signaling mailbox | Collision detection |
| Database persistence | Anti-cheat validation |

### 7.4 Phase 1 Acceptance Criteria

From `PHASE1_VERIFICATION_CHECKLIST.md`:
- [ ] Adapter source documented (DONE)
- [ ] PixelBoats can compare itself against adapter contract
- [ ] Missing output files reported clearly
- [ ] `/boat-ws` stress diagnostics distinguish dev server vs custom server vs missing websocket
- [ ] PHP adapter build wiring planned but not forced into gameplay

---

## 8. Key Differences: Old vs New Adapter

| Dimension | `ryanspice.com` (legacy) | `sveltekit-php` (canonical) |
|---|---|---|
| Language | JavaScript | TypeScript |
| Structure | Single file (725 lines) | Modular (17+ source files, 2150 lines main) |
| Build system | Inline | SvelteKit `adapt()` contract |
| Test suite | None | Playwright E2E (7 specs) + Vitest (2 unit) + PHP redeclare |
| Modes | Single implicit mode | Explicit `php-static` + `node-ssr` |
| Route manifest | None | Generated `route-manifest.php` |
| `.htaccess` generation | Manual | Automatic (trailing slashes, compression, base path, 308 redirects) |
| Base path support | Minimal | Full (`fixed` + `auto`, env-overridable) |
| Precompression | None | Brotli/Gzip with correct MIME types |
| Security hardening | Basic | SSRF prevention, X-Forwarded-* sanitization, hop-by-hop stripping |
| Health checks | None | `GET /__health`, `GET /__ready`, 502 on sidecar down |
| Request tracing | None | `X-Request-Id` generation + stderr logging |
| Error handling | Basic | Runtime hardening: display_errors=off, log_errors=stderr, set_error_handler |
| Documentation | None | 335-line instructions + 7 audit/plan docs |
| PHP 7.4 safety | Manual | Regex-based validation at build time |
| Streaming | None | PHP output buffer management, sidecar proxy |
| Verification pipeline | None | Build → unit → static → sanity → E2E pipeline (778-line orchestrator) |

---

## 9. Recommendations (Expanded)

1. **blog.ryanspice.com should stay on `@sveltejs/adapter-static`** — No PHP backend, no server routes, no need for the PHP adapter. The adapter is designed for projects with mixed PHP/Node backends.

2. **PixelBoats should use `B:\Dev\sveltekit-php` when ready** — The adapter is well-architected with proper separation of concerns. The `php-static` mode is the right starting point since PixelBoats is client-heavy.

3. **The 3 E2E timeouts should be investigated** — They're likely parallel build contention, not logic failures. Run serially with extended timeout.

4. **The legacy `ryanspice.com` adapter reference can be retired** — Keep for provenance but don't derive work from it.

5. **PixelBoats adapter integration should be done in a branch only** — Not on active runtime. The compare and check scripts already exist; run them now, wire config later.

6. **The `Errors.md` file in the vault graph** (Vault/CANOPYDIGITAL/SVELTEKIT-PHP-ADPATER/Errors.md) likely contained past build/implementation issues from Jan 2026. If it comes up again, check the AI Wiki archive for it.

---

*Report updated 2026-05-31 with expanded code walkthrough, test suite analysis, AI Wiki graph findings, and local broker search results.*
