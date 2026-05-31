# SvelteKit PHP Adapter — Production-Readiness Roadmap

**Date:** 2026-05-31  
**Scope:** Gap analysis, production-hardening plan, and prioritized roadmap to close all remaining issues and ship a production-ready `@ryanspice/sveltekit-adapter-php`

**Source documents:** ChatGPT working history, B:Search local broker sweep, adapter source audit, build verification output, test suite state, PixelBoats planning docs

---

## 1. Current State Summary

### 1.1 What Works (✅)

| Area | Status | Evidence |
|---|---|---|
| Adapter build (`bun run build:adapter`) | ✅ Passing | Produces `adapter/index.js` (170 KB) |
| Full build (`vite build + adapter`) | ✅ Passing | Output to `build/` directory |
| E2E build pipeline (`build:e2e`) | ✅ Passing | 3 build artifacts (php-static, node-root, node-subdir) |
| Static output verification | ✅ Passing | All expected files present |
| Route verification | ✅ Passing | 29 routes in manifest, 0 failed checks |
| Unit tests (Vitest) | ✅ Passing | 8/8 passing (assets-output, paths) |
| PHP redeclare tests | ✅ Passing | 36 __data.php files, 5 included without error |
| HTTP sanity checks | ✅ Passing | 11 routes verified (/, /ssr-data, /form-basic, /stream, /preload/__data.json, /negotiate, /status?code=404, etc.) |
| `.htaccess` generation | ✅ Working | Rewrites, precompression, base path, trailing slash, _protection |
| `router.php` generation | ✅ Working | Dev server routing |
| Base path support | ✅ Working | Fixed + auto modes, env-overridable |
| Trailing slash canonicalization | ✅ Working | 308 redirects for always/never |
| PHP 7.4+ safety checks | ✅ Working | Regex validation at build time |
| Content negotiation | ✅ Working | Accept header routing for negotiate routes |
| Health endpoints | ✅ Present | `GET /__health`, `GET /__ready` |

### 1.2 What's Partial (🟡)

| Area | Status | Detail |
|---|---|---|
| Form actions (PHP) | 🟡 Limited | Actions work if route has `+page.server.php`; pure JS `+page.server.js` actions not bridged (expected — PHP adapter bridges PHP, not JS) |
| Cookie handling | 🟡 Limited | Basic cookie support in PHP templates (get/set/delete via `SK_URLSearchParams`) |
| Streaming (php-static) | 🟡 N/A by design | php-static prerenders; streaming requires node-ssr mode |
| Streaming (node-ssr) | 🟡 Implemented but untested | PHP proxy disables output buffering; actual E2E not proven |

### 1.3 What's Blocked or Missing (🔴)

| Area | Status | Detail |
|---|---|---|
| **E2E Playwright (3 tests)** | 🔴 Timeout | `fallback.spec.ts`, `base-mode-auto.spec.ts`, `base-mode-subdir.spec.ts` — all fail on `beforeAll` at 30s timeout. Root cause: full build inside `beforeAll` exceeds timeout. **These are the #1 blocker for claiming green.** |
| **E2E Playwright (passing)** | ✅ 13 pass | All smoke, structure, negotiation, and node-ssr tests pass |
| Node SSR end-to-end | 🟡 Untested on real hosting | Tested only via PHP built-in server loopback |
| Precompression in E2E | 🟡 Generated but not tested | `.br`/`.gz` files created; no E2E verifies serving |
| Base-mode-auto (E2E) | 🔴 Timeout | Same `beforeAll` timeout as fallback |
| Base-mode-subdir (E2E) | 🔴 Timeout | Same `beforeAll` timeout as fallback |
| Fallback page (E2E) | 🔴 Timeout | Same `beforeAll` timeout as fallback |
| Apache deployment | 🟡 Untested on real server | Only tested via PHP built-in server |
| Nginx deployment | ❌ Not documented | No `nginx.conf` template, no notes |
| Real-world stress test | ❌ Not done | No load testing, no concurrent client simulation |
| Vite dev adapter | 🟡 Exists but untested | `vite-dev-adapter.ts` scaffold exists, no E2E |
| Multipart form uploads | 🟡 Fixture exists, bridge untested | Route exists, no verified PHP bridge |
| SSRF safety (node-ssr) | ✅ Implemented | `SIDECAR_HOST` restricted to localhost by default |
| Docker/CI pipeline | ❌ Not done | No Dockerfile, no CI config beyond GitHub Actions scaffold |
| Documentation site | 🟡 Partial | `ADAPTER_INSTRUCTIONS.md` (335 lines) excellent; no quickstart, no troubleshooting guide |

