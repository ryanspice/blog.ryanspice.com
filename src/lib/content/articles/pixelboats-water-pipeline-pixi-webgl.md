---
title: "PixelBoats Water Pipeline in Pixi and WebGL"
slug: "pixelboats-water-pipeline-pixi-webgl"
status: "draft"
draft_type: "rendering-architecture"
date: "2026-05-30"
audience:
  - "game engineers"
  - "rendering engineers"
  - "PixelBoats builders"
possible_publication_targets:
  - "AI Wiki inbox"
  - "ryanspice.com"
tags:
  - "PixiJS"
  - "WebGL"
  - "water rendering"
  - "shaders"
  - "PixelBoats"
  - "game dev"
summary: "A practical Pixi/WebGL water pipeline plan mapped from the attached asset sheet and stage breakdown."
---

# PixelBoats Water Pipeline in Pixi and WebGL

Executive summary
This report treats the two attached images as the full visual and technical spec: the asset-sheet image defines the texture vocabulary, and the nine-stage poster defines the runtime assembly order. The cleanest implementation in Pixi is not “many clever sprites,” but a small, explicit render pipeline built from Mesh/Geometry/Shader, a handful of reusable RenderTexture targets, a few world-anchored tiling textures, and one final composite filter. That sits directly on top of Pixi’s current low-level rendering surface—custom meshes, custom shaders, custom filters, render groups/layers, tiling sprites, and particle containers are all first-class pieces of the library—and maps well to WebGL2 capabilities such as instanced drawing and multiple render targets when you choose to go lower-level later. 

The most important technical decision is to keep all water logic in world space, not screen space. The images imply a top-down readable ocean where shore foam hugs rocks, wakes follow boats, and current lines stay locked to the map. In Pixi, that means deriving UVs from world coordinates or from data already authored in world-space texture domains, because the scene graph is hierarchical and every object already carries cumulative world transforms. Use screen UVs only in the very last post/composite filter. If the final game uses pixel-art presentation, do the pixel look as a final quantizing/upscale step, not by letting the water’s internal simulation drift in screen space. Pixi’s scene graph and world transforms support this directly, and the pixel-art literature around “texel-grid” rendering reinforces the same point: stabilise the world first, stylise the final image second. 

For the actual water look, the attached poster’s stage breakdown is consistent with established real-time water practice: broad low-frequency motion for body, dynamic normal detail for life, a flow map for directional movement, depth-derived shallow tinting and shore foam, additive interaction masks for ripples and wakes, then weather and final grade. Valve’s flow-map work is still the most relevant reference for stage four and the ripple-detail stages because it solves exactly the two big problems you will hit—repetition and pulsing—by blending two phases and introducing phase offset/noise. GPU Gems remains the best grounding for low-frequency wave selection and for separating “geometric/body motion” from “fine normal-map motion.” Crest and toon-water references are useful for shallow-depth attenuation and shoreline foam logic. 

The recommended build is therefore:

Decision area	Recommended choice	Why
Water surface primitive	Custom Pixi Mesh over visible water chunks	Full world-space control, shader-friendly, portable across Pixi 7/8
Repeating detail layers	TilingSprite only for simple overlays, otherwise sample in shader	Good for cheap layers, but shader sampling is better for coherent world anchoring
Interaction storage	Separate low-res ripple RT and wake RT	Easy debugging, cheap additive accumulation
Flow representation	Authored or procedurally generated RG flow map, optional A-channel phase noise	Matches Valve-style flow and your image spec
Particle layer	Pixi ParticleContainer for foam/spray/bubbles	Keeps dependencies light and scales well
Optional WebGL2 upgrades	Instanced quads, MRT, float RTs	Useful later, not required for the first correct version

The implementation order should be equally strict: build the static base first, verify world anchoring, add micro motion, add currents, add shoreline logic, then interactions, then wakes/particles, then weather, then final grade. If you do this in the opposite order, you will get a flashy but unstable result that will never fully match the image spec. 

Recommended rendering architecture
The safest Pixi architecture is a dedicated world render group for the game world and a separate HUD/UI render group or render layer for overlays. Water belongs entirely to the world group. The final UI goes in a later layer so the minimap, HUD icons, and labels remain crisp and unaffected by the water composite chain. Pixi’s render groups exist exactly to separate scene parts like world and HUD, and render layers let you decouple logical parenting from draw order when something must appear late without moving in the scene hierarchy. 

For the water itself, prefer one of these three implementations:

Surface implementation	Recommended use	Strengths	Weaknesses
Chunked mesh grid	Default	Best control over world UVs, normals, dot-matrix deformation, and pass integration	Slightly more setup than a sprite solution
Instanced quads	If the “dot matrix” becomes a visible surface language	Excellent control over cell-based surface shading and per-cell offsets	More custom GL work; heavier than a mesh for early milestones
TilingSprite layers	Only for simple, rectangular, purely decorative repeated overlays	Very fast for repeated patterns and independent offset/rotation	Less suitable once the pass needs object masks, flow steering, or custom world-height logic

