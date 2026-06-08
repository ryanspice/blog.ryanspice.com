# Structure

## Repo layout

- `src/` — app runtime: routes, hooks, CSS, and server/client modules.
- `src/routes/` — route handlers and pages, including:
  - `+layout.svelte`, `+layout.server.ts`, `+layout.ts`, `+page.svelte`, `+page.server.ts`
  - Feature routes: `lib`, `dev-log`, `drafts`, `library`, `briefs`, `status`, `rss-reader`, `rss.xml`, `sitemap.xml`, `login`, `auth/callback`, `[slug]`, `[lang=lang]`.
- `src/lib/` — shared app code:
  - `articles.ts`, `article-frontmatter.ts`, `markdown.ts`, `i18n/`, `components/`, `server/`, `content/`.
- `src/lib/content/articles/` — source markdown content.
- `src/lib/content/articles/fr/` — French translated content.
- `src/lib/content/articles/.versions/` — version history for article revisions.
- `src/lib/server/` — server-only utilities (status, RSS, research images, draft filtering helpers).
- `static/` — static assets, includes `.htaccess` overlay and browser-facing resources.
- `adapter/` — vendored SvelteKit PHP adapter package and runtime helper sources.
- `scripts/` — build, deploy, audit, catalog, and translation/build support scripts.
- `tests/e2e/` and `tests/unit/` — Playwright and Vitest coverage.
- `.github/workflows/deploy-blog.yml` — CI/CD pipeline.
- `docs/website-catalog/` — generated catalog artifacts.

## Critical path for content publication

1. Markdown under `src/lib/content/articles/` is parsed at build/load time.
2. Route data is assembled in `src/lib/articles.ts` and `src/lib/server/home-page.ts`.
3. SvelteKit page routes render article/home/dev/log/feed/status pages.
4. Build generates static output through PHP adapter via `scripts/Build-BlogStatic.ps1`.

## Evidence

- `src/lib/content/articles/`
- `src/routes`
- `src/lib/articles.ts`
- `src/lib/markdown.ts`
- `src/lib/server/home-page.ts`
- `scripts/Build-BlogStatic.ps1`
- `svelte.config.js`

## Open intent vs reality checks

- `[ASK USER]` Should `src/lib/content/articles/.versions` be treated as first-class contract for runtime compatibility checks, or documentation-only history?
