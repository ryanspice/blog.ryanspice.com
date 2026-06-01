# v0.1.0 — Baseline blog app release

This repo had been iterating with higher `0.1.x` numbers while the deployment pipeline, PHP adapter, and content model settled.

We are treating the current blog app shape as the real "first" release now:

- SvelteKit 2 + Svelte 5 (runes) blog UI
- PHP hosting via the vendored adapter (`php-static` mode)
- Static prerendered pages with SSR support from PHP for navigation
- Drafts lane behind Microsoft auth
- `/status/` diagnostic page for build metadata + host bucket counts
- RSS feed at `/rss.xml` with Apache alias redirects from `/rss` and `/feed`

Operationally, production deploy buckets were also cleaned so only the current release stays under `/_releases/` and backups under `/_backups/` were cleared.