Pixi’s Mesh and Geometry systems were designed for exactly this type of low-level control, and the Geometry API exposes attributes, indices, topology, and instanceCount, which makes both the mesh-grid path and an instanced-quad variant technically viable. WebGL2’s instanced drawing API is stable and widely available, so a later optimisation pass can move to instanced quads without changing the higher-level water data model. 

The dot-matrix look should be thought of as a presentation mode for the water surface, not a separate simulation. My recommendation is:

Use a chunked mesh as the simulation/shading surface.
Quantise highlight/foam thresholds to a cell grid in shader.
If you still want visible “water dots,” layer an instanced-quad or snapped-cell highlight mesh on top of the same world-space fields, rather than replacing the whole water renderer on day one.
That recommendation follows from the capabilities of Pixi’s mesh pipeline and keeps pass logic simple. It also aligns with pixel-art rendering practice: keep internal motion continuous, then stabilise or quantise the output to reduce shimmer and improve readability. 

A practical pass graph looks like this:

World mask and seabed depth

Base depth colour

Large swell phase

Micro ripple normals

Flow map distortion and steering

Shore foam mask

Interaction ripple RT

Wake mask RT

Particles and spray

Fog rain weather

Final colour grade and specular boost

UI overlay in separate layer



Show code
The runtime objects behind that graph should stay small and reusable: one static or infrequently updated seabed/depth texture, one base water mesh, one ripple accumulation RT, one wake accumulation RT, one optional weather RT, and one final full-screen composite filter. Reuse those render textures every frame; Pixi explicitly advises against creating and destroying render textures continuously, and also advises against auto-generating mipmaps for render textures that update per frame. 

When you do need a full-screen pass, use a custom Pixi filter on the world group or on a dedicated water-composite container. Pixi v8’s filter pipeline is explicitly serial and order-dependent, which is useful here because the last stage is a final grade rather than another geometry draw. Do not rely on exotic sprite blend modes for core correctness: classic WebGL Pixi blending is dependable for normal, add, multiply, and screen, while more advanced blend modes in v8 are filter extensions, not a reason to redesign the main pass order. 

Assets and data layout
The attached asset-pack image already points toward the right sizing discipline: colour-bearing tiles at 512×512, directional/mask assets at 256×256, and small ramps or utility maps for tinting and masks. Keep that logic. It is artist-friendly, memory-cheap, and easy to atlas. WebGL2 supports compact single- and dual-channel formats such as R8 and RG8, and their byte cost is materially lower than RGBA8; Pixi’s texture system can represent different texture formats, while the default path remains rgba8unorm. For dynamic data such as interaction masks, control textures, and event fields, this is enough to justify channel-packing aggressively. 

Use this packing strategy:

Asset class	Suggested storage	Filtering	Colour space	Notes
Deep / mid / shallow water colour	RGBA8 PNG atlas	Linear inside shader, nearest on final upscale	sRGB	Keep three separate tiles or one strip atlas
Depth tint ramp	RGBA8 tiny ramp	Linear	sRGB	1D or narrow 2D ramp
Micro ripple normal or derivative-height	RGBA8 or packed channels	Linear	Linear, not sRGB	Store XY derivatives or normal XY plus height
Flow map / current field	RG8 or RGBA8 authored PNG	Linear	Linear, not sRGB	RG = direction, A = phase noise if packed
Shore mask / foam mask / wake mask / ripple mask	R8 or packed RGBA atlas	Linear or nearest depending on use	Linear	RT-friendly and cheap
Fog / cloud / rain / caustic breakup	R8/RG8/RGBA8	Linear	Usually linear	Purely data if used as masks, sRGB if painted colour
Dynamic RTs	R8, RG8, RGBA8, optional R16F/RG16F	No mipmaps	Linear	Prefer UNORM first, float only if genuinely needed

Two important implementation rules follow from the sources. First, where you need stable repeating UVs across Pixi/WebGL targets, prefer power-of-two textures; Pixi’s wrap-mode docs and MDN’s texture guidance both make it clear that repeat/wrap safety is tied to power-of-two assumptions in WebGL-centric usage. Second, treat vector maps, depth masks, derivative maps, and normals as linear data, not colour textures; the flow-map tutorials explicitly call out non-sRGB import for these assets. 

For world-space tiling, define one shared convention and never violate it:

glsl
Copy
vec2 worldUV(vec2 worldPos, vec2 worldOrigin, float texelsPerWorldUnit) {
    return (worldPos - worldOrigin) * texelsPerWorldUnit;
}
Every repeated water asset should be sampled from worldUV(...), not from sprite-local UVs. The only exceptions are absolute map textures such as a hand-authored depth layout or a one-off baked seabed cache. Because Pixi’s scene graph exposes cumulative transforms through worldTransform, you can either pass world positions as geometry attributes directly or derive them from chunk-local coordinates and a chunk origin uniform. 

For missing assets, procedural generation is enough to get the pipeline live before final art is painted:

