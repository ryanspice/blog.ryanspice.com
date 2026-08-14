---
title: "DeepSeek V4 Pro Went GA — I Wired It Into Everything"
seo_title: "DeepSeek V4 Pro 0813 GA — How I Wired It Into My AI Fleet"
slug: "deepseek-v4-pro-0813-ga-fleet"
status: "published"
draft_type: "field-note"
date: "2026-08-12"
updated_date: "2026-08-12"
publish_at: "2026-08-12T14:00"
release_date: "2026-08-12"
release_time: "14:00"
summary: "DeepSeek V4 Pro went GA on August 12, 2026. I spent the afternoon wiring it into every harness I use — Claude Code, the gateway picker, Fugu lanes, T3 Code — and let it review its own onboarding."
seo_description: "A field note on DeepSeek V4 Pro 0813 going GA — pricing, agent gains, and wiring it into Claude Code, the gateway, Fugu lanes, and T3 Code, including a Pro-review-of-its-own-onboarding loop."
accent: "#4f8ef7"
audience:
  - "developers evaluating AI coding tools"
  - "AI coding-agent operators"
  - "model-routing engineers"
tags:
  - "DeepSeek"
  - "model routing"
  - "Claude Code"
  - "Hermes"
  - "Fugu"
  - "T3 Code"
  - "coding agents"
credits:
  - "Ryan Spice"
references:
  - "OpenRouter — DeepSeek V4 Pro 0813|https://openrouter.ai/deepseek/deepseek-v4-pro-0813"
  - "Runtimewire — OpenRouter lists V4 Pro 0813 as GA|https://runtimewire.com/article/deepseek-v4-pro-0813-ga-api-rollout"
  - "DeepSeek Anthropic API guide|https://api-docs.deepseek.com/guides/anthropic_api"
  - "DeepSeek Claude Code integration|https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code"
related_posts:
  - "mimo-vs-deepseek-harness-matters"
  - "deepseek-v4-flash-0731-glm-5-2-kimi-k3"
---

# DeepSeek V4 Pro Went GA — I Wired It Into Everything

*A field note from August 12, 2026 — the day DeepSeek V4 Pro went general availability.*

## The release

On August 12, OpenRouter listed `deepseek/deepseek-v4-pro-0813` as the GA release of DeepSeek V4 Pro. DeepSeek quietly added it to the official API docs and pricing the same evening. The headline numbers:

- **$0.435 / $0.87 per million tokens** (input/output), with a $0.0036 cache-read rate
- **1M context window**, 384K max output
- Thinking and non-thinking modes, thinking on by default
- Large agent gains over the preview: DeepSWE 62.7 (+49.9), Terminal Bench 87.9 (+15.8), CyberGym 83.3, NL2Repo 61.5
- A posted warning that the price will go up

At that price it undercuts models in its reasoning class by a wide margin. The direct DeepSeek API auto-routes `deepseek-v4-pro` to the 0813 revision, so existing integrations pick up the GA for free. The sensible play was obvious: burn it in while it's cheap.

## The integration afternoon

I spent the afternoon wiring Pro into every harness I actually use:

**Claude Code picker.** `claudeseek` gained a Pro row in `/model` next to the Flash default — same 1M-context window. That surfaced a genuinely funny bug: the docs say `ANTHROPIC_CUSTOM_MODEL_OPTION` accepts comma-separated model lists, but the installed native build pushes the env var **verbatim as one row**. My two-model comma list rendered as a single merged "Flash,Pro" row. Reading the picker-assembly code in the bundle settled it — one custom row per session, so Pro gets the slot and Flash stays the default row.

**Unified gateway.** The local model gateway picked up a `claude-deepseek-pro` alias next to `claude-deepseek-flash` — one `/model` picker now spans eight routed models across NVIDIA, DeepSeek, AgentRouter, and MiMo.

**Fugu lanes.** The DeepSeek Pro worker lane finally got a fallback rotation like its siblings, and the OpenRouter chain gained a Pro hop just before the last-resort tier. Cost attestation learned the new slug and static price so every packet receipt prices Pro correctly.

**T3 Code / OpenCode.** Priced model entry plus a favorite, right beside the Flash bulk coder.

## The meta loop

The best part: I dispatched a DeepSeek Pro review of its own onboarding — a bounded review packet asking Pro to check the integration work for correctness. It flagged a real doc/code contradiction (the rotation diagram never got the new hop), a cost-attestation gap, and a couple of labeling decisions. All of them were fixed or explicitly adjudicated before anything shipped. Using the model to audit its own integration felt like the fleet working as designed.

## Where it lands

Flash stays the bulk core. Pro is the reasoning upgrade — mid-complexity coding, bounded reviews, thinking-heavy packets. One model, four surfaces, priced like a value pick. I expect the burn-in window to be short.
