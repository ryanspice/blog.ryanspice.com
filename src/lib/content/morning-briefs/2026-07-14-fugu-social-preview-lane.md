---
title: Fugu and Social Preview Lane
slug: 2026-07-14-fugu-social-preview-lane
date: 2026-07-14
summary: Owner-gated brief for the rebuilt Fugu article, social-preview hardening, and stale PixelBoats pulse gate.
tags:
  - blog
  - automation
  - ai
  - seo
  - sveltekit-php
  - developer-workflow
projects:
  - personal-website
  - pixelboats
  - sveltekit-php
  - efsdb
  - live-wallpapers
  - keyword-astro
  - ai-wiki
  - hurrcut
  - needle
  - seo-audit
  - lg-ultragear
  - 12bar
  - sidecar
status: private
---

# Fugu and Social Preview Lane

Source window: after the July 10 brief through July 14. Sources checked: the automation contract and memory, blog repo guidance, fetched history and current files, shared AI Wiki memory, Codex memory summaries, PixelBoats pulse metadata, and live Ryan/Canopy routes. Hermes remained interactive-only, so no helper session was launched. Private runtime stores, browser state, credentials, environment values, raw messages, app databases, and raw logs were not read.

## What Changed

- The Fugu Fusion harness article was rebuilt as the current operational guide while the June version was preserved as a dated historical snapshot.
- Ryan and Canopy social cards were regenerated, including cards for recent PixelBoats pulse articles.
- A separate hardening pass added deployment handling and unit/audit coverage for production social-preview assets.
- Current route checks return HTTP 200 for the July 10 PixelBoats article and for the Fugu harness article on both blog identities.
- PixelBoats still points at its July 10 Insights pulse. There is no July 14 artifact or active run signal, so no wait loop or publisher action was needed.

## Focus Today

1. Reconcile the local branch with the eight newer `origin/main` commits in a dedicated release pass; do not mix the current dirty worktree into an automation commit.
2. Review the bilingual bundle fields and owner gate before enabling French publication or Canopy engineering promotion.
3. Keep social previews covered as an end-to-end deploy contract, not only a metadata helper.
4. Preserve the distinction between current Fugu operating guidance and the archived June snapshot.
5. Wait for a fresh schema-v4 PixelBoats article instead of republishing the stale July 10 pulse.

## Research Queue

- PixelBoats: current-day schema-v4 pulse, Insights proof slice, Lab-route smoke, question-board crosscheck, owner-GPU proof, WorldRenderPacket authority, water rendering, Sea Loop feel, lore, tavern slice, and HUD readability.
- SvelteKit PHP adapter: clean-worktree deploy config, social-image upload proof, hosted PHP behavior, static routing, native-host bridge evidence, adapter drift, and runtime-root hygiene.
- EFSDB: fixtures, local-first durability, schema/migration boundaries, PHP wrapper evidence, and contract examples.
- Live wallpapers: source discovery, Windows packaging, render/idle budgets, GPU use, and distribution.
- keyword-astro: connector quality, partial-success UX, Store readiness, Android scope, privacy, crawl ergonomics, and SEO proof.
- AI Wiki/Hermes: non-interactive helper reliability, shared-memory search, Fugu routing drift, handoffs, and privacy-safe skills.
- HurrCut: v2 launch proof, Tauri/browser parity, signed media, export reliability, voiceover lanes, and route consolidation.
- Needle: standalone tooling fixture, runtime fit, assets, browser constraints, and experimental scope.
- SEO audit: production score, social images, sitemap/RSS, structured data, live/local drift, and canonical routes.
- LG UltraGear: hardware/operator proof, tray state, refresh behavior, durable settings, polling boundaries, and test freshness.
- 12Bar: native/manual smoke, media-widget edges, shell baseline, release proof, and browser repeatability.
- Sidecar: IPC safety, packaging, scope, estimation quality, geometry regression coverage, and product boundary.
- Personal website: branch reconciliation, bilingual publication gate, portfolio/authority goals, RSS/sitemap health, canonical routes, and private brief continuity.

## Watchlist

- The local checkout is stale and dirty; publishing from it would mix unrelated work.
- French remains owner-review work until the translation gate passes.
- A stale PixelBoats latest pointer is not a current publication signal.
- Current external claims require official or primary-source refresh before promotion.

## Suggested Public Tags

`blog`, `automation`, `ai`, `seo`, `sveltekit-php`, `developer workflow`

## Privacy Notes

This website-readable brief is sanitized. It omits raw assistant conversations, private paths, credentials, environment values, browser state, account identifiers, and deploy secrets.