Missing asset	Procedural recipe	Primary sources
Flow map	Curl field from noise derivatives; optionally bias around shore gradients	Catlike surface flow; Valve flow maps
Foam tile	Thresholded Worley plus fractal noise; erode and blur for lacy cells	Worley 1996
Micro ripple normal	Generate anisotropic height pattern, then derive XY slopes and renormalise	Catlike derivative-height approach
Fog/cloud noise	Layered Perlin/improved noise and Worley	Perlin, Worley
Shore slope mask	Gradient of seabed height or distance-to-shore field	Crest depth cache logic
Wake streak	Long anisotropic noise with directional breakup and alpha taper	Valve flowing debris logic

Perlin’s original coherent-noise work and Worley’s cellular basis function are still the best low-dependency basis functions for this kind of material generation. For flow specifically, curl derived from noise gradients is attractive because it produces divergence-free swirls well suited to eddies and current break-up. 

A minimal offline generator sketch for a foam tile looks like this:

ts
Copy
// Pseudocode
for each texel uv:
  worley = F2(uv * 8.0) - F1(uv * 8.0);   // cellular lace
  perlin = fbm(uv * 4.0, octaves=4);
  foam = smoothstep(0.18, 0.42, worley * 0.8 + perlin * 0.2);
  alpha = clamp(foam * 1.2, 0, 1);
  rgb = vec3(alpha); // white foam mask
Then convert height-like detail to a normal/derivative texture with finite differences or a Sobel filter. Catlike’s derivative-height packing is especially relevant here because it keeps one texture multipurpose: derivative X, derivative Y, and a height-like term can live together and be unpacked cheaply in shader. 

Stages from base depth to micro detail
Base depth colour map
Purpose. This stage establishes the main water identity: shallow water lighter and clearer, deep water darker and denser, with enough spatial variation that the water already reads before any foam or wake work is added. The industry analogue is a seabed/depth cache rendered from a top-down view and differenced against water level; Crest uses exactly that to drive shallow-water attenuation, foam generation, and shallow shading. Toon-water references use the same underlying principle for depth-based colour variation. 

Inputs. Use either an artist-painted depth map or a baked top-down seabed-height map. In Pixi, this can be an absolute world texture for the map zone, or a chunked cache if the world is large. Pair that with a small depth tint ramp and the three repeated colour tiles implied by the asset-pack image: deep, mid, shallow. Keep the depth texture in linear space and the colour tiles in sRGB-style colour assets. 

Shader approach. The correct base blend is not “pick one tile,” but “blend the repeated tiles by normalised depth, then lightly modulate by another low-frequency noise or breakup map.” In code terms:

glsl
Copy
float depth = texture(uDepthMap, uDepthUV).r;          // 0 shallow .. 1 deep
vec2 uv = worldUV(vWorldPos.xy, uWorldOrigin, uBaseTile);
vec3 cDeep = texture(uDeepTex, uv * 0.50).rgb;
vec3 cMid  = texture(uMidTex,  uv * 0.75).rgb;
vec3 cShal = texture(uShalTex, uv * 1.00).rgb;
vec3 tint  = texture(uDepthRamp, vec2(depth, 0.5)).rgb;

vec3 base = mix(cShal, cMid, smoothstep(0.15, 0.55, depth));
base = mix(base, cDeep, smoothstep(0.45, 0.95, depth));
base *= tint;
This stage does not need a normal map yet; treat depth as the “height usage” for this phase. The pass should draw with ordinary alpha/opaque semantics—what the poster labels as the “water base pass” with normal composition, not additive foam. 

UV handling and world anchoring. Depth-map sampling is absolute-map UV. Repeated colour tiles use world UV. That split is essential: the tint regions must stay aligned to actual shoals and channels, while the small repeated surface texture can tile continuously across the surface. Because Pixi positions are local by default and the final draw position is relative to parent transforms, always derive the tile UV from world position or from chunk origin plus local vertex coordinates. 

Tileability, LOD, and performance. This is one of the cheapest stages if you keep the seabed map static and only update it when terrain or shoreline geometry changes. If the map is large, chunk it and update only visible or edited chunks. Because this pass is visually dominant, keep its textures at the higher end of your spec sizes, but the depth cache itself can be lower resolution than the final screen if the colour ramp and shore logic hide stepping. 

Debug output. Expose toggles for grayscale depth, tint-ramp only, base tile only, and depth contour bands. The most useful test here is the world-space anchoring test: pause time, pan the camera, and confirm that shallow bands stay fixed to the environment rather than the screen. 

Large swell and wave motion
Purpose. The poster’s “large swell / wave motion” stage is the body motion of the water. In a top-down pixel-readable game, this should be subtle. GPU Gems explicitly separates large geometric undulation from fine normal-map detail and notes that the fine waves dominate perceived realism while larger waves provide the broader framework. That maps perfectly here: use stage two for slow body movement and camera-readable energy, not for dramatic geometry. 

Inputs. Use two or three directional sine or Gerstner wave components, each with direction, wavelength, speed, and amplitude. If you already have a current field from stage four, use the local current direction to bias wave headings. In shallow areas, attenuate the long-body motion earlier so the water feels calmer around shoals, which is consistent with Crest’s shallow-depth guidance. 

