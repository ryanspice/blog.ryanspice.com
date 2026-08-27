---
title: "Building a Free Coding Fleet: MiMo Delegates, OpenRouter Free Lanes, and the Ox Alpha Discovery"
seo_title: "Free AI Coding Fleet — MiMo Pro, OpenRouter Free, and GLM-5.3-Flash"
slug: "free-model-fleet-mimo-delegates-ox-alpha-glm53-flash"
status: "published"
draft_type: "field-note"
date: "2026-08-26"
updated_date: "2026-08-26"
publish_at: "2026-08-26T21:00"
release_date: "2026-08-26"
release_time: "21:00"
summary: "How I built a zero-cost coding-agent fleet using MiMo Pro delegates, OpenRouter free-tier lanes, and the mystery Ox Alpha model that turned out to be GLM-5.3-Flash — now wired into Fugu and T3."
seo_description: "A field note on building a free AI coding fleet with Xiaomi MiMo Pro delegates, OpenRouter free-tier models, and the Ox Alpha / GLM-5.3-Flash discovery — practical workflow details from a Windows developer."
accent: "#00d4aa"
image: "/img/articles/free-model-fleet-mimo-delegates-ox-alpha-glm53-flash/fleet-economic-tiers.svg"
image_alt: "Diagram showing three economic tiers of a coding fleet: flat-rate subscription, free-tier lanes, and paid upgrades"
image_credit: "Original diagram by Ryan Spice"
image_source: "/img/articles/free-model-fleet-mimo-delegates-ox-alpha-glm53-flash/fleet-economic-tiers.svg"
image_position: "center top"
row_image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1800&q=85"
row_image_alt: "Circuit board close-up with green and gold traces"
row_image_credit: "Unsplash"
row_image_source: "https://unsplash.com/photos/green-and-black-circuit-board-YC6sH7mihOM"
row_image_position: "center center"
background_image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=2400&q=85"
background_image_alt: "Server room with blue lighting and network cables"
background_image_credit: "Unsplash"
background_image_source: "https://unsplash.com/photos/blue-server-racks-in-a-data-center-4bd374c3f58b"
background_image_position: "center center"
audience:
  - "developers evaluating free AI coding models"
  - "AI coding-agent operators on a budget"
  - "model-routing engineers"
tags:
  - "MiMo"
  - "GLM-5.3-Flash"
  - "OpenRouter"
  - "Fugu"
  - "T3 Code"
  - "free models"
  - "coding agents"
  - "model routing"
  - "Ox Alpha"
credits:
  - "Ryan Spice"
references:
  - "Original article diagrams|/img/articles/free-model-fleet-mimo-delegates-ox-alpha-glm53-flash/fleet-economic-tiers.svg"
  - "Original benchmark chart|/img/articles/free-model-fleet-mimo-delegates-ox-alpha-glm53-flash/glm53-flash-benchmarks.svg"
  - "Original lane routing map|/img/articles/free-model-fleet-mimo-delegates-ox-alpha-glm53-flash/fugu-lane-routing-map.svg"
  - "Z.ai — GLM-5.3-Flash announcement|https://z.ai/blog/glm-5.3-flash"
  - "OpenRouter — GLM 5.3 Flash|https://openrouter.ai/z-ai/glm-5.3-flash"
  - "OpenRouter — GLM 5.3 Flash (free)|https://openrouter.ai/z-ai/glm-5.3-flash:free"
  - "Hugging Face — GLM-5.3-Flash weights|https://huggingface.co/zai-org/GLM-5.3-Flash"
  - "Business Insider — Ox Alpha revealed as GLM-5.3-Flash|https://www.businessinsider.com/ox-alpha-model-made-by-china-z-ai-2026-8"
  - "OpenCode — ox-alpha usage data|https://opencode.ai/data/unknown/ox-alpha"
  - "Xiaomi MiMo|https://github.com/XiaomiMiMo/MiMo"
  - "Hermes Agent|https://github.com/NousResearch/hermes-agent"
  - "T3 Code|https://github.com/pingdotgg/t3code"
related_posts:
  - "mimo-vs-deepseek-harness-matters"
  - "deepseek-v4-pro-0813-ga-fleet"
  - "glm-5-2-hermes-cloudflare-workers-ai-delegation"
  - "local-fugu-coding-harness"
---

# Building a Free Coding Fleet: MiMo Delegates, OpenRouter Free Lanes, and the Ox Alpha Discovery

*A field note from August 26, 2026 — the day the mystery model got a name.*

I have been running a multi-model coding fleet for months. The premise is simple: no single model is best at everything, but most models are good enough at something. The trick is routing the right work to the right model without spending a fortune. Today that got easier, because the mystery model everyone has been talking about finally got a name.

## The fleet shape

My daily driver is T3 Code, which sits on top of installed provider CLIs — Claude Code, Codex, Hermes, OpenCode. It gives me one surface to approach multiple harnesses. Underneath that, I run a Fugu orchestration layer: one conductor, bounded specialist packets, cross-family verification. The conductor routes work to lanes — worker-spark, worker-flash, worker-pro, worker-mimo, and now worker-glm53.

