# v0.1.5 — Faithful HTML-to-Svelte article port

## Reason

The previous Svelte route was only inspired by the attached HTML demos. It flattened the source designs into a generic article profile and publishing-notes rail.

The attached HTML demos were more specific than that. They defined per-article headers, hero metadata, right rail content, chips/palette, callouts, footer copy, and article body hierarchy.

## Changes

- `src/lib/articles.ts`
  - Adds article-specific `ArticleDesign` metadata.
  - Encodes the exact hero-card status rows from both source demos.
  - Encodes article-specific nav anchors, rail copy, palette/chips, callouts, tags, and footer text.

- `src/lib/components/ArticleView.svelte`
  - Rebuilds article pages around the source demo structure:
    - read progress;
    - article-specific `SiteHeader`;
    - hero;
    - hero card;
    - sticky TOC;
    - article shell;
    - right rail;
    - footer.

- `src/lib/components/SiteHeader.svelte`
  - Accepts brand and nav item props instead of forcing generic blog links.

- `src/lib/markdown.ts`
  - Renders Markdown H1 headings as real `<h1>` elements.
  - Keeps H2/H3 in the TOC.

- `src/app.css`
  - Adds missing source demo pieces:
    - `.palette-preview`;
    - `.swatch`;
    - `.callout`;
    - `.debug-chip`;
    - source-style `footer`;
    - repair/debug article theme variables.

## Verification

```powershell
cd "<AI_WIKI_ROOT>\07_Projects\blog.ryanspice.com"
pnpm check
pnpm run build:blog
pnpm dev
```

