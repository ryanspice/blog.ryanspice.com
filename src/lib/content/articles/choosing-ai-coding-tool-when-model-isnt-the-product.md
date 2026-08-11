---
title: "Choosing an AI Coding Tool When the Model Isn't the Product"
seo_title: "Choosing an AI Coding Tool When the Model Isn't the Product"
slug: "choosing-ai-coding-tool-when-model-isnt-the-product"
status: "published"
draft_type: "essay"
date: "2026-08-10"
updated_date: "2026-08-10"
release_date: "2026-08-10"
release_time: "20:07"
summary: "A field note on five things you are actually choosing when you pick an AI coding harness — stack layers instead of benchmarks, attention cost instead of feel."
seo_description: "When you pick an AI coding tool you are not choosing a model — you are choosing a stack. This article walks the five layers (provider, routing, harness, control surface, repository) and explains why attention cost, not benchmarks, is what actually decides which tool you open."
audience:
  - "developers using AI coding agents"
  - "AI agent operators"
  - "engineering leads evaluating coding harnesses"
tags:
  - "agentic coding"
  - "Claude Code"
  - "Codex CLI"
  - "Hermes"
  - "T3 Code"
  - "model routing"
  - "tooling"
  - "developer experience"
credits:
  - "Ryan Spice"
accent: "#38bdfa"
image: "/img/articles/choosing-ai-coding-tool-when-model-isnt-the-product/tool-stack.svg"
image_alt: "Portrait stack diagram: model/provider at the bottom, compatibility/routing above, harness/runtime, control surface, and repository/tools at top. Claude Code, Codex CLI, and Hermes sit on the harness band; T3 Code on the control surface band; DeepSeek, GLM-5.2, Nemotron, MiMo, Claude, GPT on the model band."
image_credit: "Generated diagram concept by Ryan Spice"
image_position: "center center"
row_image: "/img/articles/choosing-ai-coding-tool-when-model-isnt-the-product/tool-stack-row.svg"
row_image_alt: "Horizontal stack diagram showing the five layers of an AI coding stack: model/provider, compatibility/routing, harness/runtime, control surface, repository/tools."
row_image_credit: "Generated diagram concept by Ryan Spice"
row_image_position: "center center"
references:
  - "T3 Code — open-source control plane for coding agents|https://github.com/pingdotgg/t3code"
  - "T3 Code website|https://t3.codes"
  - "Claude Code overview|https://code.claude.com/docs/en/overview"
  - "Codex CLI — ChatGPT/Codex documentation|https://developers.openai.com/codex/"
  - "OpenCode — open-source workbench CLI|https://github.com/sst/opencode"
related_posts:
  - "local-fugu-coding-harness"
---

# What a benchmark can't tell you

You are not choosing a model. You are choosing a stack. And a model benchmark measures exactly one layer of it.

The stack, top to bottom:

```
repository / tools
   ▲
control surface     T3 Code (web, desktop, mobile shell)
   ▲
harness / runtime   Claude Code · Codex CLI · Hermes · OpenCode
   ▲
compatibility / routing   Hermes lanes · AgentRouter · OpenCode route table
   ▲
model / provider    DeepSeek · GLM-5.2 · Nemotron · MiMo · Claude · GPT
```

A benchmark tells you how well a model answers a question — and as a starting point that is genuinely useful; I read them like everyone else. It just cannot tell you how much state you have to hold in your head, how many terminal windows you juggle, or whether you can recover after a crash without losing context. That is the real cost — attention, not tokens.

This is my personal system. Hermes, in particular, is my own profiles/routing/orchestration layer — a personal system with no public product behind it, built and rebuilt across several versions: the June 2026 Fugu harness I wrote about, the Sol/AgentRouter routing era, and the lane fleet I run today. These are field observations, not universal recommendations. Date-stamped: August 2026.

"Vibe" — that fuzzy word engineers throw around when a tool "feels right" — is not soft. It translates to four observable things: context visibility (can you see what the model sees, including its read of your repo?), session clutter (how many windows, panes, and background sessions does one task leave open?), tool transparency (do you know what each tool call does, or are you trusting a black box?), and recovery (after a crash or timeout, how cleanly can you get back to where you were?). The harness that makes these cheap to inspect is the one you will open.

## What I actually run in a week

Four workload shapes. That is more than most people need, and I know that. But it makes the later claims falsifiable:

- **Interactive debugging** — I spin up a throwaway agent, point it at a file, and iterate fast. This is where Claude Code's inline edits and Codex CLI's diff-loop feel tightest.
- **Multi-file features** — planning plus parallel edits across repos. Hermes profiles here, because the routing rules and verification step are explicit.
- **Research/orchestration** — routing a question through several model families and collecting the answer. This is Hermes' lane, by design.
- **Quick perspective on a folder** — open a repo cold, read the shape, and ship one change. Codex still feels most natural to me here, as a perception, not a verified capability claim.