Shader approach. For Pixi, you have two workable versions. The low-risk version keeps the geometry flat and turns this into a low-frequency UV phase field that later stages sample. The richer version adds slight vertex displacement on the mesh grid or on the optional dot-matrix layer. Use only small amplitudes. Catlike’s Gerstner formulation is enough:

glsl
Copy
struct Wave { vec2 dir; float steep; float wavelength; float speed; };

vec3 gerstner(Wave w, vec2 p, float t) {
    float k = 6.2831853 / w.wavelength;
    float a = w.steep / k;
    vec2 d = normalize(w.dir);
    float f = k * (dot(d, p) - w.speed * t);
    return vec3(d.x * a * cos(f), a * sin(f), d.y * a * cos(f));
}
For a top-down renderer, I would use the vertical component mostly as a phase driver and maybe convert the horizontal components into additional UV shift rather than visible displacement at first. That keeps the image readable while still getting the gentle “living ocean” motion the poster implies. 

Normal and height usage. This stage can output a scalar bodyPhase or a low-frequency normal perturbation. If you do vertex displacement, recompute or approximate the macro normal; if you keep the surface flat, simply pass the phase to stage three and let the micro-normal stage carry the apparent shading. Catlike’s wave notes about tangents, binormals, and loop prevention are useful if you do decide to displace vertices. 

Tileability, LOD, and performance. Limit this stage to a tiny wave count. Two waves are enough for the first pass. GPU Gems makes the larger point that the low-frequency body motion should be cheaper and less visually dominant than the high-frequency detail. Also, attenuate or disable displacement entirely if the camera zooms out enough that the motion only causes jitter. 

Debug output. Show isolines or false-colour phase for each macro wave and the summed phase. Add a check for “shallow attenuation” so that the broad motion visibly calms around coastlines instead of hammering into them. 

Micro normal ripples
Purpose. This is the most important beauty stage after base depth. Valve’s flow-map method and the derivative-height texture approach from Catlike both point to the same answer: fine, high-frequency shading detail sells water life more than large motion does. The poster calls this “micro normal ripples,” and the asset sheet already provides the right kind of input textures. 

Inputs. Use either a normal tile or a derivative-height tile. The derivative-height packing described by Catlike is especially attractive for a stylised top-down renderer because it lets you rotate derivative directions with the flow and still reconstruct normals cleanly. The flow map should provide at least RG direction; packing phase-noise in A is a strong improvement because it staggers pulse timing. 

Shader approach. Follow the Valve pattern: distort or align the ripple texture by the local flow vector, keep distortion limited, and blend two phases offset by half a cycle. Valve’s talk explicitly identifies the two problems—repetition and pulsing—and solves them by offsetting phases and adding noise. Catlike’s flow tutorials provide a practical implementation pattern for the same idea. 

A practical Pixi/WebGL fragment helper looks like this:

glsl
Copy
vec3 unpackNormal(vec4 t) {
    vec3 n = vec3(t.xy * 2.0 - 1.0, 0.0);
    n.z = sqrt(max(1.0 - dot(n.xy, n.xy), 0.0));
    return n;
}

vec3 flowUVW(vec2 uv, vec2 flow, float t) {
    float progress = fract(t);
    float w = 1.0 - abs(1.0 - 2.0 * progress); // triangle weight
    return vec3(uv - flow * progress, w);
}

vec3 sampleRippleNormal(vec2 worldPos) {
    vec2 uv = worldUV(worldPos, uWorldOrigin, uRippleTile);
    vec4 flowTex = texture(uFlowMap, uv * uFlowScale);
    vec2 flow = flowTex.rg * 2.0 - 1.0;
    float noise = flowTex.a;

    vec3 a = flowUVW(uv + vec2(0.11, 0.37), flow, uTime * uRippleSpeed + noise + 0.0);
    vec3 b = flowUVW(uv + vec2(0.73, 0.19), flow, uTime * uRippleSpeed + noise + 0.5);

    vec3 nA = unpackNormal(texture(uMicroNormal, a.xy));
    vec3 nB = unpackNormal(texture(uMicroNormal, b.xy));

    return normalize(nA * a.z + nB * b.z);
}
If your ripple pattern is anisotropic rather than isotropic, you can go one step further and rotate the derivative vectors or UV frame to align ripples perpendicular to the flow direction, as in directional-flow methods. 

UV and flow handling. Because this stage is tiled, it must be world-anchored. The flow map can be absolute-map or tiled-current logic, but the ripple sample itself should always begin from world UV. If the water is calm and directional, use directional-flow alignment. If the water is turbulent or open-ocean, distortion of a more isotropic micro-normal is usually enough and cheaper. Catlike explicitly distinguishes those two cases. 

Blending mode, tileability, and LOD. This stage is usually best folded into the base water shader, not drawn as a visible additive pass. Sample the combined normal, then feed it into your stylised highlight/specular model. Fade its strength down with zoom distance or when the final target pixel density gets too low; otherwise tiny shimmer will dominate the read. If you do need a separate debug RT, keep it low-res and do not generate mipmaps for it. 

