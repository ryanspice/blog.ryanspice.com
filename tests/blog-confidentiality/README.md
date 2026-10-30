# Blog confidentiality regression tests

These tests guard the private morning-brief and private version-snapshot slice of the blog confidentiality work. They are designed to run in the real repository and in CI, not only in an external harness.

## What it proves

1. Builds an isolated copy of the project with:
   - synthetic public EN and FR articles,
   - an explicitly public historical version of a public article,
   - a private revision of that public slug,
   - a future revision of that public slug,
   - a synthetic private draft article,
   - a synthetic private morning brief and an archived brief.
2. Runs the actual private-content generator and the real Vite/SvelteKit build.
3. Audits every generated HTML, JSON, JS, chunk, asset, feed and sitemap file for the synthetic private sentinels and private slugs.
4. Confirms that:
   - private Markdown and private payloads stay outside `build/`,
   - private article/brief manifests contain metadata but no raw Markdown body,
   - private briefs are absent from every public output,
   - public EN/FR content and a genuinely public version remain present.
5. Starts the built PHP router plus the real `/drafts/owner/private/` endpoint with a test-only fake Microsoft Graph stream wrapper, and verifies:
   - anonymous, invalid, revoked and non-owner requests are denied before private content is read,
   - a verified synthetic owner can list and read articles and briefs,
   - `kind` defaults to articles, `kind=briefs` is finite, unknown kinds return `400`,
   - traversal slugs are rejected,
   - archived briefs are not served,
   - missing owner configuration / missing brief manifest return `503`,
   - `no-store`, `Vary: Authorization`, and no wildcard CORS,
   - the legacy `/briefs/<slug>/` URL redirects without private content.

## Run

From the repository root:

```powershell
pnpm run test:confidentiality
```

Requirements:

- dependencies installed (`pnpm install --frozen-lockfile --ignore-scripts`),
- Node 20.11 or newer,
- PHP 8.5 (set `PHP_BIN` if `php` is not on `PATH`).

Useful environment variables:

| Variable | Purpose |
| --- | --- |
| `PHP_BIN` | PHP executable used for the built endpoint tests |
| `BLOG_CONFIDENTIALITY_REPORT` | report JSON path (defaults under `output/`) |
| `BLOG_CONFIDENTIALITY_LOG_DIR` | build/PHP log directory |
| `BLOG_CONFIDENTIALITY_WORKDIR` | isolated build workspace (deleted after a run) |
| `KEEP_CONFIDENTIALITY_WORKSPACE=1` | keep the isolated workspace for debugging |
| `BLOG_CONFIDENTIALITY_PUBLIC_CONTENT_ROOT` | public article source root for a staged packet |

The generated workspace and logs live under `output/`, which is already gitignored. The script reads only frontmatter of repository articles when selecting public source files; it never copies private Markdown into the fixture workspace. The synthetic private fixtures are the only private content written into the test workspace. Do not change the fixture sentinels without updating `run.mjs`.

The test router explicitly loads the Graph wrapper before the generated application router. It intercepts `https://graph.microsoft.com/` and answers from synthetic profiles. Native URL streams are disabled in these PHP test processes, so a missing wrapper cannot fall through to Microsoft. The custom wrapper uses PHP's default local-stream flag; see [PHP's stream wrapper contract](https://www.php.net/stream_wrapper_register). None of this test transport is deployed.
