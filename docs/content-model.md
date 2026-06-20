# Content Model

## Article frontmatter

Article metadata is file-backed Markdown frontmatter. The draft editor can update the scheduling
and visual fields below through the SvelteKit/PHP route action, but the source file remains the
truth. Keep values public-safe: no secrets, exact private paths, tokens, or sensitive personal data.

```yaml
title: "Article title"
slug: "article-slug"
status: "draft" # draft | scheduled | published
draft_type: "technical-blog-post"
date: "2026-06-04"
updated_date: "2026-06-04"
publish_at: "2026-06-05T08:15"
release_date: "2026-06-05"
release_time: "08:15"
summary: "Short article summary."
accent: "#7c5cff"
image: "/img/articles/article-slug/focal.webp"
image_alt: "Accessible description of the main article visual."
image_credit: "Photographer or generated asset credit."
image_source: "https://example.com/source"
image_position: "center center"
row_image: "/img/articles/article-slug/row.webp"
row_image_alt: "Optional row-card image alt text."
row_image_credit: "Optional row-card credit."
row_image_source: "https://example.com/source"
row_image_position: "center 48%"
background_image: "/img/articles/article-slug/background.webp"
background_image_alt: "Optional article background alt text."
background_image_credit: "Optional background credit."
background_image_source: "https://example.com/source"
background_image_position: "center center"
tags:
  - tag
  - another-tag
audience:
  - reader group
related_posts:
  - "other-post.md"
references:
  - "Primary source label|https://example.com/source"
further_reading:
  - "Related article label|/related-article/"
```

The editor intentionally uses flat YAML keys instead of nested objects. This keeps the PHP mirror
simple and predictable when it rewrites only the managed scalar fields.

`status: scheduled` is public only after `release_date` plus `release_time` has passed in the
America/Toronto timezone. `status: published` is public immediately. `status: draft` remains in
the gated draft route.

Visual fallbacks:

- `image` is the primary article visual for the article side/focal slot and Open Graph fallback.
- If `row_image` is absent, article cards use `image`.
- If `background_image` is absent, article pages use `image` as the background.
- Use root-relative `/img/...` paths for committed static assets, or a licensed remote URL for
  external topical images. Prefer committed static assets for article diagrams and generated media.
- For illustrated posts, do not reuse the same asset for the article side slot and the first inline
  body figure unless that repetition is intentional. Generate or source a distinct `image` visual
  for the side slot, then use the body figure for the explanatory diagram or screenshot.

Source and reading-link conventions:

- Use `references` for primary sources that support factual claims. Entries can be plain URLs or
  `Label|URL` values when the display label should be cleaner than the raw URL.
- Use `further_reading` for secondary material, internal follow-up posts, or background links that
  are useful next but are not primary factual support.
- Do not repeat the same source list at the end of the Markdown body. The article route renders
  `references` and `further_reading` as separated post-article sections.

Tag and relationship conventions:

- Use human-readable display tags in frontmatter, with brand casing where it helps readability
  (`DeepSeek`, `SvelteKit`, `PixelBoats`, `Microsoft Store`).
- Search and filters normalize common variants, so `developer-workflow` and `developer workflow`
  or `deepseek` and `DeepSeek` should still land in the same result set.
- Use `related_posts` for article-to-article links. Slugs, filenames, and dated filenames are
  accepted, but plain slugs are easiest to read and maintain.

## Dev-log article relationships

Public dev-log entries live in `src/lib/dev-log.ts`. Each entry may include
`relatedArticleSlugs` for explicit article links plus `relatedArticleTags` for broader searchable
topic overlap.

Use `relatedArticleSlugs` when a dev-log entry directly explains how a public article was researched,
edited, illustrated, verified, or published. Keep the summary sanitized: no secrets, exact private
paths, raw prompts, account details, or sensitive personal context. The article route renders these
entries as a public "How this got made" trail, and `/dev-log/?article=<slug>` filters the process
log to that article.

## Markdown supported by the v0.1.0 renderer

- `##` and `###` headings with generated TOC anchors
- paragraphs
- unordered and ordered lists
- fenced code blocks
- basic PowerShell code highlighting
- Markdown tables
- inline code
- bold and italic
- regular links
- basic Obsidian-style wiki links with labels: `[[slug|Label]]`

## Known limitations

This renderer is intentionally small. It is fine for the two starter posts, but it is not a full Markdown implementation. If posts start requiring images, footnotes, callouts, nested lists, MD components, or richer syntax highlighting, move to MDsveX or a unified/remark pipeline.
