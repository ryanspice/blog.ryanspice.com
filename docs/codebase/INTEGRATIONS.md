# Integrations

## External services and protocols

- Microsoft Entra SSO via MSAL browser library for `/login` and draft-auth behavior.
- Git-based project source lives via GitHub deployment scripts and repository history (CI reads secrets and deploy keys).
- SSH/rsync-like deployment target controlled by `deploy.config.json` and `scripts/Deploy-BlogStatic.ps1`.
- External markdown parsing uses `unified`, `remark`, `rehype`, and plugins (`remark-gfm`, `rehype-stringify`, `rehype-pretty-code`).
- RSS output pathing (`/rss.xml`) and XML compatibility routing to `/rss-reader/`.
- Mermaid diagrams are supported in markdown rendering (`mermaid` dependency).

## Internal integration points

- Built-in PHP adapter contract (`adapter/`) integrates prerender pipeline with shared-host deployment expectations.
- `/status.json` and `/status.live.json` expose runtime/build health payloads.
- `docs/website-catalog` scripts and tests integrate Playwright execution with project web server config.

## Environment/secret dependencies

- Auth client ID and tenant from environment (`VITE_MSAL_CLIENT_ID`, `VITE_MSAL_TENANT_ID`, optional redirect override).
- Deploy credentials and host path are pulled from repo config and GitHub Actions secrets.

## Evidence

- `src/lib/auth.ts`
- `src/routes/login/+page.svelte`
- `src/routes/drafts/+page.svelte`
- `package.json`
- `deploy.config.json`
- `scripts/Deploy-BlogStatic.ps1`
- `scripts/Build-BlogStatic.ps1`
- `.github/workflows/deploy-blog.yml`
- `src/routes/status/+page.server.ts`
- `src/routes/status.json/+server.ts`
- `src/routes/rss-reader/+page.server.ts`
- `src/routes/rss-reader/+page.svelte`
- `src/lib/markdown.ts`

## Open intent vs reality checks

- `[ASK USER]` Should `VITE_MSAL_CLIENT_ID`/tenant behavior be environment-gated for local/offline runs, or should local-only fallback content be introduced for unauthenticated draft preview?
- `[ASK USER]` Is the deploy contract expected to remain PHP-only, or should `js-ssr` be added as a first-class mode in `ADAPTER_MODE` docs and scripts?
