---
title: Agent Skills Provenance and pnpm Cleanup Blog Draft
created: 2026-05-30
type: blog-draft
status: proposed
tags:
  - ai-wiki
  - agent-skills
  - provenance
  - pnpm
  - prompt-operations
  - blog
---

# Agent Skills Provenance and pnpm Cleanup Blog Draft

## Summary

This proposed blog draft turns the May 30, 2026 `agent-skills` cleanup into a public-facing engineering note.

Core angle:

> AI workflows do not only need better prompts. They need clean context maintenance: provenance, package-manager discipline, duplicate control, and index validation.

## Public publishing stance

Use placeholders and general language for local paths when publishing publicly.

Recommended public placeholders:

```text
<AI_WIKI_ROOT>
<AGENT_SKILLS_REPO>
<BLOG_REPO>
```

Avoid publishing exact machine-specific paths unless the article is explicitly a Windows-local workflow diary.

## Files in this package

- `blog/blog.ryanspice.com-agent-skills-provenance-pnpm.mdx` — full MDX blog draft.
- `blog/fragments/agent-skills-provenance-pnpm-fragment.md` — shorter reusable fragment.
- `aiwiki/agent-skills-provenance-pnpm-cleanup.md` — this AI Wiki companion note.
- `aiwiki/blog-publish-checklist.md` — checklist before moving into `blog.ryanspice.com`.
- `prompts/codex-continue-deep-research-skill-promotion.md` — prompt to continue the repo skill promotion cleanly.

## Related

- [[prompt-operations-handbook]]
- [[aiwiki-deep-research-orchestrator]]
- [[deep-research-workflow]]
- [[enterprise-deep-research-workflow]]
- [[repo-skill-recommender]]
- [[aiwiki-command-layer-notes]]
