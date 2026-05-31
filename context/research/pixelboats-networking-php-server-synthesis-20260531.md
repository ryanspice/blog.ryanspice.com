# PixelBoats Networking & PHP Server Architecture — Synthesis

**Date:** 2026-05-31  
**Scope:** Merges three sources: definitive GDD v1.0, PHP 2D PvP server deep research (1 GB VM / 20 Hz / migratable hosts), and current PixelBoats networking docs + sveltekit-php-adapter production-readiness plan.

---

## 1. The Two Layers That Must Stay Separate

The most important finding is that PixelBoats needs **two distinct PHP-adjacent systems**, not one:

| Layer | What it does | Technology | GDD reference | Status |
|---|---|---|---|---|
| **Web app shell** | Serves the game client, API endpoints, lobby, auth, persistence, WebRTC signaling | `@ryanspice/sveltekit-adapter-php` (php-static or node-ssr) | §23.6 project structure, §23.7 toolchain | Production-hardening (Phase 1-2 roadmap) |
| **Game simulation server** | 30 Hz authoritative tick loop, ship physics, combat, collision, NPC AI, snapshot broadcast | OpenSwoole or ReactPHP (or non-PHP later) | §23.2 networking, §23.3 collision, §9 combat | Deferred to Phase 6 |

**These cannot be the same process.** The PHP adapter serves HTTP/WSS on a request-response or proxy model. The game server runs a continuous 30 Hz tick loop. Apache/PHP-FPM cannot host the tick loop. The PHP adapter research (from ChatGPT history) already concluded this: *"The realtime loop (30 Hz) must never run inside PHP-FPM."*

What the PHP deep research adds is a concrete runtime recommendation for *when* the game server layer does get built in PHP.

---

## 2. PHP Game Server — What the Deep Research Recommends

The research targets a 1 GB VM at 20 Hz with migratable hosts. PixelBoats targets 30 Hz, but the architecture scales proportionally.

### 2.1 Runtime Choice

| Option | Fit for PixelBoats | Why |
|---|---|---|
| **OpenSwoole** | **Best fit** | Built-in WebSocket server, reactor/worker/task-worker process model, event-loop-lag metrics, process pools, TCP/UDP/WebSocket. Matches match-sharding architecture. |
| **ReactPHP + ext-uv** | Strong second choice | Pure userland; works without native extensions (but slower without ext-uv/ext-ev). Good if OpenSwoole is too invasive. |
| **Ratchet** | Component only | WebSocket protocol handler only, not a game runtime. Use its `rfc6455` component if needed, not the full server. |
| **Colyseus** | Planned per GDD | Already the planned dedicated-region prototype (§23.2). TypeScript SDK, room-based state sync. If the game server stays in TypeScript, Colyseus is the obvious choice. |

### 2.2 Architecture Recommendation vs. GDD §23.2

| Research says | GDD §23.2 says | Synthesis |
|---|---|---|
| Authoritative single-owner room simulation | Contract-first: InputCommand → Authority → Snapshot | Aligned — both say server owns truth |
| Multi-process isolation per match | AOI + zone sharding (future) | Compatible — OpenSwoole workers map to match shards |
| 50 ms / 20 Hz tick | 30 Hz / 33 ms tick | PixelBoats is tighter but achievable — the research's 50 ms budget is conservative |
| Binary deltas over WebSocket | Binary WebSocket → WebRTC upgrade | Aligned — both recommend binary framing for hot-path traffic |
| Explicit redirect/resume migration | Not yet specified in GDD | **New recommendation** — the migration protocol design (§5 of the research) fills a gap in GDD §23.2 |
| `pack()`/`unpack()` binary codec | Not yet specified in GDD | **New recommendation** — compact integer/fixed-point state matches the GDD's entity model (§23.4) |

### 2.3 New Findings for PixelBoats

These concepts from the research are not in the current GDD or networking docs but are directly applicable:

**Migration protocol (§5 of the research):** The sequence of `mig.prepare → freeze → state_chunk → replay_tail → commit → redirect → resume` is a concrete protocol for host migration that fills a gap in the current networking architecture. The GDD says "authority is swappable" but doesn't specify *how* migration works at the protocol level.

**Binary codec design (§4 research):** The `pack()`-based entity delta encoding (id:u16, x:i16, y:i16, vx:i16, vy:i16, hp:u8, flags:u8) is directly applicable to the snapshot contract in §23.2.

**Bandwidth estimates (§7 research):** ~1.16 KB/s upstream per client (20 Hz), ~3.6-11.3 KB/s downstream depending on match size. These validate the GDD's bandwidth planning.