Debug output. Show the combined normal as RGB, the raw flow vector as encoded colour, and the phase weights A and B. If you ever see the ripple layer slide with the camera while paused, your world anchoring is wrong. 

Stages from currents to object interaction
Flow map and currents
Purpose. This stage steers the water. In the poster it is explicitly responsible for UV distortion, currents, eddies, and steering foam/debris. Valve’s presentation is still the central reference: a flow map gives each point on the surface a 2D direction vector, the map can be low resolution, and the shader uses it to distort or align the water detail. 

Inputs. Minimum input is RG direction. Better input is RGBA, where RG is direction, B is optional local speed or turbulence, and A is phase noise. If you author by hand, stay low resolution and smooth; Valve cites relatively low-resolution flow maps and uses tooling rather than direct painting because direct painting becomes impractical. If you generate procedurally, use curl fields and shoreline gradients as the starting point. 

Authored versus procedural flow generation

Method	How it works	Strengths	Weaknesses	Best fit for PixelBoats
Authored vector map	Artist paints or combs flow directions	Highest art direction control	Expensive to maintain across large maps	Story-critical waterways, harbours, shore approach lanes
Procedural curl noise	Derive divergence-free vectors from noise gradients	Cheap, organic eddies, good for oceans	Can feel arbitrary near gameplay landmarks	Broad open-water currents and turbulence
Hybrid shore-aware field	Base flow plus obstacle/shore gradients and curl breakup	Best balance of readability and believable motion	Slightly more tooling work	Likely the best overall choice

The hybrid recommendation follows directly from the spec images: the “final ocean” look is directional and navigable, but still broken up by natural motion. Valve’s artist-authored flow plus Catlike’s curl logic is the right conceptual mix. 

Shader approach. Keep the flow map in linear space and decode to [-1, 1]. Use the magnitude as local speed and, if needed, to reduce normal strength where water is moving fastest—Valve explicitly notes scaling normal strength by flow speed. In a stylised top-down renderer this is useful because it stops fast currents from becoming over-busy. 

Tileability and world anchoring. If the flow field represents the whole bay or map section, store it in absolute-map UV and sample it directly. If it represents generic ocean turbulence, tile it in world space at a much lower frequency than the micro ripples. Do not let flow UV share the exact same period as the micro-normal tile or you will see directional banding and obvious loops. 

LOD and performance. Flow maps do not need to be high resolution. The directional information benefits from smooth interpolation, not sharp detail. That is one reason this stage is cheap relative to a heavier normal stack. If you later build a raw WebGL2 path, this is also a good candidate for a small RG8 control texture or for packing into MRT outputs, but do not make MRT a dependency of the first correct version. 

Debug output. Show vector arrows or HSV-encoded direction/speed over the world. You should be able to read a boat’s future wake direction just from the debug overlay. 

Shore foam
Purpose. The poster explicitly defines this as “depth and slope.” That is also the most robust real-time interpretation of shoreline foam: a shallow-water threshold creates the foam band, and local slope/geometry helps shape where it accumulates and how wide the band appears. Crest documents the practical reality very clearly: depth-based shoreline foam does not produce a constant-distance shoreline band, because slope changes band width; that is why it also supports manual texture or geometry inputs. Toon-water references similarly use depth and normals for shoreline foam. 

Inputs. Use:

water depth from stage one,
a shore-edge or shore-slope mask,
a foam tile,
flow/current direction for drift,
optional signed-distance or distance-to-shore field if you want consistent band width instead of pure depth thresholding.
A good production compromise is depth threshold × shore-edge mask × foam tile × angle fade. Keep the edge mask authored if the level art needs explicit control. 

Shader approach. If you have a seabed heightfield, compute slope from neighbouring texels or from a pre-baked gradient map. Then use shallow depth and slope to gate foam:

glsl
Copy
float sampleShoreFoam(vec2 worldPos) {
    vec2 uvDepth = mapUV(worldPos);
    float depth = texture(uDepthMap, uvDepth).r;

    vec2 texel = uDepthTexel;
    float dL = texture(uDepthMap, uvDepth - vec2(texel.x, 0.0)).r;
    float dR = texture(uDepthMap, uvDepth + vec2(texel.x, 0.0)).r;
    float dD = texture(uDepthMap, uvDepth - vec2(0.0, texel.y)).r;
    float dU = texture(uDepthMap, uvDepth + vec2(0.0, texel.y)).r;
    vec2 grad = vec2(dR - dL, dU - dD);
    float slope = clamp(length(grad) * uSlopeScale, 0.0, 1.0);

    float shallow = 1.0 - smoothstep(uFoamDepthMin, uFoamDepthMax, depth);
    float edge = texture(uShoreMask, uvDepth).r;
    float tile = texture(uFoamTile, worldUV(worldPos, uWorldOrigin, uFoamTile) + uFoamDrift).r;

    return shallow * mix(1.0, slope, uSlopeWeight) * edge * tile;
}
Composite the visible foam with add for the bright stylised read in your poster, or screen if you want a softer photographic mix. Both are safe Pixi blend modes in the standard WebGL path. 