---

## 2. Gap Analysis Against Production Requirements

### 2.1 Build Output Contract

**Requirement:** Exactly what files are emitted, what each means, and how consumers validate them.

Current state: The build output contract is informally documented in `SVELTEKIT_PHP_CONTRACT.md` and enforced by `verify-build-output.mjs`. The route manifest is generated. The `.htaccess` is generated. The `index.php` entry point is generated.

**Gaps:**
- No formal schema/type definition for the build output
- No `build-manifest.json` summarizing what was produced
- No version stamp in the output (build-stamp.json exists in E2E builds but not in production builds)
- No integrity check (SHA-256) for generated files

### 2.2 Runtime Request Contract

**Requirement:** Every HTTP request type resolves predictably through the PHP/Apache boundary.

Current state: Route verification covers 11 HTTP routes. Route manifest has 29 routes. Actions/streaming base path content negotiation all have code paths.

**Gaps:**
- **Missing formal request matrix** — no single checklist that pages a human through every request type and states the expected response
- **Action routes with JS server files** (not PHP) generate warnings but no clear error — consumer needs to know: "If you use `+page.server.js`, the PHP bridge won't handle it; use `+page.server.php` or `node-ssr` mode"
- **No CORS handling** for API endpoint routes
- **No rate limiting** or request size enforcement in PHP templates (except `MAX_BODY_BYTES` in node-ssr proxy)

### 2.3 Deployment Contract

**Requirement:** Clear, tested instructions for every target environment.

Current state: `PHP_FPM_APACHE_DEPLOYMENT_NOTES.md` covers Apache/PHP-FPM. `.htaccess` generation covers Apache. Router.php covers PHP built-in server.

**Gaps:**
| Target | Documented? | Tested? |
|---|---|---|
| Apache (root) | ✅ | 🟡 (PHP built-in server only) |
| Apache (subpath) | ✅ | 🟡 (PHP built-in server only) |
| Apache + PHP-FPM | 🟡 Partial | ❌ |
| Nginx | ❌ | ❌ |
| DirectAdmin/cPanel | ❌ | ❌ |
| Shared hosting (no SSH) | ❌ | ❌ |
| Docker container | ❌ | ❌ |
| Windows IIS | ❌ | ❌ |
| Cloudflare tunnel | ❌ | ❌ |

### 2.4 Error Handling & Observability

**Requirement:** When something breaks, the developer gets a clear signal.

Current state: PHP runtime hardening (display_errors=off, log_errors=stderr, set_error_handler). 502 Bad Gateway for down sidecar. `X-Request-Id` for tracing.

**Gaps:**
- No error page templates (500, 503, maintenance)
- No structured logging format (JSON lines vs plain text)
- No health endpoint documentation in the quickstart
- No self-diagnostics page (like `/__sveltekit` or `/__adapter/status`)

### 2.5 Performance & Scale

**Requirement:** Adapter overhead should be negligible for the target use case.

Current state: php-static mode has minimal PHP overhead (router dispatch, file serving). node-ssr mode has PHP reverse proxy cost (one socket connect per request).

**Gaps:**
- No benchmark data (requests/second, p50/p95/p99 latency)
- No comparison: raw static files vs adapter php-static vs adapter node-ssr
- No PHP-FPM tuning recommendations (`pm.max_children`, `pm.max_requests`)
- No cache layer guidance (Redis for session, Varnish/CDN for static)
- No WebSocket proxy notes for node-ssr (PHP has no WS support; need separate port or sidecar)

---

## 3. Phased Production-Readiness Plan

### Phase 1: Stabilize the Contract (Priority: 🔴 HIGH — 1-2 days)

**Goal:** Get the three E2E timeout tests passing so the test suite is fully green.

