# Conventions

## Coding style

- TypeScript is used for route components and utility modules.
- Svelte 5 runes style is used in many client components (`$state`, `$derived`, `$props`) and server/client separation uses explicit store boundaries.
- Module imports use the `$lib` and `$app` aliases consistently.
- Errors are narrowed and converted to user-safe messages before surfacing to UI (e.g., in auth helpers and page scripts).
- Guard helpers and safe-serializing wrappers are preferred in UI-facing data transforms (`toSafeArticle`, `toString`, defensive parsing).

## Project conventions

- Locale is handled via:
  - `src/lib/i18n/locales.ts`
  - `src/lib/i18n/dictionaries.ts`
  - route parameter `[lang=lang]`
  - locale-aware path generation in UI copy.
- Frontmatter and article metadata are normalized into a single `Article` contract (`src/lib/articles.ts`).
- Metadata and SEO tags are declared in `svelte:head` within route components.
- Auth gate behavior is centralized in one store module (`auth.ts`) and used by `/login` and `/drafts`.
- Route-level files prefer explicit server/client split (`+page.server.ts` + `+page.svelte`, route-level `prerender = true` where static behavior is required).

## Route/path conventions

- Most public content routes are trailing-slash normalized (`trailingSlash = 'always'` in `src/routes/+page.server.ts`).
- Dynamic article route uses `/[slug]/` path.
- API/data responses include JSON endpoints (`/status.json`, `/status.live.json`).

## Evidence

- `src/lib/i18n/locales.ts`
- `src/lib/i18n/dictionaries.ts`
- `src/lib/articles.ts`
- `src/routes/[slug]/+page.svelte`
- `src/routes/login/+page.svelte`
- `src/routes/drafts/+page.svelte`
- `src/routes/+layout.svelte`
- `src/routes/+page.server.ts`

## Open intent vs reality checks

- `[ASK USER]` Should we enforce a stricter naming convention for article slug helpers (e.g., consistent `article-*` prefixes) in markdown frontmatter and component IDs?
- `[TODO]` Standardize shared test helpers for catalog/e2e route checks (current catalog tests include local fallback logic for intermittent navigation failures; this pattern is not documented yet).
