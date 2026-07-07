# Main Codebase Review - 2026-06-25

Scope:
- Blog repo: `S:\OneDrive\Obsidan\AI-Wiki\07_Projects\blog.ryanspice.com`
- Canonical adapter repo: `B:\Dev\sveltekit-php`
- Review mode: report plus blockers. Only clear P0/P1 blockers and merge/skill fallout were fixed.

## Executive Summary

No open P0 or P1 blockers remain after this pass.

The branch merge step did not create merge commits. After `git fetch --all --prune`, every non-`main` blog ref in scope was already contained in `main`, including `production` and `post/local-fugu-coding-harness`. The adapter repo had no non-`main` refs to merge. No branches were pushed, deployed, deleted, or published.

Repo-local AI skills were added and validated in both repositories. The canonical adapter received two blocker fixes: generated PHP/JS-SSR handlers no longer disclose exception messages to clients, and the PHP-static release gate no longer fails on a reserved-route fixture plus Svelte rest-param false positive. The updated adapter was synced into the blog repo.

The biggest remaining architecture concern is not an immediate blocker: the blog build still has large route chunks, especially content/markdown-heavy chunks, and the blog's PHP homepage mirror duplicates TypeScript loader behavior without a dedicated parity test.

## Branch And Worktree Handling

### Blog repo

Initial dirty work was preserved before switching and merging. The protected work included:
- `src/lib/dev-log.ts`
- `context/morning-briefs/2026-06-22.md`
- `context/morning-briefs/2026-06-23.md`
- `context/morning-briefs/2026-06-24.md`
- `src/lib/content/morning-briefs/2026-06-22-dated-article-routes.md`
- `src/lib/content/morning-briefs/2026-06-23-low-signal-watchlist.md`
- `src/lib/content/morning-briefs/2026-06-24-local-fugu-build-log.md`

Safety stashes were left in place rather than dropped:
- `2c47f4332c3a48c5d5ec2f3d7fa0e3ff8221c792` - `codex-protect-before-main-merge-20260625-005700`
- `0624f45b37d0c5017d9328c9d521fc5797823718` - `codex-temp-clean-dev-log-20260625-005744`

Fetched refs were reviewed in deterministic order. These refs were skipped because they were already contained in `main`:
- `origin/post/local-fugu-coding-harness`
- `origin/production`
- `post/local-fugu-coding-harness`
- `production`

### Adapter repo

The adapter repo fetched cleanly and remained on `main`. No non-`main` local or remote refs required merging.

## Skills Added And Validated

### Blog repo

Added:
- `.ai/skills/svelte5-core-review/SKILL.md`
- `.ai/skills/sveltekit2-static-blog/SKILL.md`
- `.ai/skills/php-static-blog-runtime/SKILL.md`

Updated:
- `.ai/skills/blog-ryanspice-com/SKILL.md`

The updated blog skill now points to the new repo-local Svelte 5, SvelteKit 2 static blog, PHP runtime, and canonical adapter sync review lanes.

### Adapter repo

Added:
- `.ai/skills/sveltekit-php-adapter/SKILL.md`

The adapter skill covers official SvelteKit adapter API expectations, `php-static` and `js-ssr` modes, generated PHP router safety, `supports.read`, `supports.instrumentation`, output artifact sync, and release gates.

### Skill validation

Validated each skill folder with:

```powershell
python C:\Users\spice\.codex\skills\.system\skill-creator\scripts\quick_validate.py <skill-dir>
```

All five skill folders reported `Skill is valid!`.

## Findings

### P0

None.

### P1 - Fixed: Generated runtime handlers exposed exception messages to clients

Affected repo:
- `B:\Dev\sveltekit-php`

Affected files:
- `adapter/src/runtime/php-templates.ts`
- `adapter/src/runtime/js-ssr-templates.ts`
- `tests/unit/assets-output.test.ts`

