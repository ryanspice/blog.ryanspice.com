# Remotion implementation plan for blog.ryanspice.com

Status: draft implementation note  
Created: 2026-06-04

## Decision

Use Remotion as a **build-time creative tooling lane**, not as a production runtime dependency for `blog.ryanspice.com`.

That means:

```txt
tools/remotion-graphs/
  Remotion source compositions
  render stills/video clips locally or in a future worker
  copy rendered outputs into static/img/articles/

src/lib/content/articles/
  Markdown references static PNG/SVG/WebM/MP4 assets only

production blog runtime
  SvelteKit + PHP adapter
  no live Remotion renderer
  no render endpoint
  no browser-side export path
```

This is the right default because the blog is currently a static/PHP-hosted article site. Remotion is useful for making richer article media, but it should not complicate the deployed app until there is a real product feature requiring video rendering.

## Why this is the right posture

Remotion is technically strong for React-based programmatic video, but adoption is conditional because of:

- special commercial licensing rather than simple permissive MIT-style dependency use
- operational rendering requirements around Chrome Headless Shell and FFmpeg
- security/cost risks for exposed render endpoints
- immature/experimental browser-side final rendering relative to the core Node/Lambda path
- the current blog's PHP-static production architecture

So for this site:

```txt
Yes to Remotion source files.
Yes to generated static media.
No to live render endpoints.
No to browser-side final export.
No to putting Remotion into the blog production dependency graph.
```

## Current repo implementation

Added isolated workspace:

```txt
tools/remotion-graphs/
  package.json
  README.md
  tsconfig.json
  .gitignore
  src/index.tsx
  src/Root.tsx
  src/graphData.ts
```

Current compositions:

```txt
AgentDiminishingReturns
AgentRoutingMap
```

These are intended to replace or supplement the current SVG article diagrams once rendered.

## Local render workflow

```powershell
cd "<AI_WIKI_ROOT>\07_Projects\blog.ryanspice.com\tools\remotion-graphs"
pnpm install
pnpm studio
```

Render stills:

```powershell
pnpm render:stills
```

Render videos:

```powershell
pnpm render:diminishing:video
pnpm render:routing:video
```

Copy stills into the article asset folder:

```powershell
$Root = Resolve-Path "..\.."
$Src = Resolve-Path ".\out"
$Dest = Join-Path $Root "static\img\articles\agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns"
New-Item -ItemType Directory -Path $Dest -Force | Out-Null
Copy-Item (Join-Path $Src "agent-diminishing-returns.png") (Join-Path $Dest "diminishing-returns-curve-remotion.png") -Force
Copy-Item (Join-Path $Src "agent-routing-map.png") (Join-Path $Dest "agent-routing-map-remotion.png") -Force
```

Then update Markdown image references when the rendered assets are approved.

## Proposed article implementation

New draft article:

```txt
src/lib/content/articles/can-you-use-remotion-programmatic-video-react.md
```

Draft route:

```txt
/drafts/can-you-use-remotion-programmatic-video-react/
```

Suggested public position:

- article category: technical adoption review
- tone: practical, legal/ops-aware, React/front-end oriented
- visual direction: use one Remotion-generated diagram for the architecture pipeline
- optional companion media: short animated clip showing React props becoming a rendered video

## Visual opportunities

Useful Remotion-generated assets for the article:

1. **Architecture pipeline**
   - React app / Player preview / Render job API / Queue / Worker / Chrome + FFmpeg / Output / CDN
2. **Decision matrix**
   - Remotion vs FFmpeg vs Motion Canvas
3. **Licensing warning card**
   - free/evaluation/small-team vs company license check
4. **Browser preview vs final render split**
   - Player is preview; renderer is backend/cloud export

## Security rules

Do not build a public render endpoint without:

- authentication
- rate limiting
- queue limits
- per-user quotas
- storage cleanup
- max render duration
- max input payload size
- cost guardrails
- asset allowlist or signed upload flow

Do not expose cloud credentials to browser code.

Do not treat user-uploaded media as trusted.

Do not rely on browser-side final rendering for production until a separate spike proves it for the exact use case.

## Licensing rules

Before using Remotion in a commercial product or client-facing automation feature:

1. Confirm whether the user/company qualifies for the free license.
2. Confirm whether embedding `@remotion/player` counts as licensed usage for the intended deployment.
3. Confirm whether programmatic renders count as automation for pricing.
4. Confirm whether contractors or client teams change eligibility.
5. Keep a note in the repo linking to the license decision.

For the current blog graph tooling, the safest path is local/evaluation/build-time rendering only.

## Recommendation

For `blog.ryanspice.com`, adopt Remotion incrementally:

```txt
Phase 1: graph stills and short clips for articles
Phase 2: reusable visual identity package for article diagrams
Phase 3: optional social-card/video teaser export
Phase 4: only then evaluate productized Remotion rendering for Canopy tools
```

Do not wire Remotion into the PHP-static production app.

Keep it as a source-media generator until there is a product requirement strong enough to justify licensing, infrastructure, and security hardening.
