# Architecture

## Goal

Create a practical SvelteKit application for `blog.ryanspice.com` inside the AI Wiki without turning the vault into a dependency landfill.

## Decisions

| Area | Decision | Reason |
|---|---|---|
| App framework | SvelteKit 2 + Svelte 5 | Matches current project direction and keeps routes/static output straightforward. |
| Package manager | pnpm trial | Good dependency isolation and a useful comparison against Bun for AI Wiki-hosted apps. |
| Rendering | Static/prerender-first | Blog content is public and authored locally. |
| Markdown | Local renderer for v0.1.0 | Avoids adding MDsveX/remark/shiki before the workflow proves itself. |
| Styling | Global token CSS adapted from HTML demos | Faster for a two-post blog shell; can componentize later. |
| Dependencies | External `node_modules` junction | Keeps OneDrive/Obsidian from crawling dependency trees. |

## Route map

```txt
/                         Home page
/blog                     Article index
/blog/[slug]              Article detail
```

## Content flow

```txt
src/lib/content/articles/*.md
  -> import.meta.glob(raw)
  -> parse frontmatter
  -> render local markdown
  -> prerender article routes
```

## Upgrade path

1. Verify pnpm install/check/build on Windows.
2. Tune the visual shell against the original HTML demos.
3. Add RSS, sitemap, and canonical metadata.
4. Decide whether to keep the local renderer or move to MDsveX.
5. Add deployment target once the domain path is chosen.
