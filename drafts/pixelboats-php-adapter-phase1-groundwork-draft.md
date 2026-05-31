---
title: "PixelBoats, PHP Hosting, and Realtime Multiplayer"
status: draft
project: blog.ryanspice.com
created: 2026-05-30
source_project: pixelboats
---

# PixelBoats, PHP Hosting, and Realtime Multiplayer

PixelBoats is browser-first, but the deployment target is pragmatic: PHP/FPM + Apache for the web app, with room for a realtime sidecar or player-hosted WebRTC sessions where the actual ship simulation needs to stay responsive.

The important architectural split is simple: PHP can own the website, accounts, lobby, signaling, and persistence, while the realtime authority path owns moment-to-moment ship state and shot convergence.

The adapter source decision is now clear: use `B:\Dev\sveltekit-php` as the canonical SvelteKit PHP adapter implementation. It already supports a `php-static` mode, base path controls, `.htaccess`, router output, `__data.json` compatibility, action shims, and a verification suite. The current run gives a strong partial green: static/build/route verification passed and unit/PHP checks passed, while a few Playwright E2E cases timed out in setup and need isolated follow-up.

For PixelBoats, the next practical step is not to wire the adapter blindly. It is to document the contract, compare PixelBoats against the adapter outputs, and only then create a branch that proves the game client can be served from PHP without compromising the current WebGL multiplayer POC.

The realtime plan remains separate: PHP-hosted app first, player-hosted or sidecar realtime second, persistent economy validation in PHP/database always.
