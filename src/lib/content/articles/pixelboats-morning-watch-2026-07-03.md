---
title: "PixelBoats Morning Watch: P0 NPC, pirate, and shipwreck lifecycle guardrail"
seo_title: "PixelBoats Morning Watch: P0 NPC, pirate, and shipwreck lifecycle guardrail | PixelBoats Daily Dev Log"
slug: "pixelboats-morning-watch-2026-07-03"
status: "published"
draft_type: "daily-dev-log"
date: "2026-07-03"
updated_date: "2026-07-03"
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
image: "/img/articles/pixelboats-morning-watch-2026-07-03/pixelboats-morning-watch.svg"
image_alt: "A stylized pixel-art inspired boat crossing a gridded teal sea while amber lead lines connect signals, delegates, and the next implementation slice."
image_credit: "Generated image by Ryan Spice / Codex"
image_position: "center center"
row_image: "/img/articles/pixelboats-morning-watch-2026-07-03/pixelboats-morning-watch-raster.png"
row_image_alt: "A generated PixelBoats concept image with a small ship crossing a dark teal gridded ocean under amber orchestration lines."
row_image_credit: "Generated image by Ryan Spice / Codex"
row_image_position: "center center"
background_image: "/img/articles/pixelboats-morning-watch-2026-07-03/pixelboats-morning-watch.svg"
background_image_alt: "A stylized pixel-art inspired boat crossing a gridded teal sea while amber lead lines connect signals, delegates, and the next implementation slice."
background_image_credit: "Generated image by Ryan Spice / Codex"
background_image_position: "center center"
summary: "A local Pulse-style briefing that turns the morning fusion run and no-edit scale/collision inventory into a concrete P0 intake queue."
seo_description: "A local Pulse-style briefing that turns the morning fusion run and no-edit scale/collision inventory into a concrete P0 intake queue."
---

# PixelBoats Morning Watch: P0 NPC, pirate, and shipwreck lifecycle guardrail

![A stylized pixel-art inspired boat crossing a gridded teal sea while amber lead lines connect signals, delegates, and the next implementation slice.](/img/articles/pixelboats-morning-watch-2026-07-03/pixelboats-morning-watch.svg)

A local Pulse-style briefing that turns the morning fusion run and no-edit scale/collision inventory into a concrete P0 intake queue.

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

P0 NPC, pirate, and shipwreck lifecycle guardrail is still a missing P0 row, with the current surface mapped to legacy/v0.4.34-runtime/server/dev-server.mjs. The current move is not a feature push; it is a contract-first stabilization lane for boat scale, collision, pickup, wake, and debug truth.

- Matrix gaps: 111
- Open gates: 36
- Delegate lanes: 6
- P0 intake items: 8

## The Intake Queue

PB-P0-01 is the first pickup: Add the smallest shared boat runtime profile contract before changing behavior. Its value is that it lets later render, pickup, debug, and collision work share one named contract instead of guessing from sprite size.

- PB-P0-01: Boat runtime profile contract for visual, collision, pickup, wake, and debug scale (P0, open)
- PB-P0-02: Boat footprint resolver for broadphase, narrowphase, pickup, wake, and debug shapes (P0, open)
- PB-P0-03: Propagate boat runtime profile through SimBoat and ShipState without behavior changes (P0, open)
- PB-P0-04: Replace hardcoded pickup radius with boat profile pickup radius (P0, open)
- PB-P0-05: Debug overlay parity for actual broadphase, narrowphase, and pickup footprints (P0, open)

## What The Crew Said

The useful part of orchestration is not pretending the models vote. It is making the disagreement readable enough that the lead can choose the next slice without reopening the whole ocean.

- code-spark: completed. Current evidence points to a single active stabilization workstream: close the three P0 gameplay/runtime gaps (entity lifecycles, sea-loop start/death + HUD state, and rock/item parity), while deferring renderer overbuilds until Phased sea-loop feel and Phaser-bridge gates clear.
- gemmable-queue: completed. Close the sea-loop feel gate before adding more rendering or systems.
- nemotron-ultra: completed. Risk score 7/10 — the pulse plan is directionally grounded but must add hard stoplines before Phaser/rendering/system expansion to avoid authority forks and P0 regression churn.

## The Captain's Call

docs/inbox/PB-P0-01-boat-runtime-profile-contract.md

- Do PB-P0-01 before changing pickup or collision behavior.
- Keep A/C as authority and let render/gameplay consume explicit profile fields.
- Use browser/manual QA before claiming visual scale or collision parity.

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

- Morning watch over the collision waterline: /img/articles/pixelboats-morning-watch-2026-07-03/pixelboats-morning-watch.svg
- Raster concept for the morning watch: /img/articles/pixelboats-morning-watch-2026-07-03/pixelboats-morning-watch-raster.png

Generated at 2026-07-03T13:03:04.820Z.