For now, in my setup, T3 Code is becoming my main driver. Not because it is smarter. Because it costs me less attention per unit of work.

## Four tools, four reasons to still exist

**Claude Code** — a strong agentic harness with a rich ecosystem of extensions and hooks. I reach for it when I need broad tool compatibility and deep Anthropic integration. Keep this if you live in Claude's world and want the ecosystem to carry you.

**Codex CLI** — broad project and folder context, clean CLI semantics, profiles and MCP servers. It still feels natural for a cold read of a repo. Keep this if you want a CLI-first harness that respects your terminal workflow.

**Hermes** — explicit profiles, lane routing, dispatcher. This is my personal orchestration layer; profiles are named bundles of model route plus system prompt plus tool grants plus delegation rules. It spans the routing layer and the harness layer together. Keep this if you want to own the routing table and make the harness itself configurable.

**T3 Code** — a minimal GUI control surface. It wraps provider CLIs (Codex, Claude Code, Cursor, Grok, OpenCode) behind a Node WebSocket server, with a "bring-your-own-subscription" model. It has web, desktop, and mobile shells. T3 Code is a control surface, not a peer of the harnesses above — comparing it to Claude Code is like comparing a terminal emulator to bash. In my setup, T3 uses OpenCode as its default driver (OpenCode is an independent open-source workbench CLI with its own model routes, not a T3 fork). Keep this if you run many agents and want their sessions collapsed into one view.

## Why I'm drifting to T3 — and what it hasn't replaced

This is an attention-budget comparison, not a capability race. In my setup, T3 Code collapses terminal and session clutter: where I used to keep Claude Code, Codex CLI, and OpenCode each in its own terminal window, I now have one control surface with each running agent visible in a single view. That is the friction reducer.

I did not need a new model. I needed fewer windows to keep track of.

What T3 has not replaced:

- **Hermes orchestration** — multi-model routing with explicit verification rules stays on Hermes, by design. T3 never replaced that: it is a control surface doing a different job, not a routing layer.
- **Codex folder perspective** — cold reads of a repo still feel sharpest in Codex CLI.
- **Claude Code compatibility checks** — when I want the most dependable Anthropic-native check, I still drop into Claude Code directly.

The drift is real and partial. T3 is becoming my main driver, not my only one.

## The counterarguments I can't dismiss

**Churn tax.** Evaluation is itself a cost I keep paying. The dev who stayed on one tool all year probably out-shipped me.

**Familiarity confound.** "Feel" may be my own practice, not a property of the tool. From inside my own hands I cannot separate "this is easier" from "I have used this shape for months." You cannot either, from a blog post.

**Self-inflicted premise.** T3's value proposition only pays off if you run many agents. Most readers shouldn't start there. "Just use what your editor ships" is right for a real slice of developers — the ones who want a single harness and never need to think about routing. If you only run one model line, the stack layers collapse and the whole framing is overhead.

**Cost and provider access genuinely change the experience.** Subscription models, API access, and free tiers gate who can even try what. Cost is an axis deliberately not benchmarked here — no pricing claims, no numeric scores, no fake benchmark.

**Reliability beats feel.** My own experience with T3 Connect — T3 Code's tunnel for remote access — is evidence for that side.

## How to choose in one afternoon

Pick three fixed tasks on a repo you actually care about:

1. Fix a one-line bug — something with a clear reproduction.
2. Add a small feature — 2-3 files, some planning involved.
3. Audit a folder you have not read before — read, understand, and write a summary.

Run each task in one candidate tool only. Do not mix mid-task. Then observe:

- Can I see exactly what context the model sees? (context visibility)
- Do I have extra terminal windows or sessions hanging around? (session clutter)
- Do I know what each tool call is doing, or am I trusting a black box? (tool transparency)
- If a crash happens, can I recover without losing the plan? (recovery)

Choose based on friction, not features. The winner is the one that asks less of your attention.

- Choose **T3 Code** if you run multiple agents and want one surface to see them all.
- Choose **Codex CLI** if you want broad folder context and a terminal-native workflow.
- Choose **Claude Code** if you want the richest ecosystem and deepest Anthropic integration.
- Choose **Hermes** if you want to own the routing table, profiles, and orchestration rules yourself.

There is no universal winner. There is only the one whose stack layers cost you the least attention today.

*T3 Connect, T3 Code's tunnel for remote access, actually worked for me for a while. After some updates it stopped working in my current setup. I spent enough time debugging it to decide that, at least right now, turning T3 Connect into its own side project is not how I want to spend the afternoon. I didn't root-cause it, so I don't actually know what changed — that is a statement about my environment on this machine, not a claim that the feature is broken for everyone.*