The economic constraint is real. I do not have unlimited API budget. So the fleet is designed around three tiers:

1. **Flat-rate subscription** — MiMo Pro via Xiaomi's Token Plan. Predictable cost, coding-only, 1M context.
2. **Free-tier lanes** — OpenRouter free models, NVIDIA NIM free tier, and whatever else is available at $0.
3. **Paid upgrades** — DeepSeek Pro, OpenRouter paid models, used only when the free lanes cannot handle the work.

![Diagram showing three economic tiers: flat-rate subscription (MiMo Pro), free-tier lanes (OpenRouter, NVIDIA NIM, GLM-5.3-Flash), and paid upgrades (DeepSeek Pro)](/img/articles/free-model-fleet-mimo-delegates-ox-alpha-glm53-flash/fleet-economic-tiers.svg "The free tier is the default, not the fallback")

The free tier is not a compromise. It is the default.

## MiMo Pro and the delegate pattern

MiMo Pro (`mimo-v2.5-pro`) is the backbone. It runs through T3 Code via the OpenCode provider, pointing at Xiaomi's Token Plan endpoint in Singapore. The API rejects literal `max` reasoning effort on the OpenAI path, so `high` is the ceiling. That is fine. The model is strong enough for daily coding, refactoring, and bounded review.

The interesting part is the delegate pattern. MiMo has a fast sibling — `mimo-v2.5`, the multimodal non-pro variant. It costs one-third of Pro's credit burn (100/200 credits per token versus 300/600). I use it for reconnaissance: reading screenshots, scanning repos, generating test stubs, parallel scouting. Pro handles the hard implementation. Fast handles the legwork.

This is not a novel pattern. But it works particularly well when both models share the same provider, the same context window, and the same tool-calling contract. The delegate does not need to re-learn the repository. It just runs cheaper.

## The OpenRouter free tier

OpenRouter's free models are rate-limited but permanent. The selection rotates, but there is always something available. My current free-tier roster:

- **Laguna S 2.1** (`poolside/laguna-s-2.1:free`) — the free fixture, good for bulk throughput
- **Nemotron 3 Ultra** (`nvidia/nemotron-3-ultra-550b-a55b:free`) — the thinking model, good for review
- **North Mini Code** (`cohere/north-mini-code:free`) — lightweight coding helper
- **GLM-5.2** (`z-ai/glm-5.2:free`) — 256K context, strong at tool use, rate-limited

These are not toys. Laguna has gone 94/94 on bounded coding tasks in my Fugu setup. Nemotron produces genuinely useful architecture review. The rate limits are real — you cannot run a tight loop on a free model — but for a single bounded packet, they work.

The Fugu adapter handles rotation automatically. When a lane hits quota or rate-limit, it falls back to the next free tier hop. Every hop is attested in the packet receipt. No silent substitution.

## The Ox Alpha mystery

For the past week, a model called `ox-alpha` has been the talk of the coding-agent community. It appeared on OpenCode around August 20, unannounced, with no provider attribution. The performance was immediately notable — strong coding, good tool use, long context, and apparently free. OpenCode's usage data showed $0.00 total spend across roughly 44 trillion tokens processed.

I started using it through OpenCode's `/models` selector. The experience was good. Not perfect — the model is verbose, and it sometimes over-explains — but for bounded coding tasks it was competitive with models that cost real money. I ran it on refactoring, test generation, multi-file edits, and architecture review. It held up.

The speculation was wild. Some people thought it was a new OpenAI model. Others guessed Google, Meta, or a Chinese lab. The `ox-alpha` name was deliberately opaque.

## The reveal

Today, Z.ai confirmed it: **`ox-alpha` is GLM-5.3-Flash.**

GLM-5.3-Flash is a 320B mixture-of-experts model with approximately 18B active parameters per token. It supports 1M tokens of context (OpenRouter exposes ~1.31M), multimodal input (text, images, video), and text output. The benchmarks are strong:

- **84.3** on TerminalBench 2.1
- **63.4** on DeepSWE 1.1 (versus 46.2 for GLM-5.2)
- **#3 of 108 models** on Artificial Analysis Intelligence Index (score 57)

It is MIT-licensed, open-weight, and runnable locally via vLLM, SGLang, TokenSpeed, or KTransformers. That is a lot of capability for a model that was free to use for the past week.

![Horizontal bar chart comparing GLM-5.3-Flash benchmarks against GLM-5.3, DeepSeek V4 Pro, and GLM-5.2 on TerminalBench 2.1 and DeepSWE v1.1](/img/articles/free-model-fleet-mimo-delegates-ox-alpha-glm53-flash/glm53-flash-benchmarks.svg "GLM-5.3-Flash: 84.3 TerminalBench, 63.4 DeepSWE")

## The free route

Here is the part that matters for the fleet: **OpenRouter has a permanent free tier for GLM-5.3-Flash.**

The slug is `z-ai/glm-5.3-flash:free`. It is $0 per million tokens for both input and output, rate-limited, with 1M context. This is not the temporary `ox-alpha` preview — that was explicitly a limited-time thing, reportedly capacity for 100 trillion tokens per day, and it could disappear at any moment. The OpenRouter free tier follows the same pattern as `z-ai/glm-5.2:free`, which has been live since June.

