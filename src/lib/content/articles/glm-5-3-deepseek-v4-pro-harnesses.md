---
title: "GLM-5.3, DeepSeek V4 Pro, and the Harness Between the Numbers"
seo_title: "GLM-5.3 vs DeepSeek V4 Pro — Reading Benchmarks Through the Harness"
slug: "glm-5-3-deepseek-v4-pro-harnesses"
status: "published"
draft_type: "research-note"
date: "2026-08-14"
updated_date: "2026-08-14"
publish_at: "2026-08-14T18:00"
release_date: "2026-08-14"
release_time: "18:00"
summary: "Two launches in three days: DeepSeek V4 Pro went GA and GLM-5.3 shipped as a post-training update. Both arrive with big vendor-run numbers. This follow-up reads those numbers through the harness that produced them — and shows why the same benchmark name can mean different experiments."
seo_description: "A source-checked follow-up to Kingy.ai's GLM-5.3 coverage: what the DeepSWE, Terminal-Bench, and Z.ai Code Bench numbers actually prove once you label the harness and who ran it, plus a launch-day check of where GLM-5.3 is and is not available."
accent: "#48c5d6"
image: "/img/articles/glm-5-3-deepseek-v4-pro-harnesses/harness-decomposition.svg"
image_alt: "Diagram of how the DeepSWE v1.1 public task set flows through different harness configurations and runners, showing the same model name carrying two scores: GLM-5.2 at 46.2 vendor-run and 44 plus or minus 2 independent."
image_credit: "Original diagram by Ryan Spice"
image_source: "/img/articles/glm-5-3-deepseek-v4-pro-harnesses/harness-decomposition.svg"
image_position: "center top"
row_image: "/img/articles/glm-5-3-deepseek-v4-pro-harnesses/deep-swe-harness-chart.svg"
row_image_alt: "Bar chart of DeepSWE v1.1 scores labeled with who ran each record: Kimi K3 67.5, GLM-5.3 66.9, DeepSeek V4 Pro 62.7, GLM-5.2 46.2, with an independent mini-swe-agent record of 44 plus or minus 2."
row_image_credit: "Original chart by Ryan Spice"
row_image_source: "/img/articles/glm-5-3-deepseek-v4-pro-harnesses/deep-swe-harness-chart.svg"
row_image_position: "center center"
audience:
  - "developers evaluating AI APIs"
  - "AI coding-agent operators"
  - "technical leads comparing open-weight models"
  - "model-routing engineers"
tags:
  - "GLM-5.3"
  - "DeepSeek"
  - "DeepSeek V4 Pro"
  - "AI benchmarks"
  - "coding agents"
  - "model routing"
  - "harness"
credits:
  - "Ryan Spice"
  - "Z.ai, DeepSeek, and Kingy.ai public documentation"
references:
  - "Kingy.ai — GLM-5.3 Just Launched: Specs, Benchmarks, API & How to Use It|https://kingy.ai/blog/glm-5-3-specs-benchmarks-api-how-to-use/"
  - "Kingy.ai — GLM-5.3 vs Kimi K3 vs DeepSeek V4 Pro: Who Actually Has the Open-Weight Coding Crown?|https://kingy.ai/blog/glm-5-3-vs-kimi-k3-vs-deepseek-v4-pro/"
  - "Z.ai — GLM-5.3 launch post|https://z.ai/blog/glm-5.3"
  - "Z.ai — developer documentation, pricing overview|https://docs.z.ai/guides/overview/pricing"
  - "OpenRouter — DeepSeek V4 Pro 0813|https://openrouter.ai/deepseek/deepseek-v4-pro-0813"
  - "DeepSeek — Anthropic API guide|https://api-docs.deepseek.com/guides/anthropic_api"
  - "DeepSeek — Claude Code integration|https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code"
  - "DeepSeek V4 Pro deployment cheat sheet (this site)|/deepseek-v4-pro-deployment-cheatsheet/"
related_posts:
  - "deepseek-v4-pro-0813-ga-fleet"
  - "mimo-vs-deepseek-harness-matters"
  - "deepseek-v4-flash-0731-glm-5-2-kimi-k3"
  - "glm-5-2-long-context-search-exposure"
---

# GLM-5.3, DeepSeek V4 Pro, and the Harness Between the Numbers

*A source-checked follow-up to Kingy.ai's GLM-5.3 launch coverage, written August 14, 2026.*

