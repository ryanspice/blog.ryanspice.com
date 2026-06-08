# Prerendered interactivity

The blog is static/prerender-first. Public route data should be generated at build time through SvelteKit load functions, article registries, RSS/sitemap builders, and the PHP-static adapter mirror where needed.

That does not mean public pages need to avoid JavaScript. The preferred pattern is:

1. Render complete HTML and public data at build time.
2. Keep browser-only behavior in a small adjacent runtime script when it is just DOM behavior.
3. Keep Svelte hydration for surfaces that genuinely need framework state, auth, dynamic imports, or route-level data transitions.

## Current adjacent runtime

`src/app.html` now loads `static/site-runtime.js` on every page. It handles browser behavior that should work on prerendered HTML even before Svelte hydrates:

- early reading-mode class application from local storage
- reading-mode toggle buttons marked with `data-reading-mode-toggle`
- copy buttons marked with `data-copy-text` or `data-copy-current-url`
- same-origin back links marked with `data-back-same-origin`
- article scroll progress through `data-scroll-progress`
- active article table-of-contents links

This lets public article and RSS-reader controls remain useful as progressive enhancements instead of requiring component-local Svelte state.

## Still Svelte-hydrated

These pieces still belong in Svelte for now:

- Microsoft/MSAL auth state, owner-gated links, drafts, briefs, login, and status access
- Mermaid rendering on article pages, because the current implementation uses a dynamic package import
- dev-log query filtering, until that page is rewritten to use server/prerendered variants or declarative DOM filtering
- SvelteKit navigation/view-transition hooks in the root layout

## Next candidates

- Move Mermaid enhancement into `site-runtime.js` or a lazy adjacent module if the generated chunks are still too heavy.
- Split owner-only auth chrome out of the default public header/footer path so public articles can eventually opt into `csr = false` where no Svelte runtime is needed.
- Convert simple query views such as `/dev-log/?view=compact` into prerendered/static links or adjacent DOM filtering.
- Keep PHP mirror payloads aligned with TypeScript loaders whenever public route data changes.