The generated PHP action and endpoint handlers returned exception messages in client responses. That is unsafe for public shared-hosting deployments because exception text can include file paths, implementation details, or data-dependent context.

Fix:
- Server-side exception details are logged with `error_log`.
- Client responses now receive generic `Internal Server Error` bodies.
- Unit tests assert the generated templates do not expose `$e->getMessage()` or `Internal Server Error:` response bodies.

Status:
- Fixed and verified.
- Synced into the blog repo's vendored adapter output.

### P1 - Fixed: PHP-static gate failed on reserved route fixture and rest-param false positive

Affected repo:
- `B:\Dev\sveltekit-php`

Affected files:
- `adapter/src/index.ts`
- `svelte.config.js`
- `src/routes/path-viewer/[...path]/+page.js`
- `src/routes/path-viewer/[...path]/+page.server.js`
- `src/routes/path-viewer/[...path]/+page.svelte`
- `tests/unit/assets-output.test.ts`

`bun run verify:php-static` failed because a fixture route under `/files/[...path]` collided with reserved adapter output routing. After the fixture was moved to `/path-viewer/[...path]`, the reserved-route validator still flagged `[...path]` as traversal because it matched the literal substring `..`.

Fix:
- Moved the fixture route from `/files/[...path]` to `/path-viewer/[...path]`.
- Added route segment handling so Svelte dynamic param segments such as `[...path]` are not treated as literal traversal attempts.
- Added unit coverage for the validator behavior.
- Ran the Svelte autofixer on the updated fixture component and converted it to Svelte 5 `$props()` / `$derived()` style.

Status:
- Fixed and verified.

### P1 - Fixed: Release-prep evidence missed the adapter platform emulation marker

Affected repo:
- `B:\Dev\sveltekit-php`

Affected files:
- `docs/ALPHA-RELEASE-CHECKLIST.md`

The adapter release-prep verifier expects the alpha checklist to mention `event.platform.php`. After adding adapter platform emulation support, the checklist needed the same non-secret platform metadata marker as the other alpha evidence surfaces.

Fix:
- Added `event.platform.php` to the alpha release checklist runtime/artifact safety evidence.

Status:
- Fixed and verified by `bun run verify:release-prep`.

### P2 - Architecture: Blog content and markdown pipeline create large route chunks

Affected repo:
- `S:\OneDrive\Obsidan\AI-Wiki\07_Projects\blog.ryanspice.com`

Evidence:
- `pnpm run build:blog` and `pnpm run build:blog:canopy` passed, but Vite reported chunks over 500 kB.
- The `articles.js` server chunk is content/markdown heavy.

Risk:
- This is not a correctness blocker, but it increases build/runtime cost and makes future content features harder to reason about.

Recommendation:
- Split markdown transforms, content registries, and route-specific loading where practical.
- Prefer route-level lazy modules or smaller indexed content manifests over one broad singleton import path.
- Keep public prerendered HTML behavior unchanged while doing this.

### P2 - Architecture: Homepage PHP mirror can drift from TypeScript loader behavior

Affected repo:
- `S:\OneDrive\Obsidan\AI-Wiki\07_Projects\blog.ryanspice.com`

Affected surfaces:
- Blog homepage TypeScript loader/runtime
- Blog homepage `+page.server.php` mirror
- Vendored PHP adapter output

Risk:
- The PHP mirror is useful for shared-hosting compatibility, but it duplicates behavior that also exists in TypeScript. Future edits can silently change one runtime without the other.

Recommendation:
- Add a focused parity test that compares the representative homepage payload and selected rendered HTML fields across the TypeScript build and PHP runtime.
- Keep the mirror small and explicitly documented as a compatibility surface.

### P2 - Architecture: Blog request origin derivation should stay constrained

Affected repo:
- `S:\OneDrive\Obsidan\AI-Wiki\07_Projects\blog.ryanspice.com`

Risk:
- The PHP runtime mirror derives origin from request headers, including forwarded protocol. This is common behind controlled proxies, but public shared-hosting deployments should avoid trusting forwarded headers unless the host boundary is known.