World anchoring and tileability. The shore band itself is absolute-map logic. The foam texture inside the band is world-tiled. That split is what keeps the band fixed to rocks while still avoiding a pasted-looking white outline. If you want animated wash-up along rocks, steer only the internal foam texture with the flow field—do not translate the shore band mask itself. 

LOD and performance. Half resolution is usually enough for the foam mask RT because the visible foam is already noisy and high-contrast. The expensive part is not arithmetic; it is overdraw if you render too much foam geometry. Prefer one shore-foam RT or one integrated shader branch over many overlapping foam sprites. 

Debug output. Show shallow threshold, slope term, edge mask, and final foam mask separately. Also expose a “constant-width mode” if you add an SDF-based shoreline later, because it makes comparing depth-threshold behaviour against distance-field behaviour much easier. 

Object interaction ripples
Purpose. This stage handles rings around rocks, impacts, and local disturbances. The poster describes ripples at objects that expand and fade over time, with normal/height combination. That does not need a fluid sim. It needs a clean event-driven mask system. 

Inputs. Each event needs only centre, start time, maximum radius, width, amplitude, and optional local flow bias. If the disturbing object is static, you can spawn periodic rings in place. If it is moving, transition to the wake system once speed crosses a threshold and keep this stage for discrete impacts and circular ripples. 

Recommended data structures

Method	Data structure	Pros	Cons	Best use
CPU sprite stamps	Ring sprites drawn into ripple RT	Extremely easy in Pixi	Harder to vary physically; overdraw grows	First implementation
GPU event texture	Ring buffer in JS, uploaded as data texture/uniform array	Flexible and scales better	More shader logic	Mainline production path
SDF / JFA field	Seed mask + jump-flood distance transform	Very good for broad expanding contours and shoreline-like ripples	More passes and complexity	Advanced upgrade, not milestone one

WebGL2 data textures and compact formats make the event-texture path very practical. Signed-distance approaches are legitimate and well-studied—jump flooding is the classic approximate GPU strategy—but they are more attractive once you need larger persistent fields than for simple impact rings. 

Shader approach. For the first correct version, maintain a fixed-size ring buffer in JS and either upload it as a uniform array or a 1D/2D data texture. In the ripple RT pass, accumulate ring energy:

glsl
Copy
float rippleRing(vec2 p, vec2 center, float radius, float width, float feather) {
    float d = length(p - center);
    return 1.0 - smoothstep(width, width + feather, abs(d - radius));
}

float rippleContribution(vec2 worldPos, Ripple r, float timeNow) {
    float age = timeNow - r.startTime;
    if (age < 0.0 || age > r.life) return 0.0;
    float radius = r.speed * age;
    float fade = 1.0 - age / r.life;
    return rippleRing(worldPos, r.center, radius, r.width, r.feather) * fade * r.strength;
}
You can store the result as a single-channel mask RT, then either convert it to a normal perturbation in the base shader or sample it directly to brighten ring highlights. The poster’s “normal/height combo” suggests doing both: one branch distorts the normal slightly, another brightens the ring. 

Normal and height usage. If you want better lighting response, convert ripple mask to a local pseudo-height by taking radial falloff and then derive a normal from neighbouring samples. If not, just use the ring mask as a secondary specular/foam booster. The latter is often enough in top-down stylised games. 

World anchoring and performance. Accumulate into a low-resolution world-space RT, not a screen-space RT. Each texel of that RT corresponds to a fixed area in the world. That is how a ring remains stationary while the camera moves. Reuse the RT; clear it or decay it every frame rather than recreating it. 

Debug output. Show event centres, event radii, and the raw ripple RT. The best validation is to pause time mid-ring, move the camera, and confirm that the ring remains glued to the object that spawned it. 

Stages from wakes to final composite
Wake mask and foam particles
Purpose. The poster separates the wake into a mask and a foam-particle layer, which is exactly right. A believable wake is not just one texture. It is a persistent directional field behind the hull plus transient particles/splash where energy peaks. Valve’s later extension of the same flow-map logic to flowing debris is conceptually useful here: the same current-steering logic can move wake detail and debris/foam textures. 

Inputs. Persist a short trail history per boat: world position, heading, signed speed, turn rate, and a timestamp. A ring buffer of trail nodes is enough. Each segment between nodes can stamp one or more oriented quads into a wake RT. Use a separate tileable wake-streak texture to add directional breakup, and spawn particles only when speed and turn thresholds say the wake is energetic enough. 

Recommended wake model. Generate a central stern wake plus two angled diverging arms. Scale width by hull size and speed. Use turn rate to bias one side brighter than the other during tight manoeuvres. That is not from a paper; it is a practical stylised inference from the visual target and from the role of the wake in a top-down readable game. The key is that the mask must be world-space persistent for a short history window, not redrawn from only the current boat position every frame. 

A practical CPU-side update loop:

ts
Copy
type WakeNode = { x: number; y: number; dirX: number; dirY: number; speed: number; t: number };

