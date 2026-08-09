---
title: "DeepSeek V4 Flash 0731: The Fast Lane Beside GLM-5.2 and Kimi K3"
seo_title: "DeepSeek V4 Flash 0731 vs GLM-5.2 and Kimi K3"
slug: "deepseek-v4-flash-0731-glm-5-2-kimi-k3"
status: "draft"
draft_type: "research-note"
date: "2026-07-31"
updated_date: "2026-07-31"
summary: "DeepSeek's latest public API release is V4 Flash 0731. Here is what changed, how its V4 Pro sibling compares with GLM-5.2 and Kimi K3, and why the benchmark chart needs a cost-and-harness warning label."
seo_description: "A source-backed comparison of DeepSeek V4 Flash 0731, DeepSeek V4 Pro, GLM-5.2, and Kimi K3 across agent benchmarks, context, model footprint, and Artificial Analysis Intelligence Index results."
accent: "#6f86ff"
image: "https://images.pexels.com/photos/33349204/pexels-photo-33349204.jpeg?auto=compress&cs=tinysrgb&w=2000"
image_alt: "Dark developer workspace with code on multiple screens"
image_credit: "Pexels stock photo"
image_source: "https://www.pexels.com/photo/modern-programmer-workspace-with-digital-code-33349204/"
image_position: "center center"
row_image: "/img/articles/deepseek-v4-flash-0731/model-intelligence-index.svg"
row_image_alt: "Bar chart comparing Kimi K3, GLM-5.2, and DeepSeek V4 Pro on the Artificial Analysis Intelligence Index v4.1."
row_image_credit: "Redrawn by Ryan Spice from Artificial Analysis data"
row_image_source: "https://artificialanalysis.ai/articles/kimi-k3-achieves-3-in-the-artificial-analysis-intelligence-index-comparable-to-opus-4-8-and-gpt-5-5/"
row_image_position: "center center"
background_image: "https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&cs=tinysrgb&w=1800"
background_image_alt: "Server racks and cables in a data center"
background_image_credit: "Brett Sayles / Pexels"
background_image_source: "https://www.pexels.com/photo/server-racks-on-data-center-5480781/"
background_image_position: "center center"
audience:
  - "developers evaluating AI APIs"
  - "AI coding-agent operators"
  - "technical leads comparing open-weight models"
  - "model-routing engineers"
tags:
  - "DeepSeek"
  - "DeepSeek V4"
  - "GLM-5.2"
  - "Kimi K3"
  - "AI benchmarks"
  - "coding agents"
  - "model routing"
credits:
  - "Ryan Spice"
  - "DeepSeek, Z.ai, Moonshot AI, and Artificial Analysis public documentation"
references:
  - "DeepSeek API change log: V4 Flash 0731 update|https://api-docs.deepseek.com/updates/"
  - "DeepSeek API models and pricing|https://api-docs.deepseek.com/quick_start/pricing/"
  - "DeepSeek V4 preview release|https://api-docs.deepseek.com/news/news260424/"
  - "Artificial Analysis: Kimi K3 Intelligence Index comparison|https://artificialanalysis.ai/articles/kimi-k3-achieves-3-in-the-artificial-analysis-intelligence-index-comparable-to-opus-4-8-and-gpt-5-5/"
  - "Artificial Analysis: GLM-5.2 Intelligence Index comparison|https://artificialanalysis.ai/articles/glm-5-2-is-the-new-leading-open-weights-model-on-the-artificial-analysis-intelligence-index/"
  - "Z.ai: GLM-5.2 built for long-horizon tasks|https://z.ai/blog/glm-5.2"
  - "Moonshot AI: Kimi K3 model repository and evaluation table|https://github.com/MoonshotAI/Kimi-K3"
  - "Pexels programmer workspace photo|https://www.pexels.com/photo/modern-programmer-workspace-with-digital-code-33349204/"
  - "Pexels server-room photo|https://www.pexels.com/photo/server-racks-on-data-center-5480781/"
  - "Pexels license|https://www.pexels.com/license/"
related_posts:
  - "deepseek-claude-code-windows-powershell"
  - "glm-5-2-hermes-cloudflare-workers-ai-delegation"
  - "glm-5-2-long-context-search-exposure"
  - "agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns"
---

> [!status-brief] Current read
>
> **Clean read.** DeepSeek V4 Flash 0731 is the latest public API release as of July 31, 2026. It is a post-trained refresh of the Flash preview with a serious agent-coding push, not a new model family that makes V4 Pro disappear.
>
> **Operator read.** Use Flash for cheap, fast agent loops. Use V4 Pro, GLM-5.2, or Kimi K3 when the task is expensive enough that a stronger reasoning run is cheaper than recovering from a weak one.

# DeepSeek V4 Flash 0731: The Fast Lane Beside GLM-5.2 and Kimi K3