Recommendation:
- Document the expected proxy/host contract for PHP shared hosting.
- Prefer configured canonical site URLs where possible for generated metadata and feed links.

### P3 - Architecture: Adapter release evidence is tightly coupled to runtime changes

Affected repo:
- `B:\Dev\sveltekit-php`

Risk:
- The alpha readiness, release-prep, hosted-smoke, and evidence-index files are useful, but many evidence surfaces move together when runtime capability markers change. That makes small runtime additions look larger than they are.

Recommendation:
- Keep the release evidence model, but isolate generated/repeated text from runtime adapter code where practical.
- Add a small direct test for `emulate().platform` behavior instead of relying mainly on source/evidence marker checks.

### P3 - Architecture: Native-host wrapper smoke is handoff evidence, not real native verification

Affected repo:
- `B:\Dev\sveltekit-php`

Affected surfaces:
- `scripts/smoke-native-host-wrapper.mjs`
- `src/lib/alpha-native-host-wrapper-smoke.ts`
- `src/routes/alpha-readiness/native-host-wrapper-smoke.json/+server.ts`
- `src/lib/native-shell/native-host-event-bridge.ts`

Risk:
- The new smoke contract gives deterministic evidence that optional native wrapper handoff data is shaped correctly, but it does not prove behavior inside a real Windows/macOS wrapper.

Recommendation:
- Keep this smoke script as alpha handoff evidence.
- Before a stable adapter release, run a real wrapper smoke that exercises the actual native host bridge and taskbar/window helpers.

### P3 - Architecture: Generated PHP router contains duplicated helper blocks

Affected repo:
- `B:\Dev\sveltekit-php`

Risk:
- Build output inspection shows repeated helper-style functions in generated router artifacts. This is not currently breaking tests, but it increases generated output size and review noise.

Recommendation:
- Deduplicate shared generated PHP helper templates when touching router generation next.
- Keep this behind existing artifact verification so generated output remains deterministic.

## Public Interface Notes

No intentional blog public runtime API changes were made.

New repo-local AI-agent interfaces:
- Blog `.ai/skills/*/SKILL.md`
- Adapter `.ai/skills/sveltekit-php-adapter/SKILL.md`

Adapter package exports remain unchanged:
- `.` resolves to `adapter/index.js`
- `./adapter` resolves to `adapter/index.js`

Adapter runtime surface change:
- `emulate().platform` now exposes non-secret `event.platform.php` metadata for generated runtime context. This includes adapter name/version, mode, SSR/prerendering/output settings, base path, runtime capabilities, and whether a build identity is configured.

Adapter alpha-readiness surface change:
- Added deterministic native-wrapper smoke output at `/alpha-readiness/native-host-wrapper-smoke.json`.
- Added `bun run alpha:native:smoke` to write the same contract to `report/alpha-native-host-wrapper-smoke.json`.
- This is wrapper handoff evidence only; it does not claim real native host verification.

Adapter test fixture route change:
- `/files/[...path]` was replaced by `/path-viewer/[...path]` to avoid colliding with reserved adapter output paths.

## Adapter Sync Notes

The blog repo's vendored adapter was refreshed from `B:\Dev\sveltekit-php` after the canonical adapter fixes.

