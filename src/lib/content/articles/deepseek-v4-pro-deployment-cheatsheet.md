---
title: "DeepSeek V4 Pro Deployment Cheat Sheet"
seo_title: "DeepSeek V4 Pro Deployment Cheat Sheet — Integration Paths and Gotchas"
slug: "deepseek-v4-pro-deployment-cheatsheet"
status: "published"
draft_type: "technical-workflow-guide"
date: "2026-08-14"
updated_date: "2026-08-14"
publish_at: "2026-08-14T18:00"
release_date: "2026-08-14"
release_time: "18:00"
summary: "My personal operating reference for running DeepSeek V4 Pro through agent harnesses: routing policy, integration paths, and the gotchas that cost real money or real time — the temperature rule, the reasoning-content round-trip, and prefix-cache discipline."
seo_description: "A personal DeepSeek V4 Pro deployment cheat sheet: which model for which job, the Claude Code, Hermes, direct API, and OpenRouter paths, and eleven integration gotchas including thinking-mode temperature and reasoning_content preservation."
accent: "#8f9fff"
image: "/img/articles/deepseek-v4-pro-deployment-cheatsheet/deployment-paths-portrait.svg"
image_alt: "Portrait diagram of four DeepSeek V4 Pro integration surfaces — Claude Code, Hermes, direct API, OpenRouter — with the shared rules: reasoning effort max on agent lanes, thinking enabled, temperature 1.0."
image_credit: "Original diagram by Ryan Spice"
image_source: "/img/articles/deepseek-v4-pro-deployment-cheatsheet/deployment-paths-portrait.svg"
image_position: "center top"
row_image: "/img/articles/deepseek-v4-pro-deployment-cheatsheet/deployment-paths.svg"
row_image_alt: "Diagram of four DeepSeek V4 Pro integration surfaces — Claude Code, Hermes, direct API, OpenRouter — with a shared rule band."
row_image_credit: "Original diagram by Ryan Spice"
row_image_source: "/img/articles/deepseek-v4-pro-deployment-cheatsheet/deployment-paths.svg"
row_image_position: "center center"
audience:
  - "developers integrating DeepSeek into agent harnesses"
  - "AI coding-agent operators"
  - "model-routing engineers"
tags:
  - "DeepSeek"
  - "DeepSeek V4 Pro"
  - "Claude Code"
  - "Hermes"
  - "coding agents"
  - "model routing"
credits:
  - "Ryan Spice"
references:
  - "DeepSeek — Anthropic API guide|https://api-docs.deepseek.com/guides/anthropic_api"
  - "DeepSeek — Claude Code integration|https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code"
  - "DeepSeek — models and pricing|https://api-docs.deepseek.com/quick_start/pricing/"
  - "GLM-5.3, DeepSeek V4 Pro, and the harness between the numbers|/glm-5-3-deepseek-v4-pro-harnesses/"
  - "DeepSeek V4 Pro went GA — I wired it into everything|/deepseek-v4-pro-0813-ga-fleet/"
related_posts:
  - "glm-5-3-deepseek-v4-pro-harnesses"
  - "deepseek-v4-pro-0813-ga-fleet"
  - "deepseek-claude-code-windows-powershell"
  - "hermes-deepseek-setup"
---

# DeepSeek V4 Pro Deployment Cheat Sheet

*My personal operating reference for running DeepSeek V4 Pro (0813 GA) through agent harnesses. Personal practice, not vendor documentation — and not a benchmark.*

Most of this page is integration gotchas that apply to anyone wiring DeepSeek V4 Pro into Claude Code, Hermes, or a direct API: the thinking-mode temperature rule, the `reasoning_content` round-trip after tool calls, and the prefix-caching discipline that makes the cache-read price real. Pricing and behavior change; check the DeepSeek docs linked in the references before relying on any number here.

![Diagram of the four integration surfaces — Claude Code, Hermes, direct API, OpenRouter — and the two rules that travel with all of them.](/img/articles/deepseek-v4-pro-deployment-cheatsheet/deployment-paths.svg "The model is portable; the thinking and effort rules travel with it.")

## Routing policy (my default)

| Use case | Model | System prompt | reasoning_effort | thinking |
| --- | --- | --- | --- | --- |
| Claude Code primary (hard tasks) | `deepseek-v4-pro` | discipline prompt | max | enabled |
| Claude Code subagents | `deepseek-v4-flash` | default | max | enabled |
| Quick agent edits | `deepseek-v4-flash` | default | max | enabled |
| Architecture, refactors, audits | `deepseek-v4-pro` | discipline prompt | max | enabled |
| Explicit non-agent chat | `deepseek-v4-pro` | discipline prompt | high | enabled |

My policy: every coding-agent and delegation call uses maximum reasoning. Flash keeps the compact default prompt but never disables or lowers thinking. `high` is reserved for an explicitly requested non-agent chat.