DeepSeek's newest API release landed on July 31, 2026, with a name that tells you almost everything important: **DeepSeek-V4-Flash-0731**.

This is the fast lane of the V4 family. DeepSeek says the public-beta release keeps the same architecture and size as V4 Flash Preview and is “only re-post-trained.” The meaningful change is the agent surface: the release notes report large gains on coding and tool-use evaluations, and the model now natively supports the Responses API with a configuration adapted for Codex.

That makes the release more interesting for builders than for leaderboard spectators. The question is not simply “is this the smartest model?” It is “which model should sit in which part of the loop?”

![A developer workspace with code across multiple screens, used as a stock photo for the model-routing discussion.](https://images.pexels.com/photos/33349204/pexels-photo-33349204.jpeg?auto=compress&cs=tinysrgb&w=1600 "Stock photo via Pexels: developer workspace with code.")

## The short version

DeepSeek V4 Flash 0731 is the latest public DeepSeek API model, but the cleanest public comparison with GLM-5.2 and Kimi K3 still uses **DeepSeek V4 Pro**. Artificial Analysis has a common Intelligence Index snapshot for those three models; it does not yet put the July 31 Flash refresh on that same chart.

| Model | Artificial Analysis Intelligence Index v4.1 | Context | Model footprint | Artificial Analysis cost per task |
| --- | ---: | ---: | --- | ---: |
| Kimi K3 | 57 | 1M tokens | 2.8T total / 104B active | $0.94 |
| GLM-5.2 | 51 | 1M tokens | 744B total / 40B active | $0.32 |
| DeepSeek V4 Pro | 44 | 1M tokens | 1.6T total | $0.04 |

The index and cost figures above are the July comparison published by Artificial Analysis. They are useful as a directional snapshot, not as a universal truth table. Kimi K3 is evaluated through a different model stack than DeepSeek's official Flash release, and the cost-per-task estimate is not the same thing as a provider's input/output price card.

![Bar chart comparing Kimi K3, GLM-5.2, and DeepSeek V4 Pro on the Artificial Analysis Intelligence Index v4.1.](/img/articles/deepseek-v4-flash-0731/model-intelligence-index.svg "Source: Artificial Analysis, July 17, 2026. The chart is redrawn for this article.")

The shape is still useful. Kimi K3 is six index points ahead of GLM-5.2 and thirteen ahead of DeepSeek V4 Pro. GLM-5.2 sits in the middle as the balanced open-weight option. DeepSeek V4 Pro is the outlier on cost: a lower composite score in this snapshot, but an unusually low estimated cost per completed task.

## What actually changed in DeepSeek V4 Flash 0731?

The official DeepSeek update reports these results for the new public-beta Flash model:

- Terminal-Bench 2.1: **82.7**
- NL2Repo: **54.2**
- Cybergym: **76.7**
- DeepSWE: **54.4**
- Toolathlon verified: **70.3**
- Agent Last Exam: **25.2**
- AutomationBench Public: **25.1**

Those are useful signals, especially because they are aimed at the work an agent actually has to do: edit a repository, use tools, recover from intermediate state, and complete a longer chain. But they are not interchangeable with the Artificial Analysis Index numbers above. DeepSeek used its own harness configuration for the public code-agent sets, with maximum effort, `top_p=0.95`, and `temperature=1.0`. The benchmark, harness, effort level, and evaluator all matter.

The API shape is practical. Flash has a 1M-token context, up to 384K output, tool calls, JSON output, both thinking and non-thinking modes, and an Anthropic-compatible endpoint. The current price card lists $0.14 per million input tokens on a cache miss and $0.28 per million output tokens. DeepSeek also lists a 2,500-request concurrency limit for Flash, compared with 500 for V4 Pro.

That is the part I would pay attention to: Flash looks designed to be used repeatedly. It is cheap enough to run as a lead, planner, search worker, or retry lane without turning every small edit into a budget event.

## GLM-5.2 is the middleweight with long legs

GLM-5.2 is not merely “the model between DeepSeek and Kimi” because its score lands between them. Z.ai built it around long-horizon work, a stable 1M-token context, flexible reasoning effort, and an MIT license.

Artificial Analysis gives GLM-5.2 a 51 on the same Intelligence Index used for the chart. Its June report also gives it a GDPval-AA v2 score of 1524 and a Terminal-Bench 2.1 score of 78 in that comparison. Z.ai's own release post reports 81.0 on Terminal-Bench 2.1 under its Claude Code setup and 62.1 on SWE-bench Pro.

The difference between those two Terminal-Bench numbers is not necessarily a contradiction. It is a reminder that benchmark labels do not remove harness differences. If I were routing a long-running coding task today, GLM-5.2 would be a strong choice when the task benefits from a big context window, careful structural reasoning, and an open-weight deployment path.

![Server racks and cabling in a data center, used as a stock photo for the infrastructure cost behind frontier-model serving.](https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&cs=tinysrgb&w=1600 "Stock photo by Brett Sayles via Pexels: server racks in a data center.")

The catch is token appetite. Artificial Analysis measured GLM-5.2 at roughly 43,000 output tokens per Intelligence Index task, compared with about 37,000 for DeepSeek V4 Pro in the same analysis. A model can be cheaper per token and still be expensive per successful task if it thinks aloud for a long time or needs many tool turns.

## Kimi K3 wins the chart, then sends the infrastructure bill

Kimi K3 is the strongest model in this three-point Intelligence Index snapshot at 57. Artificial Analysis reports 1668 Elo on GDPval-AA v2 and a $0.94 estimated cost per Intelligence Index task. Moonshot's current repository describes a 2.8T-parameter mixture-of-experts model with 104B active parameters, a 1M context window, native image input, and released weights under the Kimi K3 license.

That combination matters. K3 is not just a hosted chatbot contender; it is now a model an operator can evaluate for local or private serving, assuming the hardware and inference stack are real rather than aspirational. The larger footprint also explains why “highest score” is not the same decision as “best default.”

K3 is the model I would reach for when the task is genuinely hard, long-running, and expensive to get wrong: a multi-repository migration, a difficult research synthesis, or an agent loop where the cost of a bad first plan is several hours of human cleanup. I would not use it as the default autocomplete engine for every small edit.

## Where I would route the work

| Workload | First model I would try | Why |
| --- | --- | --- |
| Fast coding loop, search worker, retry, or low-cost planner | DeepSeek V4 Flash 0731 | Latest agent-tuned release, 1M context, low API price, high concurrency |
| Long-horizon codebase work with an open deployment path | GLM-5.2 | Strong middle position, 1M context, flexible effort, MIT license |
| Hardest reasoning or agentic task where quality dominates token cost | Kimi K3 | Highest score in the common snapshot, multimodal input, released weights |
| Cost-sensitive strong reasoning baseline | DeepSeek V4 Pro | Lower composite score in the snapshot, but exceptional estimated cost per task |

This is also a good case for a two-stage architecture: let Flash do the cheap discovery and repository mapping, then escalate only the compact problem packet to GLM-5.2 or K3. The expensive model should solve the expensive part. It should not spend its context budget rereading directory listings that a cheaper worker could have summarized.

## The benchmark warning label

The chart is intentionally small because a larger leaderboard can create false precision. Artificial Analysis' Intelligence Index is a composite across several evaluations, and each vendor's own benchmark post uses its own harness, sampling, maximum output, and sometimes private or internal tasks.

There is another moving target: model status. DeepSeek's July 31 release notes say V4 Flash 0731 is the model that changed, while V4 Pro and the app/web models were unchanged. The chart therefore uses V4 Pro as the stable public comparison point. A future Artificial Analysis entry for Flash may move the DeepSeek bar; this article should not pretend that the current chart has already measured it.

The honest conclusion is more useful than a winner announcement:

- **DeepSeek V4 Flash 0731** is the practical throughput play.
- **GLM-5.2** is the balanced long-context and open-deployment play.
- **Kimi K3** is the quality-first play, with a larger serving footprint.
- **DeepSeek V4 Pro** remains the cost-efficiency reference point in the current public comparison.

The newest model is not automatically the model to use everywhere. The better move is to give each model a job, measure the completed task rather than the demo answer, and keep the escalation path explicit.

## Sources and method

The release and API details come from [DeepSeek's July 31 change log](https://api-docs.deepseek.com/updates/), [DeepSeek's models and pricing page](https://api-docs.deepseek.com/quick_start/pricing/), and the [V4 preview release note](https://api-docs.deepseek.com/news/news260424/). The comparison points come from [Artificial Analysis' Kimi K3 comparison](https://artificialanalysis.ai/articles/kimi-k3-achieves-3-in-the-artificial-analysis-intelligence-index-comparable-to-opus-4-8-and-gpt-5-5/) and its [GLM-5.2 comparison](https://artificialanalysis.ai/articles/glm-5-2-is-the-new-leading-open-weights-model-on-the-artificial-analysis-intelligence-index/). Model architecture and current weight-availability details come from [Z.ai's GLM-5.2 release](https://z.ai/blog/glm-5.2) and the [Moonshot AI Kimi K3 repository](https://github.com/MoonshotAI/Kimi-K3).

The two editorial photographs are stock photos from [Pexels](https://www.pexels.com/license/), credited at the image locations and in the article metadata. The chart is a local SVG redrawn from Artificial Analysis' July 17, 2026 three-model snapshot so the article has a stable, accessible visual rather than depending on a live leaderboard screenshot.