The paid route is also cheap: $0.075 per million input tokens and $0.25 per million output tokens, with a 50% introductory discount through September 9. Even at full price, that is dramatically cheaper than GLM-5.3 ($1.40/$4.40) or comparable frontier models.

## Wiring it in

I spent this afternoon wiring GLM-5.3-Flash into the fleet. The changes:

**Hermes profiles.** Both `code-glm53-free` and `lead-glm53-free` were pointing at a dead ZenMux endpoint that returned 403 on completions. I updated them to use OpenRouter's free tier: `z-ai/glm-5.3-flash:free` via `https://openrouter.ai/api/v1`, keyed to `OPENROUTER_API_KEY`. Context window set to 1M, max output to 131K.

**Fugu lanes.** `worker-glm53` and `lead-glm53` were disabled since August 19 because no free endpoint existed. I removed the disabled flag and updated the fallback chains to route through `worker-mimo` → `worker-nv-flash` → `worker-laguna` instead of the dead GLM-5.2 lane.

**Fleet policy.** The `glm53` aliases were unblocked. GLM-5.2 aliases remain blocked — NVIDIA retired that endpoint on August 21.

**OpenCode config.** Added `z-ai/glm-5.3-flash:free` to the OpenRouter provider section so it appears in T3 Code's model picker.

**FUGU-CODEX.** Updated the roster, the available lanes list, and the verification matrix. GLM-5.3-Flash authors get cross-family verification from DeepSeek, Spark, Nemotron, or VibeThinker — never another GLM lane.

![Fugu lane routing map showing conductor dispatching to MiMo Pro, MiMo Fast, GLM-5.3-Flash, DeepSeek Pro, and free-tier lanes](/img/articles/free-model-fleet-mimo-delegates-ox-alpha-glm53-flash/fugu-lane-routing-map.svg "GLM-5.3-Flash slots in as the free coding-batch specialist")

## Where it fits

GLM-5.3-Flash slots into the fleet as a coding-batch specialist. Same role as the old GLM-5.2 lane, but actually working. The use cases:

- Mid-complexity implementation tasks
- Parallel scouts alongside MiMo Fast
- Bounded coding packets where DeepSeek Flash would be the default
- Multimodal tasks — the model can inspect screenshots while coding, which neither DeepSeek nor MiMo Pro can do natively

It is not a replacement for MiMo Pro on hard architecture work, and it is not a replacement for DeepSeek Pro on thinking-heavy tasks. It is a new free lane that is strong enough to be a legitimate primary worker for everyday coding.

## The economics

Let me be honest about the numbers. My current daily cost structure:

- **MiMo Pro** — flat-rate subscription, effectively $0 marginal cost per token within the plan
- **OpenRouter free lanes** — $0 (rate-limited)
- **NVIDIA NIM free lanes** — $0 (quota-limited)
- **DeepSeek Pro** — $0.435/$0.87 per million tokens, used sparingly
- **OpenRouter paid** — varies, used only when free lanes are exhausted

Adding GLM-5.3-Flash at $0 gives me another high-capability free lane. The rate limits mean I cannot run it in a tight loop, but for a single bounded packet — the normal Fugu slice — it is sufficient. The paid route at $0.075/$0.25 is cheap enough to use as a fallback when the free tier is throttled.

The broader trend is clear: capable coding models are becoming effectively free. GLM-5.3-Flash at $0 on OpenRouter, MiMo at flat-rate, DeepSeek Flash at $0.09/$0.18, Laguna at $0. The frontier is still expensive, but the "good enough for daily coding" tier has collapsed to zero or near-zero cost. That changes what is possible with multi-model fleets.

## What I am watching next

The `ox-alpha` free preview was explicitly temporary — roughly one week from August 20. It could disappear at any moment. The OpenRouter free tier is the stable route.

I want to test GLM-5.3-Flash on longer-running agent tasks. The model is specifically optimized for long-horizon work, and the 1M context window is real. If it can hold engineering context through a full development workflow — from requirements to multi-file implementation to test generation — it earns a permanent slot in the rotation.

I also want to test the multimodal input on real tasks. Can it read a screenshot of a broken UI and produce a correct patch? Can it inspect a design mockup and generate matching CSS? Those are tasks where MiMo Fast (also multimodal) currently works, but having a second multimodal free lane would be valuable.

The open weights mean I can eventually run it locally. That is not urgent — the free API route is sufficient — but for privacy-sensitive work or offline scenarios, local hosting matters. The MIT license makes that straightforward.

## The meta point

This fleet is not about finding the one best model. It is about building a system where the right model gets routed to the right task, automatically, at the lowest possible cost. MiMo Pro for daily coding. MiMo Fast for reconnaissance. DeepSeek Pro for hard reasoning. GLM-5.3-Flash for free coding batches. Laguna and Nemotron for free-tier bulk work.

The conductor orchestrates. The lanes execute. The verification matrix catches errors. The cost stays near zero.

Today that system got a new lane, and it was free.
