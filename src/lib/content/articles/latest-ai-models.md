---
title: "Latest AI Models — August 24, 2026"
seo_title: "Latest AI Models (Aug 24, 2026): DeepSeek V4 Flash Vision, Ox Alpha, and the Free-Tier Rotation"
slug: "latest-ai-models"
status: "published"
draft_type: "research-note"
model_stats: "true"
date: "2026-08-24"
updated_date: "2026-08-24"
summary: "One confirmed model release this week — DeepSeek V4 Flash Vision Exp — plus a free-tier rotation on OpenRouter: the mysterious $0 Ox Alpha arrived, and Dots3-Note Preview got a September 30 expiry. The real story is pricing and free-tier churn, not a release wave."
seo_description: "The 2026-08-24 model-news update: DeepSeek V4 Flash Vision Exp launch and off-peak pricing, V4 Pro GA peak/off-peak rates, the unconfirmed Ox Alpha mystery model on OpenRouter, the Dots3-Note Preview September 30 expiry, and a source-checked free-model watchlist."
accent: "#48c5d6"
image: "https://images.pexels.com/photos/33349204/pexels-photo-33349204.jpeg?auto=compress&cs=tinysrgb&w=2000"
image_alt: "Developer workspace with code across multiple screens"
image_credit: "Pexels stock photo"
image_source: "https://www.pexels.com/photo/modern-programmer-workspace-with-digital-code-33349204/"
image_position: "center center"
row_image: "/img/articles/latest-ai-models/model-stats.svg"
row_image_alt: "Editorial horizontal bar chart comparing capability and practical productivity for five current AI models; not a benchmark leaderboard"
row_image_credit: "Original chart by Ryan Spice from fetched public model documentation"
row_image_source: "/img/articles/latest-ai-models/model-stats.svg"
row_image_position: "center center"
audience:
  - "developers evaluating AI APIs"
  - "AI coding-agent operators"
  - "model-routing engineers"
  - "technical leads comparing open-weight models"
tags:
  - "latest AI models"
  - "DeepSeek"
  - "DeepSeek V4 Flash Vision"
  - "Ox Alpha"
  - "OpenRouter"
  - "free models"
  - "GLM-5.3"
  - "Qwen3.8"
  - "Gemini 3.7 Flash"
  - "model pricing"
credits:
  - "Ryan Spice"
  - "DeepSeek, OpenRouter, Z.ai, Google, Hugging Face, and CostGoat public documentation"
references:
  - "DeepSeek — API updates (primary)|https://api-docs.deepseek.com/updates/"
  - "Digital Applied — DeepSeek V4 Flash Vision Exp launch and pricing|https://www.digitalapplied.com/blog/deepseek-v4-flash-vision-exp-launch-pricing"
  - "OpenRouter — models with zero price|https://openrouter.ai/models?max_price=0"
  - "CostGoat — OpenRouter free models and rate-limit notes|https://costgoat.com/pricing/openrouter-free-models"
  - "ExplainX — Ox Alpha: what we know about the mystery model|https://explainx.ai/blog/ox-alpha-what-we-know-mystery-ai-model-august-2026"
  - "Z.ai — release notes|https://docs.z.ai/release-notes/new-released"
  - "Google — Introducing Gemini 3.7 Flash|https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/"
  - "Hugging Face — Qwen3.8-27B model card|https://huggingface.co/Qwen/Qwen3.8-27B"
  - "Pexels programmer workspace photo|https://www.pexels.com/photo/modern-programmer-workspace-with-digital-code-33349204/"
  - "Pexels license|https://www.pexels.com/license/"
related_posts:
  - "glm-5-3-deepseek-v4-pro-harnesses"
  - "deepseek-v4-pro-0813-ga-fleet"
  - "deepseek-v4-pro-deployment-cheatsheet"
---

# Latest AI Models — August 24, 2026

## This week's read

