# Content Model

## Article frontmatter

Supported now:

```yaml
title: "Article title"
slug: "article-slug"
status: "draft"
draft_type: "technical-blog-post"
summary: "Short article summary."
tags:
  - tag
  - another-tag
audience:
  - reader group
related_posts:
  - "other-post.md"
```

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
