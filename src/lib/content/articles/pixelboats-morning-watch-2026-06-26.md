---
title: "PixelBoats Morning Watch: P0 scale, collision, pickup, wake, and debug display decoupling"
seo_title: "PixelBoats Morning Watch: P0 scale, collision, pickup, wake, and debug display decoupling | PixelBoats Daily Dev Log"
slug: "pixelboats-morning-watch-2026-06-26"
status: "published"
draft_type: "daily-dev-log"
date: "2026-06-26"
updated_date: "2026-06-26"
audience:
  - "PixelBoats builders"
  - "game engineers"
  - "AI workflow operators"
possible_publication_targets:
  - "ryanspice.com"
  - "AI Wiki inbox"
tags:
  - "PixelBoats"
  - "game dev"
  - "automation"
  - "AI agents"
  - "developer workflow"
  - "daily dev log"
related_posts:
  - "pixelboats-water-pipeline-pixi-webgl"
  - "phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game"
  - "local-fugu-coding-harness"
credits:
  - "Ryan Spice"
  - "Codex PixelBoats insights automation"
accent: "#f4c273"
image: "/img/articles/pixelboats-morning-watch-2026-06-26/pixelboats-morning-watch.svg"
image_alt: "A stylized pixel-art inspired boat crossing a gridded teal sea while amber lead lines connect signals, delegates, and the next implementation slice."
image_credit: "Generated image by Ryan Spice / Codex"
image_position: "center center"
row_image: "/img/articles/pixelboats-morning-watch-2026-06-26/pixelboats-morning-watch-raster.png"
row_image_alt: "A generated PixelBoats concept image with a small ship crossing a dark teal gridded ocean under amber orchestration lines."
row_image_credit: "Generated image by Ryan Spice / Codex"
row_image_position: "center center"
background_image: "/img/articles/pixelboats-morning-watch-2026-06-26/pixelboats-morning-watch.svg"
background_image_alt: "A stylized pixel-art inspired boat crossing a gridded teal sea while amber lead lines connect signals, delegates, and the next implementation slice."
background_image_credit: "Generated image by Ryan Spice / Codex"
background_image_position: "center center"
summary: "A local Pulse-style captain's log that turns the morning fusion run into one readable implementation decision, one source policy, one image, and one code-shaped next move."
seo_description: "A local Pulse-style captain's log that turns the morning fusion run into one readable implementation decision, one source policy, one image, and one code-shaped next move."
---

# PixelBoats Morning Watch: P0 scale, collision, pickup, wake, and debug display decoupling

![A stylized pixel-art inspired boat crossing a gridded teal sea while amber lead lines connect signals, delegates, and the next implementation slice.](/img/articles/pixelboats-morning-watch-2026-06-26/pixelboats-morning-watch.svg)

A local Pulse-style captain's log that turns the morning fusion run into one readable implementation decision, one source policy, one image, and one code-shaped next move.

> A pulse should not be another dashboard. It should be the moment the fog thins enough to steer.
> The next slice earns its place when it touches a matrix row, a question gate, and a runtime check.

This is the public daily-dev-log version of the PixelBoats morning pulse. It is generated from curated repo signals, delegate summaries, and explicit project memory. It is not a dump of private conversation history.

## Source Policy

Curated from repo docs, feature matrix rows, question-board gates, automation memory, safe metadata, generated reports, and delegate summaries. Raw Claude/Codex/Hermes session bodies are not read by default; use a separate redacted export lane before raw conversations become article inputs.

## Style Notes

- Pulse-style: short, ranked, evidence-first, and morning-readable.
- blog.ryanspice.com-style: practical build notes with a human through-line, not a sterile status dump.
- PixelBoats voice: the boat is the body, water is a character, and ports give the work a soul.

## The Signal

missing P0 row. Current surface: legacy/v0.4.34-runtime/; src/lib/game/mock-data.ts. The morning watch should not scatter attention across every open tab; it should name the one piece of hull that will actually hold pressure.

- Matrix gaps: 112
- Open gates: 36
- Delegate lanes: 6

## What The Crew Said

The useful part of orchestration is not pretending the models vote. It is making the disagreement readable enough that the lead can choose the next slice without reopening the whole ocean.

- code-spark: completed. Active spine at `/lab/world-atmosphere-composition-spike` is verified through S4 (single projection); S5 (D/S waterline/wake/displacement) first pass landed at `5ec6d8b` awaiting visual sign-off; S6/S7 (interaction/camera + demo loop) pending. P0 gaps in feature-matrix align with AGENTS.md: lifecycle guardrails, scale/collision decoupling, rock/density, star...
- gemmable-queue: completed. [pixelboats-insights-gemmable-retry] 20s The goal is to identify the single most valuable PixelBoats implementation slice and one thing to avoid, based only on the provided packet. I've read through the entire prompt — it's a meta-prompt about how to answer this exact question for another model in the FUGU workflow. The user has pasted the *instructions* for...
- nemotron-ultra: completed. No pulse.json file exists in the repo; the current TODO.md shows bedrock stages S0–S3 complete, S4 spine verified (no rival projection in spine), S5 first pass landed pending visual sign-off — the plan is on track but the requested pulse artifact is missing.

## The Captain's Call

src/engine/types/boat.ts; src/engine/collision; src/engine/settings-registry.ts.

- Do the smallest source-backed slice.
- Keep A/C as authority and let render/gameplay consume through the packet.
- Turn conversation history into curated summaries, not a raw transcript dependency.

## Code Sketch

A small contract sketch for the next P0 slice; it is article evidence, not applied gameplay code.

```ts
export type BoatScaleProfile = {
  spriteScale: number;
  collisionScale: number;
  pickupRadius: number;
  wakeScale: number;
  debugScale: number;
};

export function resolveBoatFootprint(profile: BoatScaleProfile) {
  return {
    render: profile.spriteScale,
    collision: profile.collisionScale,
    pickup: profile.pickupRadius,
    wake: profile.wakeScale,
    debug: profile.debugScale
  };
}
```

## Generated Visuals

- Morning watch over the collision waterline: /img/articles/pixelboats-morning-watch-2026-06-26/pixelboats-morning-watch.svg
- Raster concept for the morning watch: /img/articles/pixelboats-morning-watch-2026-06-26/pixelboats-morning-watch-raster.png

Generated at 2026-06-26T07:17:21.425Z.
