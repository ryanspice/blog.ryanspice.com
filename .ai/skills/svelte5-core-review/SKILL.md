---
name: svelte5-core-review
description: Reviews Svelte 5 components and modules for rune correctness, accessibility, SSR safety, client/server boundaries, and maintainable component structure. Use when editing, auditing, or reviewing .svelte, .svelte.ts, or .svelte.js files in this repo.
---

# Svelte 5 Core Review

Use this skill for Svelte 5 component and module work in `blog.ryanspice.com`.

## Source checks

1. Read `package.json`, `svelte.config.js`, and the specific route/component files before judging patterns.
2. Use official Svelte documentation through the Svelte MCP when syntax, page-option, or migration behavior is uncertain.
3. Run `svelte_autofixer` before finalizing changed Svelte component/module code.

## Review focus

- Prefer Svelte 5 event attributes such as `onclick`, not legacy `on:click`, for new code.
- Use `$state` only for values that drive reactive UI, `$derived` for computed values, and `$effect` only for side effects.
- Keep public article and shell UI usable when `csr = false`; do not rely on component scripts for baseline navigation or content.
- Keep browser-only APIs out of module scope and server load paths.
- Prefer semantic HTML, real links/buttons, labels, focus states, and Svelte accessibility warnings over ARIA patches.
- Avoid broad stores or shared mutable module state unless state truly crosses component boundaries.

## Verification

Run the narrowest useful command first, then broaden:

```powershell
pnpm run check
pnpm run test:unit
pnpm run build:blog
```

If a component change affects rendered public pages, inspect generated or served HTML, not just source.