**Evidence status — unmeasured.** These are judgment calls from my own fleet work, not benchmark findings. I have not published a controlled A/B with matched prompts and captured results, so do not cite this policy as measured.

## Integration paths

**Claude Code.** The Anthropic-compatible endpoint routes Claude Code's protocol; the model is selected by env config, with a 1M context window. The discipline prompt is delivered as a **user-message prefix on your first message**, never in `CLAUDE.md` — project instructions propagate to subagents, and the whole point is that subagents run the compact prompt. See [Run Claude Code Through DeepSeek on Windows PowerShell](/deepseek-claude-code-windows-powershell/) for the full setup.

**Hermes.** Profiles hold the provider and the effort setting. Standing lead discipline lives in `SOUL.md`. One trap: `hermes -p <profile> chat` is a **fresh lead, not a subagent** — it auto-injects SOUL.md, AGENTS.md, and memory, and neither `-Q` nor `-q` suppresses that. Worker calls should use `--ignore-rules` and take their context from the prompt packet instead. (Quiet flags also drop skills and memory, so the packet must carry what the worker needs.)

**Direct API.** OpenAI-compatible endpoint, thinking enabled, `temperature 1.0`. The JSON example under Quick start below.

**OpenRouter.** The GA slug is `deepseek/deepseek-v4-pro-0813`, with the $0.0036/M cache-read rate and DeepSeek's automatic prefix caching.

## The gotchas that cost real time or real money

1. **Temperature = 1.0 for thinking mode.** DeepSeek thinking mode requires `temperature=1.0`, `top_p=1.0`. Lower temperatures collapse the reasoning trace and degrade quality. Control output length with `max_tokens`, not temperature.

2. **`reasoning_content` must round-trip.** After any tool call, DeepSeek's reasoning trace must be passed back in the next request. Drop it and you get HTTP 400. Claude Code and Hermes handle this automatically; custom orchestration must preserve it.

3. **Don't use `cache_control`.** DeepSeek's Anthropic endpoint ignores `cache_control` breakpoints. DeepSeek does its own automatic disk caching based on prefix matching — keep your system prompt byte-stable to maximize cache hits (the cache-read price is ~100x the miss price).

4. **Anti-flattery is mandatory.** V4 models default to sycophantic, hasty responses. The discipline prompt carries explicit anti-flattery directives; removing them costs accuracy.

5. **Verify before answering.** V4 tends to answer before checking. The same prompt set carries verify-before-answering rules.

6. **No generic boilerplate.** "You are a helpful assistant" measurably hurts DeepSeek thinking accuracy (roughly 6 points on GPQA in my reading of the surrounding evidence). Task-specific prompts only.

7. **`max` auto-injects a prefix.** When `reasoning_effort=max`, DeepSeek auto-injects a "Reasoning Effort: Absolute maximum with no shortcuts permitted..." prefix. Don't duplicate it in your system prompt — it's already there.

8. **Images don't work on the Anthropic endpoint.** No image or document content. Use text descriptions or a multimodal model for image tasks.

9. **Pro vs Flash.** Pro (1.6T params, 49B activated) is for hard tasks — architecture, debugging. Flash (284B, 13B activated) is for simple tasks — formatting, docs, subagents. Don't waste Pro on small edits; don't use Flash for hard problems.

10. **Use `reasoning_effort` correctly.** `max` for every coding agent, worker, reviewer, and delegate. `high` only for explicitly requested non-agent, latency-sensitive chat. DeepSeek exposes only `high` and `max`.

11. **The discipline prompt is for the lead, not the subagents.** Pro leads run the full prompt; Flash subagents run the default prompt at max effort. Prompt size and reasoning effort are separate controls.

## Quick start

**Path A — Claude Code.**

1. Set the environment variables from the [Claude Code integration guide](https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code).
2. Start `claude` in your repository.
3. Paste the discipline prompt as your first user message.
4. Ask your question.

**Path C — Direct API.**

```json
POST https://api.deepseek.com/v1/chat/completions
{
  "model": "deepseek-v4-pro",
  "messages": [
    {"role": "system", "content": "<discipline prompt>"},
    {"role": "user", "content": "your question"}
  ],
  "temperature": 1.0,
  "top_p": 1.0,
  "max_tokens": 8192,
  "reasoning_effort": "max",
  "extra_body": {"thinking": {"type": "enabled"}}
}
```

## Sources

The integration facts come from [DeepSeek's Anthropic API guide](https://api-docs.deepseek.com/guides/anthropic_api), the [Claude Code integration guide](https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code), and the [models and pricing page](https://api-docs.deepseek.com/quick_start/pricing/). The policy choices are mine; the evidence status is stated above rather than implied. This page was published alongside [GLM-5.3, DeepSeek V4 Pro, and the harness between the numbers](/glm-5-3-deepseek-v4-pro-harnesses/), which explains why harness configuration matters more than the launch tables suggest.