| Task | Detail | Verification |
|---|---|---|
| **1.1** Fix E2E timeout tests | Run failing specs serially with `--workers=1 --timeout=120000`. If they pass, update the test config. If they fail, debug build startup timing. | `bun run test:e2e` all green |
| **1.2** Create formal request matrix | Write `docs/REQUEST_MATRIX.md` — table with every request type, expected status, content-type, and behavior. Include: GET page, GET nested page, GET __data.json, POST action, POST multipart, GET endpoint, GET negotiate, GET redirect, GET 404, GET error, GET stream, POST action with validation error. | Document exists, reviewed for accuracy |
| **1.3** Fix action route warnings | Either add `+page.server.php` bridges for the 3 action routes, or suppress warnings with a clear note: "JS server files require node-ssr mode." | `verify:build` shows 0 warnings |
| **1.4** Pin PHP support floor | Decide: PHP 8.1+ recommended, PHP 7.4 best-effort. Update `php-compat.php`, docs, and adapter validation accordingly. | `ADAPTER_INSTRUCTIONS.md` updated |
| **1.5** Lock the source decision | Ensure `adapter/src/index.ts` is the canonical build source, not `adapter/index.js` (the compiled output). Add a CI check. | GitHub Actions verify `adapter/index.js` matches source |

### Phase 2: Hardening & Observability (Priority: 🟡 MEDIUM — 2-3 days)

**Goal:** Fail clearly, log usefully, document thoroughly.

| Task | Detail | Verification |
|---|---|---|
| **2.1** Add build manifest | Generate `build/_adapter/manifest.json` with: build timestamp, adapter version, PHP min version, mode, base path, route count, file listing with SHA-256 hashes. | `verify-build-output.mjs` checks manifest integrity |
| **2.2** Add self-diagnostics endpoint | Add `GET /__adapter/status` that returns JSON with: adapter version, mode, PHP version, routes loaded, config summary, health of each subsystem. | `curl /__adapter/status` returns valid JSON |
| **2.3** Add error page templates | Generate 500.php, 503.php, maintenance.php with matching CSS to the app shell. | Build output contains error templates |
| **2.4** Add structured logging | Update PHP templates to log structured JSON lines to stderr (request_id, method, path, status, duration_ms). | Log output parseable by common tools |
| **2.5** Document all environment variables | Create `docs/ENVIRONMENT_VARIABLES.md` — single reference for every env var (ADAPTER_MODE, SK_BASE_PATH, SIDECAR_HOST, PORT, PROXY_TIMEOUT_MS, etc.). | Doc exists, exhaustive |

### Phase 3: Deployment Targets (Priority: 🟡 MEDIUM — 3-5 days)

**Goal:** Verified, documented deployment paths for every target.

| Task | Detail | Verification |
|---|---|---|
| **3.1** Apache (root + subpath) E2E test | Set up Apache locally or in CI, run the full test suite against it. | CI pipeline has Apache job |
| **3.2** Nginx config template | Create `nginx.conf` template for both `php-static` and `node-ssr` modes. Include: `try_files` logic, `__data.json` rewrite, proxy pass for sidecar, cache headers, compression. | `docs/NGINX_CONF.md` with template |
| **3.3** DirectAdmin/cPanel guide | Create `docs/DIRECTADMIN_DEPLOY.md` — step-by-step: upload build, set document root, configure PHP version, test. | Document exists |
| **3.4** Dockerfile | Create `Dockerfile` for both modes: php-static (single-stage, just PHP+Apache), node-ssr (multi-stage, PHP+Apache+Node sidecar). | `docker compose up` serves the app |
| **3.5** Shared hosting guide | Create `docs/SHARED_HOSTING.md` — constraints, FTP upload checklist, .htaccess deployment, PHP version requirements. | Document exists |

### Phase 4: Performance & Scale (Priority: 🔵 LOW — 2-3 days)

**Goal:** Benchmarks, tuning guides, and capacity planning.

| Task | Detail | Verification |
|---|---|---|
| **4.1** Benchmark baseline | Run `bombardier` or `wrk` against static files vs php-static vs node-ssr. Measure: req/s, p50/p95/p99 latency, error rate. | Report in `docs/PERFORMANCE_BENCHMARKS.md` |
| **4.2** PHP-FPM tuning guide | Document `pm.max_children`, `pm.start_servers`, `pm.max_requests`, OpCache settings for the target traffic pattern. | `docs/PHP_FPM_TUNING.md` |
| **4.3** Cache layer guide | Document CDN (Cloudflare), Varnish, Redis session, and browser cache strategy. | `docs/CACHING_GUIDE.md` |
| **4.4** WebSocket/proxy guide | For node-ssr mode: document WebSocket path (sidecar on separate port, Apache `ProxyPass`, or nginx `stream`). | `docs/WEBSOCKET_GUIDE.md` |

