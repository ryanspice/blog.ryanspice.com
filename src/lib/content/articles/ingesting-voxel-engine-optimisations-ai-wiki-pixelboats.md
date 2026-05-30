---
title: "Ingesting Voxel Engine Optimisations into an AI Wiki, Repository, and Pixel Boats"
slug: "ingesting-voxel-engine-optimisations-ai-wiki-pixelboats"
status: "draft"
draft_type: "systems-analysis"
date: "2026-05-30"
audience:
  - "AI Wiki maintainers"
  - "engine developers"
  - "PixelBoats builders"
possible_publication_targets:
  - "AI Wiki inbox"
  - "ryanspice.com"
tags:
  - "voxel engines"
  - "Bevy"
  - "noise"
  - "RLE"
  - "optimization"
  - "PixelBoats"
summary: "A layered breakdown of voxel engine optimisations, with adoption guidance for AI Wiki ingestion and PixelBoats."
---

# Ingesting Voxel Engine Optimisations into an AI Wiki, Repository, and Pixel Boats

Executive summary
The video’s reported gain is best understood as a layered reduction of wasted work, not a single “magic” optimisation. The creator attributes the result to four main methods: automated extremity bound checking, noise upsampling, noise caching, and run-length-encoded runtime voxel storage. In the supplied transcript, the old engine is described as processing about 20 million voxels per second, while the new engine processes about half a billion voxels per second; the new path loads and meshes 30,000 chunks in 14.4 seconds, and the old path loads 38,000 smaller chunks in 61 seconds. 
 

If you normalise the chunk counts and dimensions exactly, the new engine works out to about 546.1 million voxels/sec and the old engine to about 20.4 million voxels/sec, which is roughly 26.8×. The public “25× faster” framing is therefore a rounded and slightly conservative summary of the same underlying throughput change.

For ingestion into your AI wiki and repo, the best implementation order is not the same as the video’s dramatic order. The lowest-risk, highest-confidence wins are noise caching and noise upsampling. The most strategically interesting technique is automated extremity bounds, because it converts worldgen performance into a reusable compiler-style capability. The highest-risk architectural change is RLE runtime storage; it is compelling for read-heavy terrain, save/load, and networking, but it should be introduced behind a feature flag and, for anything heavily editable, likely as a hybrid rather than a pure replacement. That recommendation is consistent with the transcript’s own caveats that the author had not yet reintroduced trees/surface features or stress-tested heavy modification workloads. 
 

For Pixel Boats, the highest-confidence adoption path is: use caching and upsampling immediately for terrain/water/island fields; use automated bounds if your worldgen is layered and declarative; use RLE only for static or mostly-read world columns unless the project truly benefits from very tall chunks, very cheap serialisation, and sparse edits. If boats, hulls, or construction gameplay are materially voxel-edit-heavy, the right design is probably RLE for world terrain plus dense or hybrid storage for dynamic craft.

Source grounding and quantitative interpretation
This report treats the supplied transcript as the primary source for the creator’s claims about what was implemented and what was measured. It supplements that with current official documentation for Bevy task pools, Rust standard-library storage primitives, the noise crate’s Perlin type, Mikola Lysenko’s original greedy-meshing analysis on 0fps, and an academic paper showing why RLE can accelerate some run-oriented operations by skipping work rather than touching every sample. 
 
 

One important source note: your prompt adds implementation details that are not clearly visible in the transcript excerpt, especially the 5×5 AO sampling, the decode-to-bit-array AO path, and the eight 32×32×32 mesher segments carved from each 32×256×32 chunk. I treat those as user-supplied video notes and use them analytically below, while keeping the broader meshing discussion grounded in the 0fps greedy-meshing source. 

A rigorous way to explain the performance increase is to separate the four optimisations by where they remove work:

Layer of work removed	Baseline case	Reduced case	Interpretation
Per-voxel 2D height sampling in a 32×32×32 chunk	32,768 queries	1,024 with Y-axis caching	Same XZ reused across 32 Y levels
Cached 32×32×32 2D height sampling plus 4× XZ upsampling	1,024 queries	81 coarse samples	Sample every 4 blocks in X and Z, then interpolate
Per-voxel 2D height sampling in a 32×256×32 chunk	262,144 queries	1,024 with Y-axis caching	Same XZ reused across 256 Y levels
Cached 32×256×32 2D height sampling plus 4× XZ upsampling	1,024 queries	81 coarse samples	Very large theoretical reduction for low-frequency height layers

