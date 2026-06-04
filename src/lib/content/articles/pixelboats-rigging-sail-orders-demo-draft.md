---
title: "PixelBoats Rigging Lab: From Sail Toy to Captain Orders"
slug: "pixelboats-rigging-sail-orders-demo-draft"
status: "draft"
draft_type: "gameplay-simulation-devlog"
date: "2026-06-04"
audience:
  - "PixelBoats builders"
  - "gameplay engineers"
  - "technical designers"
  - "AI-assisted prototypers"
tags:
  - "PixelBoats"
  - "sailing simulation"
  - "rigging"
  - "game physics"
  - "Windows Phone design"
  - "SvelteKit"
  - "AI-assisted development"
summary: "A draft writeup on turning a one-page sail visualizer into a captain-order rigging prototype with weather, destination, square-rig constraints, turn inertia, canvas handling, and render-layer lessons."
related_posts:
  - "pixelboats-water-pipeline-pixi-webgl"
  - "phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game"
references:
  - "Point of sail — https://en.wikipedia.org/wiki/Point_of_sail"
  - "Tacking — https://en.wikipedia.org/wiki/Tacking_(sailing)"
  - "Square rig — https://en.wikipedia.org/wiki/Square_rig"
  - "Reefing — https://en.wikipedia.org/wiki/Reefing"
  - "PixiJS RenderLayer docs — https://pixijs.download/release/docs/scene.RenderLayer.html"
link_terms:
  - "research library|/library/"
  - "PixelBoats Water Pipeline in Pixi and WebGL|/pixelboats-water-pipeline-pixi-webgl/"
  - "demo artifact|/demos/pixelboats-rigging-lab-v7.html"
---

# PixelBoats Rigging Lab: From Sail Toy to Captain Orders

This started as a very small prompt: draw a single mast, three horizontal spars, and a rectangle that follows the spars so the sail direction is easier to understand. That was useful for orientation, but it was not yet a game mechanic. It was a diagram pretending to be a simulator.

The better version came from changing the question. Instead of asking, “where should the sail point?”, the demo asks, “what would a captain order, given the wind, the weather, the rig, and the destination?”

That sounds like a small wording change. It is not. It changes the whole prototype.

## The important design correction

The first useful correction was separating the desired destination from the ship heading.

A player can click northeast. That does not mean the ship can immediately point northeast. A square-rigged ship, a schooner, a cutter, and a heavy ship-rig all have different abilities to work near the wind. In the current prototype, the captain chooses a helm order from the destination and wind source. If the requested destination is inside the practical no-go cone, the demo does not lie. It orders a workable tack or tells the player that the ship is effectively in irons.

That rule matters more than the visual sail shape. It is the line between a toy and a game system.

## What the prototype currently models

The latest local HTML demo is still intentionally lightweight, but it now includes these pieces:

- wind source and wind flow around 360 degrees;
- separate destination and captain-ordered helm;
- slow hull rotation with angular velocity instead of instant turning;
- square-rig bracing logic;
- point-of-sail classification;
- canvas orders: set, partial, reefed, down;
- rig presets: cutter, brig, brigantine, schooner, and ship-rig;
- sail opacity for debugging;
- sun-angle shading for sail faces;
- rope, shroud, stay, mast, and sail draw-layer experiments;
- a Metro / Windows Phone style control surface that keeps the prototype readable.

The current demo artifact is intended to be a prototype surface, not final production code. The eventual game should move the core logic out of a single HTML file and into data-driven rig definitions, shared ship-state systems, and Pixi render layers.

## Why the UI got simpler

The first versions exposed too many knobs. That made the demo technically flexible but mentally annoying. The better control model is closer to what a player or captain would think about:

1. What is the weather doing?
2. How strong is the wind?
3. Where am I trying to go?
4. What rig am I sailing?

Everything else should be inferred: yard brace, canvas, reefing, helm order, and risk.

That is why the prototype moved toward a Windows Phone / Metro style interface. The flat tiles, strong accent color, and sparse labels make it easier to treat the demo as an instrument panel instead of a debug console with delusions of grandeur.

## The rig presets changed the prototype

The rig preset is not just a visual switch. It changes the simulation assumptions:

| Rig | Behavior goal |
| --- | --- |
| Cutter | One mast, fore-and-aft biased, better near wind. |
| Brig | Two square-rigged masts, strong teaching example for braces and yards. |
| Brigantine | Square foremast plus fore-and-aft main. |
| Schooner | Mostly fore-and-aft, more flexible and less square-rig dependent. |
| Ship-rig | Three-masted heavy square-rigger, powerful downwind and slower to handle. |

This is where the prototype starts connecting to PixelBoats as a game instead of a sailing textbook. Different hulls and rigs should have different tactical personalities. A small cutter should not feel like a ship-rig with fewer sprites. A heavy three-mast ship should have authority, sail area, and weight, but it should not spin around like a toy boat in a bathtub.

## The rendering lesson: rigging is a layer problem

The sail rendering pass exposed a predictable problem: ropes, masts, yards, and sails cannot all live in one flat layer.

The demo now uses separate conceptual layers:

- water and background;
- boat hull;
- mast-back geometry;
- back rigging such as stays and shrouds;
- sail canvas;
- active yards and visible rope details;
- mast-front highlights and caps;
- vectors, labels, and HUD.

That maps cleanly to the eventual Pixi implementation. The water pipeline already argues for world/HUD/render separation; the rigging prototype reinforces the same point for ships. If the final game uses Pixi, this should become a render-layer design decision rather than a pile of z-index hacks.

## What should become real code later

The current prototype has several pieces worth promoting:

- a `RigDefinition` data model;
- a `CaptainOrder` system that converts weather and destination into helm, brace, and canvas orders;
- a `SailPlan` model with set/partial/reefed/down states;
- per-rig no-go angle and turn-rate modifiers;
- a render-layer contract for hull, mast-back, canvas, active rigging, mast-front, and HUD.

The parts that should not be promoted directly are the DOM/SVG details, the one-file state layout, and any exact numbers that were chosen mainly because they looked right in the browser. Those are prototype values, not final balance.

## Research notes

This pass used a mixed research shelf: sailing vocabulary and rigging references for the rules, plus rendering sources from the PixelBoats water work for how to think about layers, meshes, and world-space presentation. The blog now has a research library page so those references can be reused instead of rediscovered every time a post needs them.

See the research library for the current source shelf.

## Next pass

The next useful pass is not “make the demo prettier.” It is to extract the model:

```ts
type RigDefinition = {
  id: string;
  label: string;
  noGoDegrees: number;
  turnRateMultiplier: number;
  masts: MastDefinition[];
};

type CaptainOrder = {
  desiredBearing: number;
  orderedHeading: number;
  pointOfSail: string;
  braceAngle: number;
  sailPlan: SailPlan;
  riskTags: string[];
};
```

Once the model exists, the same rules can drive a Svelte/Pixi lab, an in-game captain book, or AI-authored rig presets. The HTML demo did its job if it makes the next implementation smaller, not bigger.