### Phase 5: Developer Experience (Priority: 🔵 LOW — 1-2 days)

**Goal:** Fast onboarding, clear error messages, useful debugging.

| Task | Detail | Verification |
|---|---|---|
| **5.1** Quickstart guide | Create `docs/QUICKSTART.md` — "5 minutes to your first PHP-hosted SvelteKit app." | Document exists, all commands verified |
| **5.2** Vite dev adapter E2E | Test the Vite + PHP side-by-side dev mode. Document the workflow. | `dev-php.mjs` verified working |
| **5.3** Debug mode | Add `ADAPTER_DEBUG=true` — enables verbose logging, exposes route resolution steps, shows file lookups. | `curl /` with DEBUG shows route-resolution trace |
| **5.4** Migration guide from adapter-static | Create `docs/MIGRATE_FROM_STATIC.md` — steps for projects currently using `@sveltejs/adapter-static` that want to add PHP endpoints. | Document exists |

---

## 4. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| E2E timeouts are real build failures, not timing | Medium | High | Run serially first. If still fail, debug the build script. Do not declare green until 3 pass. |
| PHP 7.4 edge cases in generated code | Low | Medium | The regex-based safety checks are thorough. Add fuzz testing for generated PHP. |
| Apache rewrite rules don't work on real hosting | Medium | High | Set up a real Apache instance (or use Docker httpd) for E2E testing. |
| node-ssr mode has untested edge cases | Medium | Medium | The PHP proxy code is well-structured but not battle-tested. Add a dedicated node-ssr E2E suite. |
| Adapter breaks on SvelteKit minor updates | Medium | Medium | Pin SvelteKit version in the fixture app. Run CI weekly against latest SvelteKit. |
| No public test site / demo | Low | Medium | Deploy a demo to `mark8t.ca/sveltekit-php` or similar for public verification. |

---

## 5. Key Decisions to Make

### 5.1 PHP Version Floor

| Option | Pros | Cons |
|---|---|---|
| **PHP 7.4+** (current) | Maximum compatibility, shared hosting support | Misses PHP 8 features (named args, match, readonly), constrains generated code |
| **PHP 8.0+** | Named arguments, match expressions, cleaner code | Still missing readonly, constructor promotion (8.1) |
| **PHP 8.1+** | Enums, readonly, fiber support for future streaming | Excludes many shared hosts still on 7.4 |
| **PHP 8.2+** | Modern, performant | Narrows audience significantly |

**Recommendation:** Target **PHP 8.1+** as the official support floor. Keep 7.4 as best-effort for generated code where it doesn't constrain design. The installed PHP on this machine is 8.5.4 — testing against 8.1+ is straightforward.

### 5.2 Action Route Strategy

| Option | Pros | Cons |
|---|---|---|
| **PHP-only actions** (current) | Works in php-static mode | Requires duplicating action logic in PHP |
| **JS server file bridge** | PHP-generated `__action.php` proxies to Node sidecar | Only works in node-ssr mode |
| **Ignore JS actions** (current behavior) | Honest about limitations | Warnings from verify script are confusing |

**Recommendation:** Keep the current architecture (PHP actions for php-static, Node actions for node-ssr). Fix the verify script to differentiate between "expected missing" (JS-only routes) and "unexpected missing" (routes with no server file at all).

### 5.3 Fallback Strategy

| Option | Pros | Cons |
|---|---|---|
| **No fallback** (strict) | Clear 404s, no ambiguity | SPA routing broken for deep links |
| **200.html fallback** (current) | SPA compatibility | Soft 404s if misconfigured |
| **Smart fallback with route manifest** | Only fall back if route exists in manifest | More complex router logic |

**Recommendation:** Keep smart fallback with route manifest as the default. Add `fallback: '200.html'` as an opt-in for SPA-only apps.

---

## 6. Immediate Next Actions (This Week)

These are ordered by impact on the "can I ship this?" question.