The one confirmed in-window release is [DeepSeek V4 Flash Vision Exp](https://api-docs.deepseek.com/updates/) (August 21, 2026): a multimodal agentic model with off-peak pricing of $0.22/$0.66 per million tokens and a 1.05M-token context. DeepSeek V4 Pro went GA on August 13, and its peak/off-peak pricing took effect August 16 — so the week's biggest practical lever is *when you run jobs*, not which model you pick.

On the free tier, OpenRouter listed [Ox Alpha](https://openrouter.ai/models?max_price=0) on August 20: $0, 1.05M context, anonymous provider, prompts retained. Forensics point at Zhipu's GLM-5.3 stack, but nothing is confirmed. No OpenAI or Anthropic model shipped in this window.

## What changed

**DeepSeek V4 Flash Vision Exp (Aug 21).** Vendor numbers: Terminal Bench 2.1 83.9, NL2Repo 57.7, DeepSWE 59.3, DSBench-Hard 63.6, and Chartography 64.3. DeepSeek states pure-text performance is on par with V4 Flash and multimodal agent capability is “close to Opus-4.8” — vendor claims, not independent runs.

Pricing from [Digital Applied](https://www.digitalapplied.com/blog/deepseek-v4-flash-vision-exp-launch-pricing), cross-checked against the OpenRouter catalog, is $0.22/$0.66 per million input/output tokens off-peak, with cache hits at $0.007 and exactly 2x during peak windows: 01:00–04:00 and 06:00–10:00 UTC ($0.44/$1.32). Images bill up to 384 tokens each at the input rate, and max completion is 384K. It is experimental: no SLA, no Hugging Face weights, and the “Exp” suffix signals supersession risk. Do not build production paths on it.

**DeepSeek V4 Pro GA pricing (Aug 16).** V4 Pro rolled out to App, Web, and API on August 13, with the same peak/off-peak split effective August 16 at 16:00 UTC. GA numbers include Terminal Bench 2.1 87.9, DeepSWE 62.7, Cybergym 83.3, and HLE 42.7/60.0 without and with tools.

**Free-tier rotation on OpenRouter.** Ox Alpha appeared August 20: $0/$0, 1.05M context, and a provider listed only as an anonymous third party (“Stealth”), not OpenRouter itself. The listing says prompts are retained by the provider, even though they are not used for training.

An August 22 forensic analysis by [ExplainX](https://explainx.ai/blog/ox-alpha-what-we-know-mystery-ai-model-august-2026) ties the serving stack to Zhipu: an error-code dialect identical to Z.AI-hosted GLM models, a Z.AI-style Java class path, 30/30 tokenizer probes matching GLM-5.3, and video-token spend matching GLM-5V-Turbo. Zhipu, OpenRouter, and OpenCode have stayed silent. That is strong forensics and zero official confirmation: treat Ox Alpha as an unattributed model, and do not send it private data.

Two smaller entries are worth watching: LiquidAI's LFM2.5-Embedding-350M free embeddings tier, where requests may train Liquid models, and Muse Spark 1.2 Contributor, where prompts are used for training. Free does not mean private.

## Recent context — not this week

- **GLM-5.3** shipped mid-August — Z.ai's release notes say August 18, while DataNorth says August 14. I report both and pick neither. It is listed at $1.40/$4.40 with a 1.05M context, reasoning always on, and a reported +50% over GLM-5.2 on Z.ai Code Bench.
- **Qwen3.8-27B** weights went live August 14: Apache-2.0, dense 27.78B, native image/video, and 262K→1M context. The model card reports Terminal Bench 2.1 73.0, DeepSWE 1.1 42.2, and OSWorld-Verified 84.3.
- **Gemini 3.7 Flash** launched August 13 with intro pricing of $0.75/$3.75 per million tokens until December 31, 2026, then $1.50/$7.50. It is pre-window context, but the price deadline belongs on an operator calendar.
- **OpenAI and Anthropic:** no in-window model releases were found in their public changelogs.

## Free-model watchlist

Pinned free slugs verified live this run include `z-ai/glm-5.2:free` (256K), `nvidia/nemotron-3-ultra-550b-a55b:free` (1.0M), `cohere/north-mini-code:free` (256K), and `poolside/laguna-s-2.1:free` (262K).

Rate limits from [CostGoat](https://costgoat.com/pricing/openrouter-free-models) are 20 requests per minute and 200 per day per model, with no credit card required and 429s beyond that. Free models may be removed or have limits adjusted without notice. The only confirmed scheduled expiry is `dots-studio/dots-3-note-preview:free`, going away September 30, 2026.

The counts need a definition: CostGoat lists 20 `:free` slugs while the live preflight catalog showed 22 zero-priced entries. Zero-priced does not mean the same thing as a `:free` slug. The free tier is a rotation, not an inventory — pin slugs, monitor them, and assume churn.

## Operator read

- **Schedule DeepSeek work off-peak.** Peak hours are exactly 2x. Batch non-interactive jobs outside those windows; cache hits at $0.007 blunt the cost of repeated context.
- **Treat V4 Flash Vision Exp as a preview.** No SLA, no weights, and likely superseded. It is fine for experiments and wrong for production dependencies.
- **Treat Ox Alpha as untrusted infrastructure.** Its provenance is unknown and its provider retains prompts. Cheap context is not worth sending private data to an unattributed endpoint.
- **Migrate off Dots3-Note Preview before September 30.** Free capacity is not a stable contract.
- **Budget for Gemini 3.7 Flash's price step-up.** The intro rate ends December 31, 2026.

The capability/productivity graph below is an **editorial operator snapshot**, not a benchmark leaderboard. The underlying benchmarks — Terminal Bench 2.1, DeepSWE, FrontierCode 1.1, and Z.ai Code Bench — use different harnesses and are not directly comparable across rows.

![Capability vs productivity operator snapshot for five current models; editorial 0–100 judgments, not benchmark scores.](/img/articles/latest-ai-models/model-stats.svg "Editorial operator snapshot, 2026-08-24 — not a benchmark leaderboard.")

![DeepSeek peak versus off-peak pricing: input $0.22 to $0.44 and output $0.66 to $1.32 per million tokens during peak windows.](/img/articles/latest-ai-models/deepseek-peak-pricing.svg "DeepSeek V4 Flash Vision Exp pricing per fetched public catalog sources, 2026-08-24.")

## Caveats

- **Ox Alpha attribution is unconfirmed.** The Zhipu/GLM-5.3 case rests on a third-party forensic analysis; no vendor has confirmed it, and the “already #4 free model” popularity claim was not verified against OpenRouter and is omitted.
- **GLM-5.3's date is disputed** (August 14 versus August 18); both are shown rather than silently resolved.
- **Benchmark comparability is limited.** The numbers above are vendor-published and come from different benchmark families. The stats chart's 0–100 values are editorial judgments derived from that evidence plus operator constraints — they are not benchmark scores and must not be read as rankings.
- **Free-tier data is volatile.** It comes from a CostGoat mirror, spot-checked against OpenRouter's models page; OpenRouter's own API JSON was blocked during this run.
- **MiMo V2.5 claims were excluded.** The available evidence was search snippets rather than a fetched source page.

*Sources: all links in the references above were fetched on 2026-08-24; nothing unfetched is cited.*
