---
title: "PixelBoats Networking Final Recommendation"
slug: "pixelboats-networking-final-recommendation"
status: "draft"
draft_type: "systems-analysis"
date: "2026-05-30"
audience:
  - "game network engineers"
  - "browser game developers"
  - "PixelBoats builders"
possible_publication_targets:
  - "AI Wiki inbox"
  - "ryanspice.com"
tags:
  - "PixelBoats"
  - "networking"
  - "multiplayer"
  - "server authority"
  - "WebSocket"
  - "WebTransport"
summary: "A server-authoritative networking recommendation for PixelBoats that rejects primary lockstep in favor of prediction, reconciliation, AOI replication, and regional servers."
---

# PixelBoats Networking Final Recommendation

## Executive summary

PixelBoats should not use deterministic lockstep as its primary networking model for the shared ocean.

The better fit is:

- regional server-authoritative simulation
- client-side prediction for the local ship
- reconciliation when authoritative state arrives
- snapshot interpolation for remote ships
- interest management and AOI-based delta replication
- zone or shard handoff for scale

Deterministic techniques still have value, but only for server replay, debugging, and maybe tiny duel modes.

## What is actually known

The safest reading of the source material is that PixelBoats is browser-first, uses a JS rendering stack, and is conceptually closer to authoritative multiplayer than to a pure peer-to-peer simulation.

What is not known is just as important:

- there is no public proof of a deterministic lockstep implementation
- there is no public code excerpt that shows a full simulation architecture
- the recommendation below is therefore a synthesis, not a claim about current public code

## Why lockstep is the wrong primary model

Classic lockstep works for RTS games because the player accepts delay and shared command timing.

PixelBoats is different. It cares about:

- ship steering feel
- aiming and evasive movement
- projectile timing
- lots of visible actors in a live world

The problems with lockstep are predictable:

- the slowest client dictates pace
- tiny simulation differences become sync failures
- debugging gets painful fast
- browser floating-point determinism is fragile

That is a bad trade for a shared naval combat game.

## Where determinism still helps

Keep determinism in narrow places:

- server-side replays
- deterministic debug recordings
- replayable combat logs
- small duel instances
- cosmetic seeding for purely visual systems

Do not make the whole ocean depend on it.

## The practical alternative

The practical baseline is the modern action-game shape:

- the server is the source of truth for ships, projectiles, AI, damage, collisions, loot, and visibility
- the client predicts only the local ship
- authoritative updates correct the client when they arrive
- remote ships are interpolated
- water, wake, foam, and spray stay cosmetic and are derived from authoritative hull state

That keeps the fun responsive without making the whole simulation depend on perfect cross-client determinism.

## Transport choice

Use binary WebSocket over TLS as the default shipping transport.

Why:

- mature and broadly deployable
- simple to operationalize
- binary-friendly
- easy to put behind standard web infrastructure

Keep WebTransport as the candidate upgrade path once compatibility and ops testing say it is worth it.

Why not make WebRTC the primary path?

- ICE, STUN, and TURN add ops complexity
- browser privacy and IP exposure concerns are real
- it is more awkward than it first looks for a server-authoritative MMO-style game

## Recommended architecture

The production shape should be:

1. gateway and session edge for auth, TLS, routing, and connection management
2. regional battle servers for simulation authority
3. AOI and replication layer for near / medium / far visibility tiers
4. replay and telemetry store for input logs and correction analysis
5. persistence layer for account and progression state

That architecture scales without trying to make every client solve the same world in perfect lockstep.

## Operating profile

A good starting profile looks like this:

- simulation authority: server only
- server tick rate: 30 Hz baseline
- hot combat rate: 45 Hz only if profiling proves it
- client input send rate: 30 Hz
- local prediction scope: controlled ship only
- remote entity replication: 15 Hz nearby, 4 to 5 Hz medium, 1 to 2 Hz far
- interpolation buffer: 100 to 150 ms
- snapshot style: binary, quantized, delta-based, with periodic keyframes
- world partitioning: regional zones plus border handoff
- anti-cheat principle: accept inputs, validate outcomes on the server

## Packet shape

Keep the packet format compact and replayable:

- IDs as varints
- local coordinates as integer centimetres or decimetres
- heading packed into `uint16`
- velocities quantized
- flags bit-packed
- periodic full keyframes to bound delta chains

JSON is fine for debug tooling. It is not the right shipping format.

## Final recommendation

PixelBoats should ship with:

- regional server authority
- local prediction and reconciliation
- AOI replication
- binary WebSocket transport first
- WebTransport as a future fast path
- deterministic replay only as a secondary tool

That is the architecture that matches browser reality, gameplay feel, and scale.