```text
Day 1:
  [ ] Run 3 failing E2E tests serially: `--workers=1 --timeout=120000`
  [ ] If they pass: update Playwright config to serial mode for those tests
  [ ] If they fail: inspect PHP server startup timing, increase beforeAll timeout
  [ ] Write REQUEST_MATRIX.md

Day 2:
  [ ] Fix action route warnings in verify script
  [ ] Create build manifest (manifest.json with hashes)
  [ ] Create ENVIRONMENT_VARIABLES.md
  [ ] Run the compare script against PixelBoats

Day 3:
  [ ] Add __adapter/status endpoint
  [ ] Add error page templates
  [ ] Create NGINX_CONF.md
  [ ] Create QUICKSTART.md

Day 4+:
  [ ] Dockerfile for both modes
  [ ] Apache E2E test in CI
  [ ] Performance benchmarks
  [ ] DirectAdmin/cPanel deployment guide
```

---

## 7. Appendix: ChatGPT History Gap Analysis

The ChatGPT working history contained these specific concerns. Here's the current status of each:

| Concern from History | Status | Notes |
|---|---|---|
| Root route incorrectly treated as all routes | ✅ Fixed | Route manifest distinguishes `/` from others |
| 404 routes redirecting incorrectly | ✅ Fixed | Strict mode returns 404 for unmapped routes |
| `/api/*` going through page fallback | ✅ Fixed | Manifest distinguishes `type: 'endpoint'` from `type: 'page'` |
| Missing `/api/ping` | ✅ Fixed | Route exists and verified |
| Deep links not resolving through manifest | ✅ Fixed | Verfied: `curl /parent-child/nested` returns 200 |
| `__data.json` missing for nested routes | ✅ Fixed | Verfied: `curl /parent-child/nested/__data.json` returns 200 JSON |
| Layout data merge issues | 🟡 Partially tested | Fixture routes exist; no explicit E2E for data merging |
| Base path breaking data URLs | ✅ Fixed | Base path is env-configurable and forwarded to data bridges |
| SSR-disabled routes behaving incorrectly | 🟡 Tested but not exhaustive | `/matrix/ssr-off` exists as fixture |
| Hydration mismatch from malformed HTML | 🟡 Not tested | Would be caught by SvelteKit's own hydration checks |
| `127.0.0.1:3000/` → 404, `:3000/dev/` → 200 | ✅ Fixed | Base path is now explicitly managed via `SK_BASE_PATH` env var |
| Generated PHP targets 7.4 but docs say 8.0+ | 🟡 Unresolved | Still targets 7.4 in code, docs mention 8.0+ — needs resolution (see §5.1) |
| No multipart E2E | 🔴 Not done | Fixture route exists, verification script warns |

---

## 8. Publication Package — Blog Series Outline

One of the history conversations proposed a publishable blog series about the adapter. The framing is stronger than "here's how the code works" — it tells the story in the order the engineering became legible: problem, misframed first idea, correct architecture split, deployment realities, then testing and product maturity.

| Post | Target audience | Words | Core takeaway |
|---|---|---|---|
| **Why a SvelteKit PHP adapter exists at all** | Agency leads, PHP teams, frontend platform engineers | 1,600-2,000 | PHP hosting is still common; the opportunity is deployment reuse, not nostalgia |
| **The wrong question we asked first** | Adapter authors, framework tinkerers | 1,800-2,200 | "Can we make SvelteKit run natively in PHP?" is too broad; adapters should target contracts |
| **Designing php-static honestly** | Shared-hosting developers, brochure-site builders | 2,000-2,600 | php-static is strongest when scoped to prerendered output, routing, and selected bridges |
| **Designing node-ssr for real SSR on PHP-first estates** | Platform engineers, DevOps, VPS operators | 2,000-2,600 | Full SvelteKit semantics belong in a JS runtime, with PHP/Apache acting as front door |
| **Testing the seams that actually break** | Staff engineers, maintainers, QA | 2,200-2,800 | Base paths, __data.json, content negotiation, actions, and 404 rules are the real risk surface |
| **What this adapter should support before v1** | Maintainers, contributors, stakeholders | 1,400-1,800 | Honest support boundaries produce better docs and fewer user surprises |