Command used:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\Sync-SvelteKitPhpAdapter.ps1 -AdapterRoot "B:\Dev\sveltekit-php" -NoBuild
```

The blog `adapter/source-manifest.json` records the canonical adapter `main` head as `f319084013dde68d4d7b2c567b3469a5097048aa`. It also records `gitDirty: true` because the canonical adapter has intentional local review changes that are not committed in this pass.

## Verification Evidence

### Blog repo

Passed:

```powershell
pnpm run audit:files
pnpm run check
pnpm run test:unit
pnpm run build:blog
pnpm run audit:seo
pnpm run build:blog:canopy
pnpm run audit:seo
pnpm run test:e2e
```

Notes:
- `pnpm run test:e2e` reported 5 passed and 3 skipped.
- Website catalog screenshot churn from the e2e run was restored because it was unrelated generated output.
- Ryan and Canopy builds were run serially because both use the `build` directory.
- Vite chunk-size warnings remain and are tracked above as architecture work, not a release blocker.

PHP smoke against the generated blog build passed from the build directory using `router.php`:
- `/` returned `200 text/html`
- `/2026/06/24/local-fugu-coding-harness/` returned `200 text/html`
- `/rss.xml` returned `200 application/xml`
- `/sitemap.xml` returned `200 application/xml`
- `/_app/version.json` returned `200 application/json`
- `/missing-smoke-route` returned `404`
- `/_protected/` returned `403`

### Adapter repo

Passed:

```powershell
bun run build:adapter
bun run check
bun run test:unit
bun run test:php
bun run verify:artifacts
bun run verify:release-prep
bun run verify:php-static
bun run verify:js-ssr
bun run alpha:native:smoke
```

Notes:
- `bun run test:unit` passed 8 test files and 69 tests.
- `bun run check` reported `svelte-check found 0 errors and 0 warnings`.
- `bun run test:php` found 43 `__data.php` files and passed included-file redeclaration checks.
- `bun run verify:php-static` initially caught the reserved route/rest-param issue described above; it passed after the fix.
- `bun run verify:release-prep` initially caught the missing `event.platform.php` checklist marker; it passed after the fix.
- `bun run alpha:native:smoke` reported `Status: contract-ready; steps: 7`.
- `bun run v1:gate:local` was not run. The focused local gates passed, and hosted gates were intentionally not run because no hosted smoke target was provided.

### Skills

Passed:

```powershell
python C:\Users\spice\.codex\skills\.system\skill-creator\scripts\quick_validate.py .ai\skills\svelte5-core-review
python C:\Users\spice\.codex\skills\.system\skill-creator\scripts\quick_validate.py .ai\skills\sveltekit2-static-blog
python C:\Users\spice\.codex\skills\.system\skill-creator\scripts\quick_validate.py .ai\skills\php-static-blog-runtime
python C:\Users\spice\.codex\skills\.system\skill-creator\scripts\quick_validate.py .ai\skills\blog-ryanspice-com
python C:\Users\spice\.codex\skills\.system\skill-creator\scripts\quick_validate.py B:\Dev\sveltekit-php\.ai\skills\sveltekit-php-adapter
```

All reported `Skill is valid!`.

## Review Inputs

Primary local review surfaces:
- Blog `src/routes/+layout.ts`
- Blog content loaders and rendered public pages
- Blog homepage TypeScript/PHP mirror surfaces
- Blog auth/private routes
- Blog RSS, sitemap, status, and static build outputs
- Adapter `adapter/src/index.ts`
- Adapter runtime PHP and JS-SSR templates
- Adapter route utilities and reserved route checks
- Adapter PHP templates and generated router output
- Adapter release, alpha-readiness, hosted-smoke, and artifact verification contracts

Official Svelte/SvelteKit docs were used as the authority for:
- Adapter API shape (`adapt`, `emulate`, `supports`)
- Static prerendering and SSR/CSR option behavior
- Server-only boundary expectations
- SEO and rendered HTML behavior
- Svelte 5 component/runes compatibility

Fugu delegation was not used for this pass. The review was completed locally with direct verification.

## Remaining Follow-Up Checklist

- Add a blog TypeScript/PHP homepage parity test.
- Reduce blog content/markdown chunk size without changing public prerendered behavior.
- Add direct adapter tests around `emulate().platform` metadata shape.
- Run a real native wrapper smoke before stable release; the current native-host wrapper smoke is deterministic handoff evidence.
- Consider deduplicating generated PHP router helper blocks.
- Document the PHP shared-hosting proxy/origin contract before relying on forwarded headers in more surfaces.
