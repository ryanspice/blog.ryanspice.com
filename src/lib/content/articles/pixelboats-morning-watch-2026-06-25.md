---
title: "PixelBoats Morning Watch: P0 scale, collision, pickup, wake, and debug display decoupling"
seo_title: "PixelBoats Morning Watch: P0 scale, collision, pickup, wake, and debug display decoupling | PixelBoats Daily Dev Log"
slug: "pixelboats-morning-watch-2026-06-25"
status: "published"
draft_type: "daily-dev-log"
date: "2026-06-25"
updated_date: "2026-07-02"
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
image: "/img/articles/pixelboats-morning-watch-2026-06-25/pixelboats-morning-watch.svg"
image_alt: "A stylized pixel-art inspired boat crossing a gridded teal sea while amber lead lines connect signals, delegates, and the next implementation slice."
image_credit: "Generated image by Ryan Spice / Codex"
image_position: "center center"
row_image: "/img/articles/pixelboats-morning-watch-2026-06-25/pixelboats-morning-watch-raster.png"
row_image_alt: "A generated PixelBoats concept image with a small ship crossing a dark teal gridded ocean under amber orchestration lines."
row_image_credit: "Generated image by Ryan Spice / Codex"
row_image_position: "center center"
background_image: "/img/articles/pixelboats-morning-watch-2026-06-25/pixelboats-morning-watch.svg"
background_image_alt: "A stylized pixel-art inspired boat crossing a gridded teal sea while amber lead lines connect signals, delegates, and the next implementation slice."
background_image_credit: "Generated image by Ryan Spice / Codex"
background_image_position: "center center"
summary: "A local Pulse-style captain's log for the P0 boat footprint work, with the June 26 and July 2 follow-up pulses folded in as update notes instead of duplicate articles."
seo_description: "A local Pulse-style captain's log for the P0 boat footprint work, with June 26 and July 2 follow-up pulses folded into the original June 25 article."
---

# PixelBoats Morning Watch: P0 scale, collision, pickup, wake, and debug display decoupling

![A stylized pixel-art inspired boat crossing a gridded teal sea while amber lead lines connect signals, delegates, and the next implementation slice.](/img/articles/pixelboats-morning-watch-2026-06-25/pixelboats-morning-watch.svg)

A local Pulse-style captain's log that turns the morning fusion run into one readable implementation decision, one source policy, one image, and one code-shaped next move.

Update note: this is the canonical public article for the P0 scale, collision, pickup, wake, and debug-display decoupling watch. The later June 26 and July 2 pulses covered the same article topic, so their useful deltas are folded below and their dated routes redirect here.

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

## Update Trail

### June 26, 2026

The June 26 pulse did not need a second public article. It tightened the same scale/collision watch with fresher project-state evidence:

- Active spine: `/lab/world-atmosphere-composition-spike`.
- S4 was treated as verified around a single projection.
- S5, the D/S waterline, wake, and displacement first pass, had landed and still needed visual sign-off.
- S6/S7, interaction, camera, and demo-loop checks, were still pending.
- The same P0 gaps remained in view: lifecycle guardrails, scale/collision decoupling, rock/density parity, start/death to HUD readiness, and Phaser crossover caution.

The practical reading stayed the same: do not turn render scale into gameplay truth. Treat the pulse as intake evidence, then land one source-backed contract slice.

### July 2, 2026

The July 2 pulse made the queue more concrete. It named PB-P0-01 as the first pickup: add a shared boat runtime profile contract before changing pickup, collision, wake, or debug behavior.

- PB-P0-01: boat runtime profile contract for visual, collision, pickup, wake, and debug scale.
- PB-P0-02: footprint resolver for broadphase, narrowphase, pickup, wake, and debug shapes.
- PB-P0-03: propagate the runtime profile through `SimBoat` and `ShipState` without behavior changes.
- PB-P0-04: replace hardcoded pickup radius with the boat profile pickup radius.
- PB-P0-05: make the debug overlay match actual broadphase, narrowphase, and pickup footprints.

That update also moved the captain's call from broad source surfaces to a specific intake document: `docs/inbox/PB-P0-01-boat-runtime-profile-contract.md`. The rule is still conservative: do PB-P0-01 first, keep A/C authoritative, and use browser/manual QA before claiming visual scale or collision parity.

## What The Crew Said

The useful part of orchestration is not pretending the models vote. It is making the disagreement readable enough that the lead can choose the next slice without reopening the whole ocean.

- code-spark: completed. Inventory points to four P0 workstreams still blocking parity risk posture in the active spine: boat/entity lifecycle, sea-object density/visibility, scale-collision decoupling, and start/death→HUD gating, with additional spike-gate rows left in “needs-audit” before any Phaser crossover can be treated as authoritative.
- gemmable-queue: completed. Build the boat lifecycle guardrail to unify NPC/pirate/shipwreck death states and fix water-collision alignment.
- nemotron-ultra: completed. The current S1–S7 spine is solid but the pulse plan (not found in repo) would need to address three critical gaps: an unresolved S4 projection fork, a subjective S5 stop condition, and six P0 feature-matrix items that don't map to any current stage.

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

- Morning watch over the collision waterline: /img/articles/pixelboats-morning-watch-2026-06-25/pixelboats-morning-watch.svg
- Raster concept for the morning watch: /img/articles/pixelboats-morning-watch-2026-06-25/pixelboats-morning-watch-raster.png

Generated at 2026-06-25T18:28:12.823Z.