Those numbers are idealised and apply most cleanly to 2D height/biome fields, not to every 3D cave or detail pass. Even so, they explain why the reported overall 25× result is credible: the pipeline is collapsing a huge amount of repeated or unnecessary noise work before meshing even begins.

The transcript’s own upsampling math makes the same point. At 4× upsampling on a 32³ chunk, the coarse lattice contains 729 samples, about 45× fewer raw noise calls than sampling all 32,768 voxels. But the measured performance gain is much smaller because interpolation still happens for every output voxel. In the supplied benchmark, a 64³ 3D-noise chunk drops from about 7 ms with no upsampling to about 2.4 ms at 2× and about 1.4 ms at 4×, which is roughly 2.9× and 4.9× faster respectively, not 45× faster. That gap between theoretical query reduction and practical wall-clock gain is exactly what you would expect in a pipeline that still pays interpolation, meshing, memory writes, and job-scheduling costs. 

The RLE story has the same shape. Dense storage for a single 32×256×32 chunk at one byte per voxel is 262,144 bytes, which is the same raw occupancy as eight stacked 32³ chunks at one byte per voxel. So the win is not that a tall dense chunk somehow stores fewer raw voxels than eight short dense chunks. The reported advantage is that RLE makes the tall chunk affordable, which then improves chunk-management overhead, heightmap/biome cache reuse across Y, surface-transition scanning, and serialisation. That is a subtler and much more interesting claim than “RLE compresses data.” 

Technique analysis
Automated extremity bounds
This is the most novel technique in the video and the one most worth ingesting as an AI wiki skill, not just a code patch. In the transcript’s simple example, if a height function can only produce heights in [0, 10], any voxel above y = 10 is guaranteed air and any voxel below y = 0 is guaranteed ground, so the engine can skip the expensive noise function entirely. The creator reports a toy benchmark improving from about 300 μs to 100 μs, and a larger like-for-like shaping comparison improving from about 29 seconds to 2 seconds. 
 

The important architectural leap is not the manual if y > max_height { air } check. It is the move from hand-written Rust shaping code to a serialised layer graph whose bounds are inferred automatically. In compiler terms, that is essentially interval analysis over a worldgen expression graph. The transcript explicitly says the shaping logic is now serialised into data, composed from layers, and used to calculate bounds automatically, while also warning that this is a large architectural challenge and still less expressive than arbitrary code. 

A pragmatic Rust+Bevy implementation path is:

define your shaper as data, not ad hoc closures;
compile each layer or node into both an evaluator and a conservative output range;
classify whole chunks, Y-spans, or columns as all_air, all_solid, or mixed before sampling;
fall back to exact evaluation whenever the bound is uncertain.
rust
Copy
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct RangeF32 {
    pub min: f32,
    pub max: f32,
}

impl RangeF32 {
    pub fn add(self, rhs: Self) -> Self {
        Self { min: self.min + rhs.min, max: self.max + rhs.max }
    }

    pub fn scale(self, s: f32) -> Self {
        if s >= 0.0 {
            Self { min: self.min * s, max: self.max * s }
        } else {
            Self { min: self.max * s, max: self.min * s }
        }
    }