class WakeTrail {
  nodes: WakeNode[] = new Array(MAX_WAKE_NODES);
  head = 0;

  push(node: WakeNode) {
    this.nodes[this.head] = node;
    this.head = (this.head + 1) % MAX_WAKE_NODES;
  }
}
Then, each frame, render oriented wake stamps into wakeRT with additive blending and age-based fade. Sample wakeRT in the main water shader to boost foam and specular breakup behind the boat. This separates persistence from beauty and makes debugging much easier. 

Particle integration. For the Pixi path, ParticleContainer is the right default: it is explicitly designed for very large counts, lets you choose which properties are dynamic, and keeps non-essential overhead low. For wake foam, make position and rotation dynamic, but keep texture choice, vertex data, and colour mostly static where possible. Remember that Pixi’s particle API is intentionally limited compared with a full container, so use it for light billboards, not for scene-graph tricks. 

CPU versus GPU particles

Approach	Recommendation	Why
CPU-spawned Pixi particles	Default	Lightweight, controllable, dependency-free, good enough for waterspray/foam in a 2D renderer
GPU-simulated particles via RTT/data textures	Upgrade path only	Powerful, but more custom GL code than this spec requires
Pure texture-only wake, no particles	Acceptable for very low budgets	Easiest, but misses the lively breakup shown in the poster

A useful spawn rule set is:

spawn foam particles when speed exceeds wake threshold,
bias spawn to stern and diverging arms,
boost on acceleration spikes and turns,
kill quickly in calm water,
optionally advect particles by the local flow map so spray follows the current after spawning.
That hybrid of persistent wake mask plus lightweight local particles matches the attached art target closely. 

The relationships should look like this:

Boat motion and hull state

Wake trail ring buffer

Wake stamp pass to wake RT

Main water shader samples wake RT

Particle spawn rules

Foam and spray pools

ParticleContainer draw

Final water composite

Flow map



Show code
Debug output. Render wake trail nodes, wake RT intensity, particle emitters, and particle count. If wakes do not persist correctly while pausing and moving the camera, the RT is being treated as screen-space. 

Fog, rain, and weather composite
Purpose. The poster makes weather its own stage instead of stuffing it into the base shader, which is the right call. It keeps the base water stable while letting fog, rain ripples, mist, and tinting remain scalable and optional. References on transparent water and particle rendering show the same practical split: depth or scene copies are best handled in a dedicated transparent/composite step. 

Inputs. Use the fog-noise, storm-cloud, rain-streak, bubble, and spray textures from the asset vocabulary; optionally feed in a world-space weather cell or biome parameter so weather tint changes by region. For top-down play, most fog should be world-anchored and slowly scrolling. Rain streaks can be screen- or world-driven depending on camera style; rain ripples should definitely be world-driven if they touch the water surface. 

Shader approach. The simplest useful fog pass is a low-frequency world-space mask with depth-aware tint:

glsl
Copy
float fogN = texture(uFogNoise, worldUV(vWorldPos.xy, uWorldOrigin, uFogTile) + uFogScroll).r;
float fog = smoothstep(uFogMin, uFogMax, fogN) * uWeatherStrength;
vec3 fogged = mix(baseColor, uFogTint, fog);
If you want rain-distortion or rain-screen accumulation, render a weather RT and composite it with screen or gentle add, matching the poster’s fog pass. If you later add soft particles, the depth-copy logic from particle rendering literature becomes useful so mist fades nicely near world geometry instead of cutting sharply. 

Tileability and performance. Run fog and rain at half resolution unless your camera is very close. Keep weather mostly in masks and tints; avoid expensive per-pixel physically based scattering. The target style is readable painted-pixel atmosphere, not volumetric simulation. 

Debug output. Show the fog mask, rain mask, weather tint, and final weather contribution separately. Also expose a checkbox to disable all weather motion while preserving tints so you can isolate timing artefacts from colour grading artefacts. 

Final colour grade, specular boost, and UI overlay
Purpose. The poster’s last stage combines final grade, contrast, specular boost, and UI overlay. That is exactly where this belongs in Pixi too: as one or two final filters after the world water is assembled, followed by HUD in a separate render layer/group. Custom Pixi filters are the right mechanism; filter order is explicit and sequential. 

Inputs. Final input is the composed world-water colour plus auxiliary masks for specular or sparkle boost. Optional inputs include minimap frame, compass, weather state icon, and other HUD elements, but those should not pass through the water-grade filter. The water grade should operate on world colour only. 

Shader approach. Keep it stylised and measured:

slight S-curve or contrast lift,
depth-aware saturation shift,
specular/sheen boost from combined normal and wake/foam intensity,
optional vignette or storm desaturation,
optional low-resolution upscale / cell quantisation if the game presentation is pixel-art.
A simple final specular boost might be:

