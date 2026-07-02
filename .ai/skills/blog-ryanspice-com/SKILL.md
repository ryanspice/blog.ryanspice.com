---
name: blog-ryanspice-com
description: Provides project-local guidance for blog.ryanspice.com work, including SvelteKit 2, Svelte 5, pnpm, static PHP deployment, adapter sync, content safety, and repo-local review skills. Use when working in this blog repo or coordinating it with the sveltekit-php adapter.
---

# blog.ryanspice.com Project Skill Pointer

This is a project-local pointer for the AI Wiki project at:

```txt
07_Projects/blog.ryanspice.com
```

Canonical reusable skills remain under:

```txt
04_skills/universal
04_skills/projects
```

## Project defaults

- SvelteKit 2 + Svelte 5.
- pnpm-first trial.
- Static/prerender-first blog routes.
- Keep `node_modules\.pnpm` local to this worktree; do not recreate `node_modules` as a junction across drives.
- Keep source article Markdown and source HTML demos under `context/` as evidence.
- Keep public blog posts free of secrets, client-sensitive material, and private system paths unless intentionally framed as local workstation notes.
- Public route contract starts at `src/routes/+layout.ts`: `prerender = true`, `ssr = true`, `csr = false`.
- Production uses the committed vendored PHP adapter under `adapter/`.
- Public article publish passes should propagate to `blog.ryanspice.com`, `blog.canopydigital.ca`, and, when relevant, the root `canopydigital.ca` engineering/home teaser surface.
- Current-day draft promotion should remove `-draft` from the public slug/filename, strip draft-only local source fields, and set `date`, `updated_date`, `release_date`, and `release_time` before publish.

## Repo-local skills

- `svelte5-core-review` — component/module review, Svelte 5 runes, accessibility, and client/server boundaries.
- `sveltekit2-static-blog` — SvelteKit routing, load functions, prerender/SSR/CSR, SEO, and rendered HTML checks.
- `php-static-blog-runtime` — PHP-static host runtime, PHP mirrors, generated router files, adapter sync, and deploy safety.

## Adapter sync contract

- Canonical source: `B:\Dev\sveltekit-php`.
- Vendored files: `adapter/index.js` and `adapter/src/runtime/php-compat.php`.
- Receipt: `adapter/source-manifest.json`.
- Sync command:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\Sync-SvelteKitPhpAdapter.ps1 -AdapterRoot "B:\Dev\sveltekit-php"
```

Do not sync during ordinary builds. Use the committed vendored adapter unless the task is explicitly adapter review or update work.

## Verification

```powershell
pnpm run audit:files
pnpm run check
pnpm run test:unit
pnpm run build:blog
pnpm run audit:seo
pnpm run build:blog:canopy
pnpm run audit:seo
```