    pub fn clamp(self, min: f32, max: f32) -> Self {
        Self { min: self.min.max(min), max: self.max.min(max) }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum Expr {
    Noise2D { noise_id: u16, amplitude: f32, bias: f32 },  // e.g. [-1,1] * amplitude + bias
    Add { a: usize, b: usize },
    Clamp { src: usize, min: f32, max: f32 },
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ShapeProgram {
    pub nodes: Vec<Expr>,
    pub root: usize,
}

pub fn infer_range(program: &ShapeProgram, node: usize) -> RangeF32 {
    match &program.nodes[node] {
        Expr::Noise2D { amplitude, bias, .. } => {
            RangeF32 { min: -1.0, max: 1.0 }.scale(*amplitude).add(RangeF32 { min: *bias, max: *bias })
        }
        Expr::Add { a, b } => infer_range(program, *a).add(infer_range(program, *b)),
        Expr::Clamp { src, min, max } => infer_range(program, *src).clamp(*min, *max),
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SpanClass {
    AllAir,
    AllSolid,
    Mixed,
}

pub fn classify_height_span(y_min: i32, y_max: i32, height_range: RangeF32) -> SpanClass {
    if y_min as f32 > height_range.max {
        SpanClass::AllAir
    } else if y_max as f32 <= height_range.min {
        SpanClass::AllSolid
    } else {
        SpanClass::Mixed
    }
}
This pattern fits Bevy well because the compiled shape program can be immutable shared state and chunk-generation jobs can run on AsyncComputeTaskPool, which Bevy documents as the pool for CPU-intensive work that may span multiple frames. If a piece of work must complete before the next frame, Bevy’s docs instead point you to ComputeTaskPool. Rust’s Arc<T> gives you thread-safe shared ownership, but the standard library also stresses that atomics are more expensive than ordinary memory access, so use Arc for shared compiled programs or shared baked tables, not for tiny hot-path values that can simply be copied into a job. 

The key data structures are a serialised ShapeProgram, a compiled representation that stores both an evaluator and conservative bounds, and per-task scratch buffers. The biggest memory/cache advantage is that successful chunk or span classification skips entire branches of expensive evaluation. The biggest threading advantage is embarrassingly parallel chunk classification. The biggest pitfall is unsound bounds once you add domain warping, thresholds, gradients, or shape composition. The right test strategy is therefore not only benchmarking but also equivalence testing: randomly sample seeds and positions, compare the bounded fast path against an always-evaluate reference, and fail on any misclassification. Criterion is a good fit here because it is explicitly statistics-driven and can detect regressions across runs. 
 

Noise upsampling
Noise upsampling is the clearest “do less work” optimisation in the set. Instead of evaluating noise at every voxel, you evaluate a coarser lattice—every second, fourth, eighth, or sixteenth block—and interpolate the gaps. The transcript explicitly describes this as one of the two optimisations “every voxel engine should use,” and shows that the raw sample-count reduction from 32,768 samples to 729 samples at 4× upsampling does not translate linearly into wall-clock speed because interpolation is still required at voxel resolution. 

The right way to ingest this into your repo is to treat upsampling as a per-layer policy, not a single global toggle. Low-frequency continental masks, island shapes, humidity, temperature, broad seabed undulation, and macro terrain are excellent candidates for 4× to 8× sampling. High-frequency cave fields, sharp overhang masks, or anything that drives gameplay-critical collision detail are much weaker candidates.

rust
Copy
use noise::{NoiseFn, Perlin};

#[inline]
fn idx3(x: usize, y: usize, z: usize, sx: usize, sy: usize) -> usize {
    x + y * sx + z * sx * sy
}

#[inline]
fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

#[inline]
fn trilerp(c: [f32; 8], tx: f32, ty: f32, tz: f32) -> f32 {
    let x00 = lerp(c[0], c[1], tx);
    let x10 = lerp(c[2], c[3], tx);
    let x01 = lerp(c[4], c[5], tx);
    let x11 = lerp(c[6], c[7], tx);
    let y0 = lerp(x00, x10, ty);
    let y1 = lerp(x01, x11, ty);
    lerp(y0, y1, tz)
}

pub fn fill_density_upsampled(
    noise: Perlin,
    origin: [i32; 3],
    size: [usize; 3],
    step: usize,
    out: &mut [f32],
) {
    let gx = size[0] / step + 1;
    let gy = size[1] / step + 1;
    let gz = size[2] / step + 1;

    let mut coarse = vec![0.0f32; gx * gy * gz];

    for cz in 0..gz {
        for cy in 0..gy {
            for cx in 0..gx {
                let wx = origin[0] + (cx * step) as i32;
                let wy = origin[1] + (cy * step) as i32;
                let wz = origin[2] + (cz * step) as i32;
                coarse[idx3(cx, cy, cz, gx, gy)] =
                    noise.get([wx as f64 * 0.01, wy as f64 * 0.01, wz as f64 * 0.01]) as f32;
            }
        }
    }

    for z in 0..size[2] {
        for y in 0..size[1] {
            for x in 0..size[0] {
                let cx = x / step;
                let cy = y / step;
                let cz = z / step;

                let tx = (x % step) as f32 / step as f32;
                let ty = (y % step) as f32 / step as f32;
                let tz = (z % step) as f32 / step as f32;

                let c = [
                    coarse[idx3(cx,     cy,     cz,     gx, gy)],
                    coarse[idx3(cx + 1, cy,     cz,     gx, gy)],
                    coarse[idx3(cx,     cy + 1, cz,     gx, gy)],
                    coarse[idx3(cx + 1, cy + 1, cz,     gx, gy)],
                    coarse[idx3(cx,     cy,     cz + 1, gx, gy)],
                    coarse[idx3(cx + 1, cy,     cz + 1, gx, gy)],
                    coarse[idx3(cx,     cy + 1, cz + 1, gx, gy)],
                    coarse[idx3(cx + 1, cy + 1, cz + 1, gx, gy)],
                ];

                out[idx3(x, y, z, size[0], size[1])] = trilerp(c, tx, ty, tz);
            }
        }
    }
}
The required data structure is small and cache-friendly: a contiguous coarse lattice in a Vec<f32>, plus a contiguous output buffer. Rust’s Vec<T> is explicitly contiguous, and Vec::with_capacity can preallocate enough space to avoid reallocation while generating a chunk or segment. That matters because upsampling’s whole value proposition is to replace expensive noise calls with cheap, predictable arithmetic over contiguous scratch memory. 

Threading is straightforward. Each chunk, column band, or mesh segment can build its own coarse field independently on a Bevy task pool. Testing should cover three dimensions: performance, visual fidelity, and seams. Benchmark direct sampling versus 2×/4×/8× on representative terrain layers; compute max absolute error against the dense reference; and verify neighbour chunks agree at borders by sampling with a one-cell halo. The main pitfalls are aliasing, step sizes that are too large for the highest frequency in the field, and applying upsampling blindly to domain-warped or cave-heavy fields whose features you actually need to preserve. The transcript’s own non-linear benchmark results are the warning label here: gains flatten because interpolation still costs something, and detail loss eventually dominates. 

Noise caching
Noise caching removes repeated questions rather than approximate ones. The most obvious example in the transcript is a 2D height function reused across Y: moving that noise call outside the Y loop turns 32 identical calls into 1 for each XZ pair, which the creator describes as an immediate 32× reduction in noise evaluations for that case. The transcript then extends the same logic to biome blending by predefining globally shared noise parameters once and feeding them into multiple biome shapers instead of recomputing equivalent layers independently. 

There are really three distinct cache types worth ingesting into your repo. The first is a local per-chunk grid cache for regular 2D or 3D sampling. The second is a shared global baked table for world-scale layers such as climate/biome masks. The third is a border cache for transition regions where two biome graphs reuse the same low- and medium-frequency sources. The design rule is simple: if the cache key is regular and bounded, prefer a flat Vec over a hash map; only use a HashMap for genuinely irregular lookups or edit overlays.

rust
Copy
use std::sync::Arc;

pub struct ChunkScratch {
    pub height_2d: Vec<f32>,
    pub biome_2d: Vec<u16>,
}

impl ChunkScratch {
    pub fn new() -> Self {
        Self {
            height_2d: Vec::with_capacity(32 * 32),
            biome_2d: Vec::with_capacity(32 * 32),
        }
    }
}

#[inline]
fn idx2(x: usize, z: usize, sx: usize) -> usize {
    x + z * sx
}

pub fn build_height_cache<N: noise::NoiseFn<f64, 2>>(
    noise: &N,
    origin_x: i32,
    origin_z: i32,
    size_x: usize,
    size_z: usize,
    out: &mut Vec<f32>,
) {
    out.clear();
    out.resize(size_x * size_z, 0.0);

    for z in 0..size_z {
        for x in 0..size_x {
            out[idx2(x, z, size_x)] = noise.get([
                (origin_x + x as i32) as f64 * 0.01,
                (origin_z + z as i32) as f64 * 0.01,
            ]) as f32;
        }
    }
}

pub struct SharedNoiseTable {
    pub width: usize,
    pub height: usize,
    pub values: Arc<[f32]>,
}
This design also maps cleanly onto the current Rust and Bevy ecosystem. Perlin in the noise crate implements 1D/2D/3D/4D NoiseFn and is Send and Sync, so it can be copied or shared into worker tasks safely. Arc<T> is appropriate for large immutable baked tables, but the standard library explicitly warns that atomic reference counting has overhead; that is a good reason to make per-chunk caches task-local wherever possible. HashMap::with_capacity is appropriate for irregular caches or edit tables if you know the rough size in advance. 

The testing strategy here should be unusually concrete. Instrument actual noise-call counts per chunk and expose them as counters in your benchmark output. Compare interior chunks with biome-border chunks. Verify that changing a seed or noise parameter invalidates the right cache layers and not others. The biggest pitfall is over-caching: if you centralise caches too aggressively, you can trade saved computation for lock contention, stale invalidation bugs, and memory blow-up. For Pixel Boats in particular, caching should likely start with global fields that are obviously reused—climate bands, ocean-floor shape, water-line masks, island macro shapes—and only then expand to biome-border and segment-level caches.

RLE runtime voxel data
RLE runtime storage is the most controversial technique in the set and the one that deserves the most nuance in your blog post. The transcript says the engine no longer stores chunk data as a flat Vec of all voxels, but as run-length-encoded chunk data, with a 32×256×32 chunk size. It explicitly names the trade-off: runtime RLE uses very little memory and makes save/network serialisation trivial because the runtime format is already compressed, but random access and especially random modification become significantly slower because you have to traverse and split runs instead of directly indexing an array. 

The case for runtime RLE is stronger than it first appears. The transcript reports three categories of gain: lower RAM, cheaper serialisation, and operational speedups for some traversal patterns. Large vertical writes can be emitted as single runs; surface detection can walk transitions instead of every voxel; tall chunks reduce chunk-management overhead; and raising chunk height from 32 to 256 increases Y-axis reuse of cached height/biome data by 8× compared with stacked 32-high chunks. The transcript also gives a concrete world-memory anecdote: a 36-chunk render distance uses about 400 MB in the RLE design versus a much larger dense equivalent depending on voxel packing. 

A useful way to frame this rigorously is that RLE changes the storage backend from a voxel-addressed array to a transition-addressed sequence. That mirrors what the literature shows in other domains: the arXiv paper on RLE binary images accelerates morphology by operating on runs and explicitly skipping analysis of many pixels after precomputation. That does not prove runtime voxel RLE is always superior, but it does support the narrower claim that run-based storage can be faster when the hot operations are sequential, structured, and transition-oriented rather than uniformly random. 

A practical Rust representation is column-wise RLE along Y. That keeps generation append-only and makes “terrain-like” distributions compress naturally.

rust
Copy
pub const CHUNK_X: usize = 32;
pub const CHUNK_Y: usize = 256;
pub const CHUNK_Z: usize = 32;
pub const SEGMENT_Y: usize = 32;
pub const SEGMENTS_PER_CHUNK: usize = CHUNK_Y / SEGMENT_Y;

pub type MaterialId = u16;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Run {
    pub material: MaterialId,
    pub len: u16, // sum of runs in a column must equal CHUNK_Y
}

#[derive(Default, Debug)]
pub struct ColumnRle {
    pub runs: Vec<Run>,
}

#[derive(Debug)]
pub struct RleChunk {
    pub columns: Vec<ColumnRle>, // CHUNK_X * CHUNK_Z
}

#[inline]
pub fn column_index(x: usize, z: usize) -> usize {
    x + z * CHUNK_X
}

pub fn append_material(col: &mut ColumnRle, material: MaterialId, len: u16) {
    if let Some(last) = col.runs.last_mut() {
        if last.material == material {
            last.len += len;
            return;
        }
    }
    col.runs.push(Run { material, len });
}

pub fn voxel_at(col: &ColumnRle, y: u16) -> MaterialId {
    let mut acc = 0u16;
    for run in &col.runs {
        acc += run.len;
        if y < acc {
            return run.material;
        }
    }
    0 // air fallback if representation is invalid
}

pub enum ChunkStorage {
    Dense(Box<[MaterialId]>),
    Rle(RleChunk),
    Hybrid {
        base: RleChunk,
        dirty_segments: Vec<Option<Box<[MaterialId]>>>, // one optional dense overlay per 32-high segment
    },
}
Your supplied notes add the most important implementation detail for making this workable with meshing and AO: do not sample AO or greedy meshing directly from RLE. Decode the needed region into bit arrays first. Given the note that the binary greedy mesher uses u32 bit arrays and naturally covers 32 Y cells at a time, the clean repo design is to treat a 32×256×32 chunk as eight 32×32×32 vertical mesh segments. For AO with a 5×5 kernel, decode each segment plus the halo required by the kernel into local bitmasks, then run face extraction and AO sampling on those masks. That is exactly the kind of bridge that lets RLE be excellent at storage/generation while bit arrays stay excellent at meshing/AO.

The biggest design choice is how to handle random edits. My recommendation is not “pure RLE everywhere.” It is one of these three hybrid strategies:

keep a base RLE chunk plus a sparse or dense edit overlay;
promote a segment or column from RLE to dense once fragmentation or edit count exceeds a threshold;
batch edits, then compact back to RLE during remesh/save boundaries rather than on every write.
That caution is not theoretical. The transcript itself says the approach had not been fully validated yet for trees/surface features or heavy modification workloads. And 0fps closes its greedy-meshing article with an explicit open problem about efficient data structures for dynamically maintaining greedy meshes—exactly the kind of warning that should make you conservative about pairing pure RLE with intensive live editing. 
 

AI wiki ingestion templates
These templates are written to be directly ingestible as AI wiki skills and to map onto the repo layout proposed later in this report. They intentionally encode not only “what” but also “when to use” and “how to verify.”

Automated extremity bounds skill
yaml
Copy
title: Automated Extremity Bounds for Layered Voxel Worldgen
description: >
  Compile a serialised worldgen layer graph into conservative output ranges so
  chunk, span, or column generation can skip noise evaluation when the result is
  provably all air or all solid.
prerequisites:
  - Rust
  - Bevy task pools
  - Interval arithmetic basics
  - A data-driven worldgen graph or layer model
step_by_step_actions:
  - Convert hand-written shaping logic into a serialisable graph of layers/nodes.
  - Infer conservative ranges for each node during compile/setup time.
  - Classify chunk Y-spans or columns before exact evaluation.
  - Fall back to full evaluation whenever bounds are uncertain.
  - Run equivalence tests against a brute-force evaluator.
code_examples:
  - crates/voxel_worldgen/src/bounds.rs::infer_range
  - crates/voxel_worldgen/src/generator.rs::classify_height_span
tags:
  - voxel
  - rust
  - bevy
  - procgen
  - performance
  - interval-analysis
Noise upsampling skill
yaml
Copy
title: Noise Upsampling for Low-Frequency Terrain Fields
description: >
  Sample low-frequency noise on a coarse lattice and reconstruct voxel-density or
  height values with bilinear/trilinear interpolation to cut raw noise calls.
prerequisites:
  - Rust
  - Interpolation basics
  - Knowledge of which noise layers are low- vs high-frequency
step_by_step_actions:
  - Mark each terrain layer with an upsample factor.
  - Generate coarse lattice values with a one-cell border or halo.
  - Interpolate coarse samples into the dense chunk or segment buffer.
  - Compare visual error and throughput against the dense path.
  - Disable or reduce upsampling on cave/detail layers where aliasing is visible.
code_examples:
  - crates/voxel_worldgen/src/upsample.rs::fill_density_upsampled
  - crates/voxel_bench/benches/upsample.rs
tags:
  - voxel
  - interpolation
  - terrain
  - noise
  - performance
Noise caching skill
yaml
Copy
title: Noise Caching for Heightmaps, Biomes, and Shared Layers
description: >
  Avoid recomputing identical noise queries by caching regular grids locally per
  chunk and baking shared low/medium-frequency fields used by multiple biome shapers.
prerequisites:
  - Rust
  - Awareness of repeated noise access patterns
  - Stable chunk/segment coordinate conventions
step_by_step_actions:
  - Move repeated XZ-only queries outside Y loops.
  - Store regular caches in flat arrays, not hash maps.
  - Bake shared global noise tables for climate/biome layers.
  - Reuse shared layers during biome blending instead of recomputing them per biome.
  - Instrument actual noise-call counts before and after the change.
code_examples:
  - crates/voxel_worldgen/src/cache.rs::build_height_cache
  - crates/voxel_worldgen/src/biome.rs::sample_shared_layers
tags:
  - voxel
  - caching
  - biome-blending
  - rust
  - profiling
RLE runtime voxel storage skill
yaml
Copy
title: Hybrid RLE Runtime Storage for Tall Terrain Chunks
description: >
  Store mostly vertical terrain chunks as Y-column runs to reduce memory,
  serialisation cost, and transition-oriented scans, while decoding local
  segments to bitmasks for meshing and AO.
prerequisites:
  - Rust
  - Chunk/segment meshing pipeline
  - Clear edit-frequency expectations
  - Save/network format versioning
step_by_step_actions:
  - Represent each XZ column as a sequence of material-length runs along Y.
  - Generate runs append-only during worldgen.
  - Decode 32-high segments into bit arrays before greedy meshing or AO.
  - Keep a dense or sparse edit overlay for dynamic modifications.
  - Compact or repack runs after remesh/save checkpoints.
code_examples:
  - crates/voxel_storage/src/rle.rs::append_material
  - crates/voxel_meshing/src/segment_decode.rs::materialise_segment_bits
  - crates/voxel_storage/src/hybrid.rs::ChunkStorage
tags:
  - voxel
  - rle
  - storage
  - meshing
  - ao
  - networking
Repository design and Pixel Boats adaptation
A clean repo layout is to separate worldgen, storage, meshing, runtime jobs, and benchmarks. That keeps the optimisations reusable, testable, and independently benchmarkable rather than fusing them into one monolithic chunk generator.

text
Copy
crates/
  voxel_config/
    src/worldgen_shape.rs
    src/noise_defs.rs
  voxel_worldgen/
    src/bounds.rs
    src/cache.rs
    src/upsample.rs
    src/biome.rs
    src/generator.rs
  voxel_storage/
    src/dense.rs
    src/rle.rs
    src/hybrid.rs
    src/serialize.rs
  voxel_meshing/
    src/bitmask.rs
    src/segment_decode.rs
    src/greedy.rs
    src/ao.rs
    src/mesh_build.rs
  voxel_runtime/
    src/chunk_jobs.rs
    src/chunk_streaming.rs
    src/feature_flags.rs
  voxel_bench/
    benches/end_to_end.rs
    benches/bounds.rs
    benches/cache.rs
    benches/upsample.rs
    benches/rle.rs
The API surface should expose interchangeable backends and keep the storage/meshing boundary crisp:

rust
Copy
pub struct ChunkPos(pub i32, pub i32, pub i32);

pub trait VoxelRead {
    fn voxel(&self, x: u8, y: u16, z: u8) -> MaterialId;
}

pub trait VoxelEdit: VoxelRead {
    fn set_voxel(&mut self, x: u8, y: u16, z: u8, value: MaterialId);
    fn compact(&mut self);
}

pub trait MeshSource {
    fn materialise_segment_bits(
        &self,
        segment_index: u8,
        halo_radius: u8,
        out_opaque_masks: &mut [u32],
        out_materials: &mut [MaterialId],
    );
}

pub struct GenerationScratch {
    pub height_2d: Vec<f32>,
    pub biome_2d: Vec<u16>,
    pub coarse_noise: Vec<f32>,
}

pub fn compile_shape_program(config: &ShapeProgramConfig) -> CompiledShapeProgram;
pub fn generate_chunk(
    pos: ChunkPos,
    shape: &CompiledShapeProgram,
    scratch: &mut GenerationScratch,
    storage_mode: StorageMode,
) -> ChunkStorage;

pub fn build_chunk_meshes(
    chunk: &impl MeshSource,
    ao_kernel_radius: u8, // 2 => 5x5 neighbourhood
) -> [Option<MeshBuffers>; 8];
That interface is intentionally aligned with the supplied video notes. A 32×256×32 runtime chunk becomes a storage object that can hand the mesher eight 32-high decoded segments. AO remains a meshing concern, not a storage concern. Greedy meshing remains a bitmask-space algorithm, which preserves the 0fps insight that greedy meshing is a linear-time pass on a bitmap-like representation and avoids trying to maintain a dynamic greedy mesh directly on compressed storage. 

The table below compares the four techniques by likely value and project fit.

Technique	Likely perf upside	Memory effect	Implementation complexity	Pixel Boats suitability	Main caveat
Automated extremity bounds	High where empty/solid regions dominate	Neutral to small positive	High	Strong if terrain/water generation is layered and procedural	Requires a declarative shaper and conservative bound logic
Noise upsampling	High on low-frequency fields	Small temporary scratch cost	Low to medium	Very strong for island masks, seabed, climate, ocean variation	Can blur or alias high-frequency or gameplay-critical detail
Noise caching	High on repeated XZ or shared biome layers	Small to moderate cache cost	Low	Very strong almost everywhere	Over-centralised caches can create invalidation or contention issues
RLE runtime data	High for read-heavy terrain, streaming, save/network, tall chunks	Potentially very large positive	High	Strong for static terrain/water columns; moderate to weak for dynamic boats/hulls	Random access and frequent edits are the danger zone

That matrix is an architectural recommendation, not a measured result, but it aligns with the transcript’s own claims and caveats around memory, tall chunks, shared Y-axis reuse, serialisation, and unproven heavy-edit workloads. 

For Pixel Boats, the biggest missing facts are: whether boats themselves are voxelised; whether hull damage/building is core gameplay; whether islands are procedural or authored; whether multiplayer replication is authoritative and frequent; and what the target CPU/memory budget is. Because those are unspecified, the safest adaptation path is:

use noise caching and upsampling immediately for world terrain, seabed, wave masks, currents, climate, and biome boundaries;
use automated bounds if you want a robust, scalable worldgen graph for islands/coastlines/caves/shore bands;
use RLE for static world terrain and water columns, where long runs of air, water, sand, rock, and seabed are likely;
keep dynamic craft on dense segments or a hybrid overlay, especially if boats can be edited, damaged, or synchronised frequently.
If Pixel Boats has a lot of “air above water above seabed” columns and a large visible world, RLE is a particularly strong fit for the world, because the same representation improves memory, save/load, and network transfer. If Pixel Boats is instead centred on heavily destructible voxel ships, then RLE should stay a terrain backend and not become the universal storage layer. 

Migration plan, benchmarks, and editorial framing
The fastest way to integrate these techniques without destabilising the engine is to treat every change as a separately feature-flagged backend or pass. That lets you ship instrumentation first, compare dense versus optimised implementations side by side, and roll back any one optimisation without rewriting adjacent systems.

Baseline instrumentation

Local noise caching

Per-layer upsampling

Declarative shape graph

Automated extremity bounds

RLE storage behind feature flag

Segment decode to bitmasks

AO and greedy meshing on local masks

Hybrid edit overlay and stress tests



Show code
A practical milestone plan looks like this:

Milestone	Deliverable	Estimated effort	Success metric	Rollback strategy
Baseline instrumentation	End-to-end and microbench harnesses, counters for noise calls and bytes/chunk	1–2 days	Stable baseline numbers for data-gen, meshing, save/load	None needed; this is additive
Local noise caching	Height/biome caches, per-task scratch	1–3 days	Lower noise-call counts and throughput increase with identical output	Feature flag voxel_cache; fall back to raw sampling
Per-layer upsampling	Configurable 2×/4×/8× upscale on selected fields	2–4 days	Better throughput with acceptable visual error and no border seams	Per-layer factor set back to 1
Declarative shape graph	Serialised worldgen config replacing hard-coded shaping	3–6 days	Existing worlds reproduced from config-driven graph	Keep legacy shaper in parallel
Automated extremity bounds	Bound inference and chunk/span preclassification	4–8 days	Identical output to dense reference plus skip-rate gains	Flag voxel_bounds; fall back to exact path
RLE terrain backend	Static world chunks in RLE, dense backend still present	5–10 days	Lower bytes/chunk and faster save/load/streaming	Backend switch back to dense
Segment decode and meshing	8-way 32-high decode-to-bitmask path, AO tested	3–6 days	Mesh parity with dense path and no seam cracks	Mesher source switch back to dense materialisation
Hybrid edit overlay	Dense overlays or promoted dense segments for edits	4–7 days	Acceptable p95 edit latency under workload	Disable hybrid path and keep terrain read-only in RLE

Those estimates assume you already have a functioning chunk pipeline and mesh builder. If the current engine does not yet separate worldgen, storage, and meshing concerns, the real effort goes up because you will be extracting architecture first, not only adding optimisations.

Your benchmark suite should be explicit and versioned. Criterion is useful here because it is designed for statistically robust microbenchmarks, regression detection, function comparisons, throughput reporting, and detailed charts/HTML reports. 

Recommended benchmark groups:

Data generation only: one chunk, one region, many seeds, with and without bounds/caching/upsampling.
Meshing only: dense source versus RLE-decoded segment masks, with AO on and off.
Biome-border generation: chunks fully inside a biome versus chunks crossing biome boundaries.
Serialisation: bytes/chunk, save/load time, network-pack time.
Edit stress: random single-voxel edits, clustered edits, vertical column cuts, repeated boat-hull style edits.
Streaming/scanning: chunk manager behaviour with 32×32×32 vertical stacks versus 32×256×32 tall chunks.
Suggested plots for the blog post and for ongoing repo benchmarking:

Plot	X-axis	Y-axis	Why it matters
Throughput by optimisation toggle	Technique set	Voxels/sec	Shows which change actually moved the needle
Throughput by chunk height	32, 64, 128, 256 Y	Voxels/sec and noise calls/chunk	Visualises the reuse advantage of tall chunks
Quality/perf for upsampling	Upsample factor	Time and max density error	Makes the 2×/4×/8× trade-off obvious
Memory footprint by storage backend	Dense vs RLE vs hybrid	Bytes/chunk and loaded-world RAM	Grounds the storage argument
Edit latency versus fragmentation	Edit count or fragmentation ratio	p50/p95 set-voxel latency	Decides whether pure RLE is tenable for dynamic content
Mesh cost by segment count	Segment index or total active segments	Meshing time and quads emitted	Validates the eight-segment decode strategy

For Bevy scheduling, use AsyncComputeTaskPool for chunk generation and any background decode/remesh work that may span frames, and reserve ComputeTaskPool for work that must finish before the next frame. Bevy’s current docs make exactly that distinction. 

For the blog post on blog.ryanspice.com, the strongest editorial thesis is this: the 25× gain did not come from “faster noise” or “faster meshing” in the abstract; it came from eliminating whole categories of unnecessary work. Extremity bounds skip impossible evaluations. Upsampling samples less often. Caching stops asking the same question twice. RLE stores the world closer to the way terrain actually behaves and shifts hot operations toward transitions and batch writes. That is a much stronger engineering story than “one weird trick,” and it maps directly into reusable AI wiki skills, repo modules, and project-specific choices for Pixel Boats.
