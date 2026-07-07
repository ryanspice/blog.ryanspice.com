---
name: sveltekit2-static-blog
description: Guides SvelteKit 2 static-first blog work, including route options, load functions, prerender entries, SEO metadata, rendered HTML checks, and pnpm verification. Use when editing or reviewing routes, loaders, content surfaces, RSS, sitemap, status, or public blog output.
---

# SvelteKit 2 Static Blog

Use this skill for SvelteKit route, data, and public-output work in `blog.ryanspice.com`.

## Core contract

- `src/routes/+layout.ts` is the public rendering contract: `prerender = true`, `ssr = true`, `csr = false`.
- SSR must remain enabled for meaningful prerendered HTML. Do not use `ssr = false` to avoid browser-only bugs.
- `csr = false` means baseline public pages must work with HTML/CSS and normal browser navigation.
- Dynamic public routes need explicit entries or crawlable links so SvelteKit can prerender them.
- Pages with form actions or private per-user data should not be blindly marked prerenderable.

## Review focus

- Keep load output serializable and public-safe. Server-only secrets stay out of universal load and page data.
- Confirm canonical URLs, alternate URLs, title, description, RSS, and sitemap output match localized route behavior.
- Review rendered output for public pages, especially `/`, `/fr`, article pages, `/rss.xml`, `/sitemap.xml`, `/rss-reader`, `/status`, and owner-gated surfaces.
- Use real links for crawlable navigation. Avoid hash-only or JavaScript-only public navigation.
- Keep Ryan and Canopy builds serial because they share `build`.

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

Use Playwright or PHP smoke when a change affects runtime behavior, navigation, or generated output.