Each post should include a verification box: what is verified from official docs, what is reconstructed from project notes, and what remains unspecified. That transparency makes the publication stronger, not weaker.

---

## 9. Representative Configuration & Deployment Templates

These are reconstructed from the adapter's architectural intent. They should be validated against the actual build output before final documentation.

### 9.1 `svelte.config.js` — php-static mode

```js
// svelte.config.js
import php from 'sveltekit-adapter-php';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: php({
			mode: 'php-static',
			out: 'build',
			manifest: 'build/adapter/route-manifest.json',
			base: '/sveltekit-php',
			emitHtaccess: true,
			emitRouter: true
		}),
		paths: {
			base: '/sveltekit-php'
		}
	}
};

export default config;
```

### 9.2 `svelte.config.js` — node-ssr mode

```js
// svelte.config.js
import php from 'sveltekit-adapter-php';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: php({
			mode: 'node-ssr',
			out: 'build',
			base: '/sveltekit-php',
			sidecar: {
				runtime: 'node', // 'bun' should remain experimental
				entry: 'build/index.js',
				port: 3000
			},
			php: {
				proxyEntrypoint: 'public/index.php'
			}
		}),
		paths: {
			base: '/sveltekit-php'
		}
	}
};

export default config;
```

### 9.3 Apache `.htaccess` (php-static, subpath)

Apache's `mod_rewrite` in `.htaccess` context sees the path without the leading subdirectory prefix. `RewriteBase` matters when URL path differs from filesystem path. `FallbackResource` is a simpler option but won't fire if another handler has been assigned (common on PHP-oriented hosting). This is why the adapter should prefer an explicit rewrite recipe it fully controls.

```apache
# php-static subpath deployment
RewriteEngine On
RewriteBase /sveltekit-php/

# serve real files and directories directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# everything else goes through the generated PHP router
RewriteRule ^ router.php [QSA,L]
```

### 9.4 Representative `router.php` (php-static)

```php
<?php
declare(strict_types=1);

$base = '/sveltekit-php';
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($base !== '' && str_starts_with($requestPath, $base)) {
	$requestPath = substr($requestPath, strlen($base)) ?: '/';
}
$requestPath = '/' . ltrim($requestPath, '/');

$buildDir = __DIR__ . '/build';
$manifestFile = $buildDir . '/adapter/route-manifest.json';

$manifest = ['pages' => [], 'data' => [], 'redirects' => []];
if (is_file($manifestFile)) {
	$manifest = json_decode((string) file_get_contents($manifestFile), true, 512, JSON_THROW_ON_ERROR);
}

// Let Apache/PHP serve existing files when present
$physical = realpath($buildDir . $requestPath);
if ($physical && str_starts_with($physical, realpath($buildDir)) && is_file($physical)) {
	return false;
}

// Redirect map
if (isset($manifest['redirects'][$requestPath])) {
	$target = $manifest['redirects'][$requestPath];
	header('Location: ' . $target['location'], true, $target['status'] ?? 302);
	exit;
}

// Data bridge
if (str_ends_with($requestPath, '/__data.json') || isset($manifest['data'][$requestPath])) {
	require __DIR__ . '/runtime/data-bridge.php';
	exit;
}

// Prerendered page lookup
if (isset($manifest['pages'][$requestPath])) {
	$page = $buildDir . '/' . ltrim($manifest['pages'][$requestPath]['file'], '/');
	if (is_file($page)) {
		http_response_code($manifest['pages'][$requestPath]['status'] ?? 200);
		readfile($page);
		exit;
	}
}

// Fallback 404
$notFound = $buildDir . '/404.html';
http_response_code(404);
if (is_file($notFound)) {
	readfile($notFound);
	exit;
}
echo '404 Not Found';
```

---

## 10. Troubleshooting Guide

A consolidated reference for the most common adapter issues, compiled from the full working history.