**Sodium AEAD for control messages (§5 research):** `sodium_crypto_aead_xchacha20poly1305_ietf_encrypt` — concrete encryption recommendation for reconnect tokens and migration commands.

---

## 3. Revised Architecture Diagram

```
Browser client (SvelteKit + PixiJS 8)
    │
    ├── HTTPS/WSS → PHP Adapter (Apache/PHP-FPM)
    │       ├── App shell (php-static or node-ssr)
    │       ├── API endpoints (PHP)
    │       ├── Auth/session (PHP)
    │       ├── Lobby/matchmaking (PHP)
    │       ├── Signaling mailbox (PHP)
    │       └── Persistence/database (PHP)
    │
    └── WSS → Game Server (OpenSwoole or Colyseus)
            ├── 30 Hz authoritative tick loop
            ├── Ship simulation + physics
            ├── Projectile + collision
            ├── NPC AI
            ├── Snapshot generation
            ├── Input validation
            └── Migration coordinator

Control plane (external):
    ├── Redis: room registry, reconnect tokens, match directory
    ├── SQLite (WAL): local control-plane state
    └── Metrics: Prometheus → Grafana (via OpenSwoole stats API)
```

**Key boundary:** The PHP adapter never touches the game loop. It serves the app and provides supporting services. The game server runs as a separate daemon (OpenSwoole or Colyseus), communicating with the PHP layer only through:
- The control plane (Redis room registry, auth tokens)
- The signaling mailbox (PHP receives/serves WebRTC offers, game server receives forward)
- Persistence writes (game server writes match results, PHP reads)

---

## 4. What This Changes for the PHP Adapter Roadmap

The PHP adapter production-readiness plan (Phase 1-5) remains valid. The deep research adds:

| Section | Addition | Priority |
|---|---|---|
| Phase 3 (Deployment) | Add **OpenSwoole sidecar** as a node-ssr alternative: PHP adapter serves app, OpenSwoole handles game WSS on a different port | 🟡 Medium — before Phase 6 |
| Phase 4 (Performance) | Add **binary WebSocket throughput benchmarks** specific to the game-snapshot codec | 🔵 Low |
| §2.5 (Performance gaps) | Add **OpenSwoole event-loop-lag** as a key metric alongside PHP-FPM tuning | 🟡 Medium |
| §5.3 (Fallback strategy) | The **Colyseus vs. OpenSwoole vs. ReactPHP** decision belongs in Phase 6, not now | Not urgent |

---

## 5. How the Definitive GDD Needs Updating

| GDD section | Current text | Should add |
|---|---|---|
| §23.2 Networking | Mentions Colyseus as planned | Add: "PHP game server via OpenSwoole is an alternative path if PHP-sidecoherence is preferred, but TypeScript/Colyseus remains the default." |
| §23.2 Tick rate table | `Transport: Binary WebSocket → WebRTC DataChannel upgrade` | Add row: `Game server runtime: Colyseus (default), OpenSwoole (PHP alternative)` |
| §23.2 Data flow | Has input → server → snapshot flow | Add: "Migration protocol: explicit freeze/transfer/resume (see migration protocol doc)" |
| §23.4 Entity model | Has EntityKind type | Add: "Snapshot encoding: binary `pack()`/`unpack()` format defined per entity type for hot-path network deltas" |
| §24 Performance | Has server frame time target | Add: "OpenSwoole metrics: event-loop lag, worker RSS, input queue depth" |
| Phase 6 roadmap | "Networking & online hardening" | Add sub-item: "Research Colyseus vs. OpenSwoole for game server runtime based on prototype complexity and PHP-team fit" |

---

## 6. Summary: What Stays, What Changes

### Stays the same
- The PHP adapter (`@ryanspice/sveltekit-adapter-php`) continues on its production-readiness path for serving the web app
- Contract-first networking (InputCommand → Authority → Snapshot)
- 30 Hz tick, 15-20 Hz snapshots, 100-150 ms interpolation buffer
- Client prediction + reconciliation
- Authority swappable between offline-local, player-hosted, dedicated-region
- Binary WebSocket transport with eventual WebRTC upgrade

### Changes or gets clarified
- **The game server runtime is now a two-option decision** (Colyseus/TypeScript vs. OpenSwoole/PHP) to be resolved in Phase 6 by prototype complexity
- **The migration protocol is defined** — freeze/transfer/resume with signed tokens and AEAD encryption. This fills a specification gap in the current architecture
- **The binary codec is specified** — `pack()`-based integer/fixed-point deltas for the hot path. This replaces generic "binary" language with a concrete approach
- **The PHP adapter and game server are explicitly separated** — the first serves the app, the second runs the sim. They communicate through the control plane (Redis) and signaling channel, never through shared process state
