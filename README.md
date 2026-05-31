# blog.ryanspice.com

SvelteKit 2 / Svelte 5 static blog application staged for the AI Wiki project folder:

```txt
<AI_WIKI_ROOT>\07_Projects\blog.ryanspice.com
```

## What this includes

- `src/lib/content/articles/` — the two normalized Markdown blog drafts.
- `src/routes/[slug]` — prerendered article pages.
- `src/routes/+page.svelte` — article index.
- `src/routes/login` and `src/routes/auth/callback` — Microsoft sign-in flow for the private draft queue.
- `src/app.css` — UI adapted from the two attached HTML article demos.
- `context/source-articles/` — source Markdown copies.
- `context/source-html/` — source HTML demo copies.
- `context/source-skills/` — uploaded skill references used for this scaffold.
- `.ai/skills/blog-ryanspice-com/SKILL.md` — project-local pointer skill notes.
- `.thoughts` — project state and continuation note.

## Dependency policy

This project is **pnpm-first** as a trial. `node_modules` should stay out of OneDrive/AI Wiki storage by using the installer-created junction:

```txt
07_Projects\blog.ryanspice.com\node_modules -> B:\AI-Wiki\.runtime\projects\blog.ryanspice.com\node_modules
```

Do not manually copy `node_modules` into the AI Wiki.

## Commands

```powershell
cd "<AI_WIKI_ROOT>\07_Projects\blog.ryanspice.com"
pnpm install
pnpm check
pnpm build
pnpm dev
```

## Microsoft auth

Create `.env` from `.env.example` and fill in your Microsoft Entra app registration:

```txt
VITE_MSAL_CLIENT_ID="your-client-id"
VITE_MSAL_TENANT_ID="common"
```

The login page at `/login` starts the Microsoft sign-in flow, and `/auth/callback` completes the redirect before sending you back to the requested draft route. The redirect URI is resolved from the current origin at runtime unless you pin `VITE_MSAL_REDIRECT_URI` explicitly.

Draft navigation and the private draft queue are only exposed to the owner Microsoft account `spice.ryan@hotmail.com`; other signed-in accounts stay on the public surface.

The app registration I created for this repo is `blog.ryanspice.com draft auth`, with SPA redirect URIs for:

- `http://localhost:5173/auth/callback`
- `http://127.0.0.1:5173/auth/callback`
- `http://127.0.0.1:4178/auth/callback`
- `https://blog.ryanspice.com/auth/callback`

If you recreate it later, keep `User.Read` delegated permission attached as well.

## Notes

- The site is static-first via `@sveltejs/adapter-static`.
- Markdown is rendered through a small local renderer in `src/lib/markdown.ts` to avoid early dependency creep.
- Deployment expects `blog.ryanspice.com` at the domain root by default; override `PUBLIC_BASE_PATH` / `PUBLIC_SITE_URL` (or `deploy.config.json`) if you need to serve from a subpath.
- SSH deploy requires an authorized public key (cPanel typically: SSH Access → Manage SSH Keys → Import Key → Authorize), plus the correct `deploy.config.json` `user` (usually the cPanel account username) and `remotePath` (the domain/subdomain document root).
- This is a starter build. The next useful pass is moving toward MDsveX or a small content pipeline only if the local renderer starts fighting the articles.