glsl
Copy
float ndh = pow(max(dot(n, h), 0.0), uSpecPower);
float sparkle = ndh * (0.35 + 0.65 * foamWakeMask);
color += uSpecColor * sparkle * uSpecStrength;
color = mix(color, grade(color), uGradeStrength);
If you want the dot-matrix look to read strongly, quantise one or more late-stage terms—highlight, sparkle, foam intensity—onto a coarser water cell grid instead of quantising the whole base colour. That preserves the painterly sea floor tint but gives the surface the “engine-facing pixel pattern” feel suggested by your request. For full-scene pixelation, render the world to a lower-resolution target and upscale with nearest filtering, which Pixi supports directly through scale mode control. 

Blend modes and overlay order. Use simple blend modes only where they materially help and where Pixi’s standard WebGL path is dependable: add for bright foam/wake energy, screen for fog or gentle overlay lightening, multiply for broad colour-pass darkening if you keep this as a separate pass, and normal for ordinary draws. Reserve advanced v8 blend filters for experiments, not for required scene correctness. Finally, draw UI last via render layer or a separate world-independent group. 

Render-pass stack order

Stack order from the poster	Pixi implementation note
World mask	Static alpha mask or clipped water geometry
Water base pass	Base colour + depth tint + body motion + micro normals in one mesh shader
Shoreline pass	Additive or screen foam band from depth+slope
Ripple pass	Interaction ripple RT sampled back into water, or separate normal/spec step
Wake pass	Additive wake RT and wake sparkle
Particles pass	ParticleContainer for foam/spray/bubbles
Fog pass	Screen/add weather RT
Lighting / colour pass	Final custom filter on world group
UI pass	Separate render layer/group, drawn after water/world composite

Performance, debugging, and roadmap
The main performance risks in this pipeline are predictable: too many full-resolution render targets, overdraw from transparent foam and particles, too many texture fetches in the base shader, and state churn from rebuilding geometry or render targets every frame. The sources point to the same mitigations: reuse render textures, avoid per-frame RT creation, avoid mip generation on live RTs, keep antialias off on RTs unless the visual gain is worth a resolve blit, and favour stable/static GPU buffers and VAOs over frequent mutation. Pixi’s particle system also rewards declaring only the truly dynamic properties as dynamic. 

A useful stage-by-stage risk summary is:

Stage	Primary risk	Best mitigation
Base depth colour	Too many large colour textures	Atlas and reuse small ramps; one depth cache, not many copies
Large swell	Vertex shimmer or unnecessary displacement cost	Keep amplitudes low; treat motion as phase before geometry
Micro ripples	Texture bandwidth and shimmer	Two-phase blend only; fade detail by zoom
Flow map	Extra samples and directional artefacts	Low-res RG map; decouple flow scale from ripple scale
Shore foam	Overdraw and noisy edges	Half-res mask RT; stable world mask
Interaction ripples	Event explosion	Fixed-size ring buffer and culling
Wake	Trail spam and RT fill cost	Cap trail history and stamp count per boat
Particles/weather	Transparent overdraw	Tight life spans, pooled particles, conservative spawn rules
Final composite	Full-screen pass cost	One grade filter, not many small post FX

The most important debug controls to expose are not cosmetic. They are structural:

World-space anchoring toggle that freezes time and lets you pan/zoom the camera.
Per-stage visibility toggles for all nine stages.
Depth band visualiser.
Flow vector visualiser with magnitude heatmap.
Foam contributors: shallow term, slope term, edge mask, tile mask.
Ripple event overlay: centres, radii, lifetimes.
Wake trail overlay: segment nodes, widths, intensities.
Particle counters and spawn reasons.
Texture density overlay to catch mismatched tile scales.
LOD switches for half-res/full-res RTs and particle budgets.
Those checks matter because the most common failure is not “the water looks bad.” It is “the water looks right until the camera moves.” Pixel-art and top-down readability make that failure very obvious. Pixi’s transform model and the pixel-art literature both support treating this as a first-class test case, not a late polish task. 

A sensible implementation roadmap is:

Phase	Deliverable	Exit criteria
Foundation	Base water mesh, world mask, static depth tint	Camera pan test passes with zero texture sliding
Body and detail	Large swell phase + micro ripple normals	Water reads as alive before foam/wakes are added
Directionality	Flow map sampling and steering	Currents readable in debug view and in still frames
Shoreline	Depth+slope foam and shallow boost	Foam hugs coasts and rocks, no screen drift
Interactions	Ripple RT with event ring buffer	Object ripples persist correctly in world space
Navigation wake	Wake RT + trail ring buffer + basic particles	Boat wake remains readable under motion and turns
Weather and finish	Fog/rain composite + final grade + UI separation	Weather layers scale down cleanly; UI stays crisp
Optimisation	LODs, particle budgets, optional WebGL2 extras	Stable frame time and no correctness regressions

Finally, if you do want to lean harder into the “Pixi WebGL dot matrix” angle later, the upgrade path is clear and low risk:

keep the existing world fields,
add a cell-grid overlay or instanced-quad layer driven by the same depth/flow/wake data,
quantise chosen late-stage terms to the cell grid,
only then decide whether the entire base surface should become a dot field.
That preserves correctness while letting the stylisation grow intentionally, which is the best way to remain faithful to the two images rather than getting lost in renderer novelty. 