| Symptom | Likely cause | First fix |
|---|---|---|
| Route works at `/` but not under `/dev` | `paths.base`, `RewriteBase`, or asset-relative settings disagree | Recheck `kit.paths.base`, emitted links, and `.htaccess` subdir rules |
| Links work but assets 404 | Relative vs root-relative asset emission mismatch | Verify `paths.relative` expectations and actual deploy path |
| `/about` fails but `/about/` works | `trailingSlash` does not match host behaviour | Pick one convention and lock it globally |
| Client navigation breaks on second click | `__data.json` is missing, blocked, or misrouted | Restore data route handling or disable client navigation intentionally |
| `/api/*` sometimes returns HTML instead of JSON | Request negotiation or fallback ordering is wrong | Check Accept handling and route exclusions before page fallback |
| Prerender output is an empty shell | `ssr = false` used where full prerender was expected | Re-enable SSR for prerendered pages |
| Hydration mismatch warnings | Invalid HTML nesting or server/client divergence | Reduce page to minimal repro and compare rendered HTML vs client state |
| Static fixes do not affect problem | Request is not actually hitting PHP | Confirm whether Apache is serving a real file before the router |
| "Flash of Home" on deep link | Root route incorrectly treated as fallback for all routes | Ensure route manifest distinguishes `/` from other patterns |
| 404 on `/api/ping` | Missing endpoint manifest entry or wrong content negotiation | Verify route type is `endpoint`, not `page` |
| 404 on `__data.json` for nested routes | Data bridge not generated for nested layout chain | Check route manifest for data entries at each layout level |

---

## 11. Deployment Models Reference

Which mode fits which real-world hosting scenario.

| Scenario | Best-fit mode | Hosting requirements | Notes |
|---|---|---|---|
| Shared-hosting brochure site | php-static | Apache + PHP 8.1+, mod_rewrite | Best value case for the adapter |
| Subdirectory deployment (`/dev/`, `/sveltekit-php/`) | php-static or node-ssr | Same + strict base-path discipline | Most regressions happen here |
| WordPress-adjacent frontend | php-static | Same + coexisting PHP app | Best when frontend is mostly prerenderable |
| VPS with Node behind Apache/Nginx | node-ssr | Node 20/22 + PHP proxy | Closest to full SvelteKit semantics |
| cPanel deployment | node-ssr | Application Manager (Passenger) or "Setup Node.js App" | cPanel's Node features are CloudLinux-specific |
| DirectAdmin deployment | node-ssr | Nginx Unit | DirectAdmin documents Node 20/22/24 via NodeSource |
| Bun on VPS | node-ssr (experimental) | Bun runtime | Promising but labelled non-default |
| Legacy PHP monolith with selected modern routes | php-static first, node-ssr later | Apache + PHP | Good migration path: start static, escalate only where real SSR needed |

---

## 12. PHP Version Recommendation — Updated

Based on PHP's current supported-versions page:
- **8.2, 8.3, 8.4** — currently supported branches with security support through late 2026, 2027, and 2028 respectively
- **7.4** — only in historical releases archive (2021-2022), no current support
- **PHP 8.5.4** — installed on this machine (dev environment)

**Recommendation:** Target **PHP 8.2+** as the official support floor. PHP 8.1 can remain best-effort. PHP 7.4 compat should be removed from the generated code path and kept only as a reference note, not a constraint on design. The installed PHP 8.5.4 means testing against 8.2+ is straightforward via Docker version matrix.

---

## 13. The PHP-as-Middleware Concept (Future Evolution)

A later direction in the working history explored letting PHP participate as a middleware/integration layer rather than a full renderer. The core idea:

- SvelteKit remains the renderer and router
- PHP can act as: front dispatcher, middleware, layout/page pre/post processor, header/cookie mutator, server integration layer
- Possible conventions: `+layout.php`, `+page.php` (but with a clear contract — not pretending to be native SvelteKit route files)

This concept should be **deferred to Phase 6**. The adapter needs to be boringly reliable in its two current modes before exploring PHP-as-middleware patterns. The exotic PHP page/layout middleware can come after routing, data, actions, base paths, and tests are boringly green.

---

## 14. Recommended CI Matrix

| Environment | PHP version | Node version | Purpose |
|---|---|---|---|
| php-static unit + static verify | 8.2, 8.3, 8.4 | — | Core build output integrity |
| php-static E2E | 8.3 | — | Full Playwright suite |
| node-ssr unit + build | 8.3 | 20, 22 | Sidecar generation |
| node-ssr E2E | 8.3 | 22 | Full SSR runtime |
| Bun (experimental) | — | Bun latest | Future-proofing sidecar |
| SvelteKit latest | 8.3 | 22 | Forward-compat check on adapter build |
