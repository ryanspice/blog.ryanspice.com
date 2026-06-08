# blog.ryanspice.com

SvelteKit 2 / Svelte 5 blog application built for PHP hosting with a vendored SvelteKit PHP adapter:

```txt
<AI_WIKI_ROOT>\07_Projects\blog.ryanspice.com
```

## What this includes

- `src/lib/content/articles/` — the two normalized Markdown blog drafts.
- `src/routes/[slug]` — prerendered article pages.
- `src/routes/+page.svelte` — article index.
- `src/routes/login` and `src/routes/auth/callback` — Microsoft sign-in flow for the private draft queue.
- `src/app.css` — UI adapted from the two attached HTML article demos.
- `adapter/` — vendored SvelteKit PHP adapter entrypoint and PHP runtime helper.
- `context/source-articles/` — source Markdown copies.
- `context/source-html/` — source HTML demo copies.
- `context/source-skills/` — uploaded skill references used for this scaffold.
- `.ai/skills/blog-ryanspice-com/SKILL.md` — project-local pointer skill notes.
- `.thoughts` — project state and continuation note.

## Support policy

- Official support floor: PHP 8.1+
- Recommended production target: PHP 8.3+
- Supported deployment styles: Apache, Nginx, shared hosting, and PHP-FPM-backed hosts
- `php-static` is the blog’s production path
- `js-ssr` is JavaScript-sidecar SSR behind PHP, not a separate Node-branded mode
- Historical notes under `docs/AUDIT-*` and `docs/CHAT-*` are archival snapshots, not current contract

## Dependency policy

This project is **pnpm-first**. The pnpm content-addressed store may live outside the synced project folder, but the pnpm virtual store must stay local to the worktree:

```txt
07_Projects\blog.ryanspice.com\node_modules\.pnpm
```

Do not recreate `node_modules` as a junction. SvelteKit/Rollup can generate invalid SSR entry names when dependency realpaths cross drives.

## Commands

```powershell
cd "<AI_WIKI_ROOT>\07_Projects\blog.ryanspice.com"
pnpm install
pnpm check
pnpm run build:blog
pnpm run audit:seo
pnpm dev
```

## Microsoft auth

Create `.env` from `.env.example` and fill in your Microsoft Entra app registration:

```txt
VITE_MSAL_CLIENT_ID="your-client-id"
VITE_MSAL_TENANT_ID="common"
```

The login page at `/login` starts the Microsoft sign-in flow, and `/auth/callback` completes the redirect before sending you back to the requested draft route. The redirect URI is resolved from the current origin at runtime unless you pin `VITE_MSAL_REDIRECT_URI` explicitly.

Draft navigation and the private draft queue are only exposed to the configured owner Microsoft account; other signed-in accounts stay on the public surface. The owner comparison uses a SHA-256 hash of the normalized owner email rather than publishing the raw account address.

The GitHub deploy workflow also needs `VITE_MSAL_CLIENT_ID` available at build time so the production bundle carries the same Microsoft auth config as local development.

The app registration I created for this repo is `blog.ryanspice.com draft auth`, with SPA redirect URIs for:

- `http://localhost:5173/auth/callback`
- `http://127.0.0.1:5173/auth/callback`
- `http://127.0.0.1:4178/auth/callback`
- `https://blog.ryanspice.com/auth/callback`

If you recreate it later, keep `User.Read` delegated permission attached as well.

## Notes

- The site now builds through the vendored PHP adapter in `adapter/index.js`.
- `scripts/Sync-SvelteKitPhpAdapter.ps1` rebuilds/syncs the canonical adapter from the configured SvelteKit PHP adapter checkout and writes `adapter/source-manifest.json`.
- `scripts/Build-BlogStatic.ps1` merges the host redirect overlay from `static/.htaccess` into the adapter-generated `.htaccess`.
- Release flow: build, audit the PHP output contract, smoke the built site under PHP, then deploy.
- Markdown is rendered through a small local renderer in `src/lib/markdown.ts` to avoid early dependency creep.
- Deployment expects `blog.ryanspice.com` at the domain root by default; override `PUBLIC_BASE_PATH` / `PUBLIC_SITE_URL` (or `deploy.config.json`) if you need to serve from a subpath.
- SSH deploy requires an authorized public key (cPanel typically: SSH Access → Manage SSH Keys → Import Key → Authorize), plus the correct `deploy.config.json` `user` (usually the cPanel account username) and `remotePath` (the domain/subdomain document root).
- The next useful pass is validating the PHP-hosted delivery path in-browser and then deciding whether MDsveX or a small content pipeline is still worth adding.