Two launches in three days. On August 12, DeepSeek V4 Pro went general availability at a price that undercuts its reasoning class. On August 14, Z.ai shipped GLM-5.3 — not a new base model, but a month of extra post-training on the GLM-5.2 base. Both announcements arrive with impressive numbers. The interesting part is how much of those numbers you can actually keep once you label the harness that produced them.

[Kingy.ai's launch coverage](https://kingy.ai/blog/glm-5-3-specs-benchmarks-api-how-to-use/) already did the disciplined version of this: vendor-run results separated from independent ones, the missing artifacts listed, the launch-day verdict withheld where evidence stops. This note follows up on that coverage with the two things I could add from my own setup: a launch-day check of where GLM-5.3 actually is (and is not) available through the routes I use, and a look at the DeepSeek V4 Pro deployment path that went public the day before.

![Diagram: the same DeepSWE v1.1 task set flowing through different harness configurations and runners, with GLM-5.2 carrying two different scores.](/img/articles/glm-5-3-deepseek-v4-pro-harnesses/harness-decomposition.svg "A benchmark name identifies the task set, not the experiment that measured it.")

## The two launches

**DeepSeek V4 Pro 0813** went GA on August 12 at **$0.435 / $0.87 per million tokens** with a $0.0036 cache-read rate, 1M context, and thinking on by default. DeepSeek reports DeepSWE 62.7, Terminal-Bench 87.9, and large gains over the preview across the agentic sets. I wired it into my fleet that afternoon; the field note is [here](/deepseek-v4-pro-0813-ga-fleet/).

**GLM-5.3** is the same base as GLM-5.2 with expanded post-training: more executable environments, more varied long-horizon tasks, more reinforcement-learning compute. Z.ai's reported deltas are large — DeepSWE 46.2→66.9, SWE-Marathon 19.4→42.5, Terminal-Bench 3.0 4.6→28.3 — and the API and Coding Plan are live now, with weights, model card, license, and a per-token price row all promised later.

A launch table should therefore be read in two passes. First pass: every Z.ai 5.2-to-5.3 comparison improves, which is a real signal about post-training headroom. Second pass: every cell needs a harness label before it means anything.

## The harness between the numbers

The cleanest example is DeepSWE v1.1, because the same benchmark name appears twice for the same model.

Z.ai's launch table lists GLM-5.2 at **46.2**. The independent DeepSWE leaderboard — which runs every model on mini-swe-agent for consistency — lists GLM-5.2 at **44 ± 2**. Same model name, same benchmark name, two records, because the runs are different: Z.ai's 5.3 footnote specifies temperature 0.95, six-hour timeouts, 400K context, and its own run. The independent record uses the leaderboard's standard harness. The benchmark name identifies the task set. It does not identify the experiment.

Now apply that to the headline numbers. GLM-5.3's DeepSWE 66.9 is a Z.ai-run figure; the independent leaderboard had not added a 5.3 entry at publication time. The comparison that would tighten everything — Z.ai's run and the independent run under the same harness — is the one not yet published.

![Bar chart of DeepSWE v1.1 scores, each bar labeled with who ran it; the GLM-5.2 row shows an independent 44 plus or minus 2 record beside the vendor 46.2.](/img/articles/glm-5-3-deepseek-v4-pro-harnesses/deep-swe-harness-chart.svg "DeepSWE v1.1 as of August 14, 2026: Kimi K3 67.5, GLM-5.3 66.9, DeepSeek V4 Pro 62.7, GLM-5.2 46.2 — with the independent record shown separately.")

The same discipline applies across vendors. Z.ai's own footnotes are unusually detailed, and several change how the table should be read:

- **Terminal-Bench 3.0** ran on Claude Code 2.1.207, max effort, 400K context, 128K maximum output, up to 600 agent turns, a ten-hour timeout, and Tool Search disabled — an average of three rollouts. That is a long leash, and it explains part of why the 4.6→28.3 improvement (+515%) starts from such a small baseline.
- **ExploitGym** counts completed tasks, not percentage points, and its two- and six-hour budgets are rescaled using per-model token throughput (115 tokens/second for GLM-5.3, 40 for Kimi K3, 47 for Qwen3.8-Max) plus non-API overhead.
- **GDPval** is an Elo rating, and **FrontierSWE** reports a dominance score, not a pass rate.
- The independent leaderboard and Z.ai's table can disagree about the same model; that is the normal state of affairs, not an error in either.

None of this invalidates the results. It limits what they prove. The honest label for GLM-5.3's launch table is "vendor-run results on public benchmarks," and the only independent figure in it is the GDPval row from Artificial Analysis.

## The “50% improvement” headline, recalculated

Z.ai's headline says GLM-5.3 improves 50% over 5.2 on its in-house Z.ai Code Bench. The chart in the launch post has enough detail to check the arithmetic: at High effort, 31.4% versus 20.9% is (31.4 − 20.9) / 20.9 = **50.2% relative** — which is **10.5 percentage points absolute**. At Max effort, 34.5% versus 23.4% is 47.4% relative and 11.1 points.

![Grouped bars for GLM-5.2 and GLM-5.3 on the private Z.ai Code Bench, with the relative headline set next to the absolute points behind it.](/img/articles/glm-5-3-deepseek-v4-pro-harnesses/relative-vs-absolute.svg "The 50% headline is relative; the absolute gain is 10.5 points at High effort and 11.1 at Max.")

A percentage-point gain is not a relative percentage gain, and a private benchmark cannot be audited outside the company. The same launch chart also shows output tokens per task falling from ~96,000 to ~75,000 at Max effort — a 21.9% reduction — which is the most interesting part of the story if it reproduces independently: more capability at less token spend is the direction that matters for operator costs.

## What I could verify on launch day

The practical question for someone running a fleet is where GLM-5.3 actually is. I checked the routes I use, live, on August 14:

| Surface | Launch-day status |
| --- | --- |
| OpenRouter | No `glm-5.3` entry — newest is `z-ai/glm-5.2` (plus a `5.2:batch` variant) |
| NVIDIA NIM | Only `z-ai/glm-5.2` — no 5.3 |
| AgentRouter relay | No GLM support at all (docs list Claude, Codex, Gemini, Qwen, OpenCode tooling only) |
| Z.ai standard API | Live (`glm-5.3`, thinking mandatory, `reasoning_effort` low/high/max) |
| Z.ai Coding Plan | Live at $18 / $80 / $168 monthly (Lite / Pro / Max) |
| Official per-token pricing | No 5.3 row at publication; reseller listings suggest ≈5.2 parity ($1.40 in / $4.40 out) — unconfirmed |
| Weights, model card, license | Promised roughly two weeks after launch |

The third-party reseller listings (CometAPI at $1.40/$4.41, ai.360.com at ¥8/¥28) line up with 5.2-parity pricing, but Z.ai's own pricing page had not added a 5.3 row when I checked. Treat that as unconfirmed until the vendor row appears.

For my own routing that means the GLM lanes stay on 5.2 — the NVIDIA free tier carries `z-ai/glm-5.2` and that is the surface my GLM workers use. There is no free route to 5.3, and until the artifact drop there is no route at all outside Z.ai's paid surfaces. Kingy's three-crown framing from its comparison piece is the most honest summary available: **GLM-5.3 holds the vendor-reported performance crown, DeepSeek V4 Pro holds the endpoint-and-price crown, and Kimi K3 holds the downloadable-weights crown.**

## The companion reference

Since the DeepSeek side of this story is the one I can actually run, I've published the deployment reference I keep for V4 Pro as a public page: the **[DeepSeek V4 Pro deployment cheat sheet](/deepseek-v4-pro-deployment-cheatsheet/)**. It covers the integration paths that work with agent harnesses, the thinking-mode gotchas (temperature 1.0, the `reasoning_content` round-trip after tool calls, byte-stable prompts for prefix caching), and the effort policy. It is my personal operating reference, not vendor documentation — the evidence-status note is kept so nobody mistakes it for a benchmark.

## Sources and method

The GLM-5.3 facts, launch table, footnotes, and the recalculation above come from [Kingy.ai's source-checked launch coverage](https://kingy.ai/blog/glm-5-3-specs-benchmarks-api-how-to-use/) and its [three-model crown comparison](https://kingy.ai/blog/glm-5-3-vs-kimi-k3-vs-deepseek-v4-pro/), with the Z.ai and DeepSeek pages linked in the references. My catalog checks were made against the live OpenRouter model list, the NVIDIA NIM model list, and the AgentRouter documentation on August 14, 2026 (Pacific time).

I did not run an inference test of GLM-5.3: no verified free exact-model trial was available, and I did not use paid credentials. The API configuration examples in the linked Kingy coverage are dry-run configurations for the same reason. The diagrams and chart in this article are redrawn from the public sources above so the article holds a stable visual record rather than a live leaderboard screenshot.
