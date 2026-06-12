# Architecture

## High-level architecture

- SvelteKit app with mostly server-loaded pages and partial client interactivity.
- `src/routes/+layout.svelte` applies global shell, locale language, and site-wide link preloads.
- Server hooks set locale from pathname and render RSS-friendly fallbacks (`src/hooks.server.ts`).
- Global configuration enforces prerendering via `svelte.config.js` and custom PHP adapter settings.
- Content model is file-backed:
  - Markdown files are imported from `src/lib/content/articles/` (`import.meta.glob(... '?raw')`).
  - A markdown processor (`src/lib/markdown.ts`) normalizes markdown, builds TOC, and injects link/callout/image behavior.
  - Route-level loaders combine that content with dictionaries and route-specific metadata.

## Server/client boundaries

- Route loaders in `src/routes/*/+page.server.ts` supply typed data and localized metadata.
- Components consume load data and `PageData` in `+page.svelte`.
- Browser-only auth and interactive controls live in `src/lib/auth.ts` and page scripts.
- Some pages perform runtime article filtering/searching in client code while retaining initial SSR output (`src/lib/articles.ts` + route loaders).
- Draft routes (`/drafts/`) use auth gating and conditional rendering (authenticated vs anonymous).

## Integrations in delivery

- Deployment is static-first:
  - `scripts/Build-BlogStatic.ps1` runs `pnpm exec vite build`.
  - Deploy helper overlays `.htaccess` and enforces adapter contract files.
  - Deploy config is driven by `deploy.config.json` and environment-specific wrappers.
- CI runs check + static build + audit on push/push schedule.

## Evidence

- `src/hooks.server.ts`
- `src/routes/+layout.svelte`
- `src/routes/+layout.server.ts`
- `src/lib/articles.ts`
- `src/lib/markdown.ts`
- `src/lib/server/home-page.ts`
- `svelte.config.js`
- `scripts/Build-BlogStatic.ps1`
- `.github/workflows/deploy-blog.yml`

## Open intent vs reality checks

- `[ASK USER]` Should route-level client fallbacks (for `articles` and `drafts`) be hardened with a stricter serialization boundary, or is current hydration resilience sufficient?
- `[ASK USER]` Is the current full-page static prerender strategy required for all current routes, or should selected routes become runtime-rendered in `js-ssr` for tooling features?
