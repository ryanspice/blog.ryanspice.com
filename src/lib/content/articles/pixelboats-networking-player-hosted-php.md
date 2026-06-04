---
title: "PixelBoats Networking: Player-Hosted Seas, PHP Shores"
slug: "pixelboats-networking-player-hosted-php"
status: "draft"
draft_type: "systems-analysis"
date: "2026-05-30"
audience:
  - "game developers"
  - "multiplayer engineers"
  - "PixelBoats contributors"
  - "web game developers"
possible_publication_targets:
  - "AI Wiki inbox"
  - "ryanspice.com"
tags:
  - "PixelBoats"
  - "multiplayer"
  - "PHP"
  - "WebRTC"
  - "host election"
  - "networking"
related_posts:
  - "phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game"
  - "pixelboats-networking-final-recommendation"
summary: "A draft plan for player-hosted PixelBoats sessions with PHP handling accounts, signaling, and persistent validation."
---

# PixelBoats Networking: Player-Hosted Seas, PHP Shores

PixelBoats has an unusual but practical multiplayer goal: let players take on host responsibility when they join, then choose whoever is the best host for the current session.

That does not mean the whole game should blindly trust a browser tab. It means the architecture needs two truths:

1. a temporary realtime authority for the moment-to-moment naval session;
2. a persistent server/database authority for accounts, rewards, economy, and long-term progression.

The current plan is to make those two truths work together instead of pretending one can replace the other.

## The short version

The PHP server should be the harbor. The best player host can be the captain of the current skirmish.

PHP/FPM + Apache can serve the app, handle session APIs, perform signaling, record checkpoints, validate results, and persist economy data. The player host can run a temporary session simulation and stream snapshots to other players.

That gives PixelBoats a realistic early multiplayer path without throwing away the option of dedicated region servers later.

## Why this works for PixelBoats

PixelBoats is not trying to prove a perfect academic networking model. The goal is simple: players need their character, ship, and shots to meet up believably under real network conditions.

That means the important questions are practical:

- Did my steering input apply locally right away?
- Did my shot intent reach the session authority?
- Did the authority decide the hit/collision fairly enough?
- Did my client correct smoothly when it was wrong?
- Did the match result get validated before rewards were saved?

The exact tick rate can be tuned. The contract matters more than the number.

## The architecture

```text
Browser client
  -> PHP app/API/lobby/signaling
  -> best-player host or dedicated authority
  -> snapshots back to clients
  -> PHP/database validates persistent results
```

The client should not care whether snapshots come from:

- offline/local mode;
- a player-hosted WebRTC session;
- a dedicated WebSocket region server;
- a future process-launched sidecar.

It sends input commands and consumes snapshots.

## PHP's job

PHP owns:

- app delivery;
- accounts and sessions;
- lobby creation;
- WebRTC signaling later;
- host lease and heartbeat later;
- checkpoint storage;
- replay/result validation;
- database persistence.

PHP should not be forced to run the high-frequency ship simulation through ordinary request/response loops.

## The player host's job

The player host can own temporary session state:

- ship positions;
- projectiles;
- collisions;
- NPC movement;
- snapshots;
- temporary combat events.

But the player host should not permanently mint rare loot, final inventory state, or economy outcomes. Those are server/database concerns.

## Phase plan

### Phase 0: Lock the contracts

Define authority modes, input commands, snapshots, PHP adapter assumptions, and stress-test expectations.

### Phase 1: PHP adapter and stress groundwork

Verify the existing PHP adapter path against PixelBoats. Test base paths, assets, `__data.json`, actions, cookies, headers, Apache/FPM behavior, and the existing WebSocket smoke path where available.

### Phase 2+: Host election and WebRTC

Hoist the player-host election work until after the PHP adapter and stress baseline are stable. Then add PHP signaling, WebRTC DataChannels, host scoring, standby host migration, and replay validation.

## The important compromise

Player-hosted multiplayer can be fun and practical. It just cannot be treated as final economy authority.

The right design is not “trust nobody” or “trust everyone.” The right design is to trust a player host for temporary session feel, then validate anything permanent before saving it.

That keeps PixelBoats moving without painting the project into a corner.
