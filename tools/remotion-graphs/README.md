# Remotion graphs for blog.ryanspice.com

This folder is an isolated Remotion workspace for article diagrams. It is intentionally separate from the SvelteKit app so Remotion/React do not become production runtime dependencies for the blog.

## Install

```powershell
cd "<AI_WIKI_ROOT>\07_Projects\blog.ryanspice.com\tools\remotion-graphs"
pnpm install
```

## Open the studio

```powershell
pnpm studio
```

## Render stills

```powershell
pnpm render:stills
```

Outputs:

```txt
tools/remotion-graphs/out/agent-diminishing-returns.png
tools/remotion-graphs/out/agent-routing-map.png
```

## Render video clips

```powershell
pnpm render:diminishing:video
pnpm render:routing:video
```

## Copy rendered stills into the blog article assets

```powershell
$Root = Resolve-Path "..\.."
$Src = Resolve-Path ".\out"
$Dest = Join-Path $Root "static\img\articles\agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns"
New-Item -ItemType Directory -Path $Dest -Force | Out-Null
Copy-Item (Join-Path $Src "agent-diminishing-returns.png") (Join-Path $Dest "diminishing-returns-curve-remotion.png") -Force
Copy-Item (Join-Path $Src "agent-routing-map.png") (Join-Path $Dest "agent-routing-map-remotion.png") -Force
```

Then update the Markdown image references if you want the PNG renders to replace the current SVGs.

## Notes

- The current blog still uses SVG assets directly because they are small, crisp, and build-safe.
- Remotion is better when the same graph needs a still, social card, short animation, or video explainers.
- Keep graph data in `src/graphData.ts` so formulas and labels stay editable.
