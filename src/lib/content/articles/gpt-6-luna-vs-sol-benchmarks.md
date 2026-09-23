---
title: "Is GPT-6 Luna as Smart as Sol? The Benchmark Says: Sometimes"
seo_title: "GPT-6 Luna vs Sol: What the Benchmarks Actually Show"
slug: "gpt-6-luna-vs-sol-benchmarks"
status: "published"
draft_type: "research-note"
date: "2026-09-23"
updated_date: "2026-09-23"
release_date: "2026-09-23"
release_time: "09:00"
summary: "A Reddit post says Luna Max can rival Sol High on DeepSWE. OpenAI's wider benchmark results show a narrower truth: near-parity on one hard coding test, lower task cost, and meaningful gaps elsewhere."
seo_description: "GPT-6 Luna Max approaches Sol on DeepSWE at a fraction of the cost, but does that mean Luna is as smart as Sol? A source-linked read of OpenAI's charts, launch details, and early coverage."
eyebrow: "Model news"
image: "/img/articles/gpt-6-luna-vs-sol-benchmarks/model-cost-frontier.png"
image_alt: "A large luminous AI network connected to a smaller network, illustrating overlapping capabilities at different scales"
image_credit: "Generated editorial visual by Codex using ImageGen"
image_source: "/img/articles/gpt-6-luna-vs-sol-benchmarks/model-cost-frontier.png"
image_position: "center center"
row_image: "/img/articles/gpt-6-luna-vs-sol-benchmarks/model-cost-frontier.png"
row_image_alt: "Two luminous AI networks of different sizes connected across a dark background"
row_image_credit: "Generated editorial visual by Codex using ImageGen"
row_image_source: "/img/articles/gpt-6-luna-vs-sol-benchmarks/model-cost-frontier.png"
accent: "#6574cd"
audience:
  - "AI-assisted developers"
  - "model-routing practitioners"
  - "technical product teams"
tags:
  - "GPT-6"
  - "Luna"
  - "Sol"
  - "AI benchmarks"
  - "model pricing"
credits:
  - "Ryan Spice"
references:
  - "OpenAI — Introducing GPT-6 Sol and Luna|https://openai.com/index/introducing-gpt-6-sol-and-luna/"
  - "Reddit — Luna Max vs. Sol High on DeepSWE|https://www.reddit.com/r/ChatGPT/comments/1wnielg/gpt_6_luna_max_scores_as_high_as_gpt_6_sol_high/"
  - "Digital Applied — GPT-6 Sol and Luna: API prices, benchmarks and trade-offs|https://www.digitalapplied.com/blog/gpt-6-sol-luna-launch-pricing-benchmarks-2026"
  - "Artificial Analysis — GPT-6 Sol and Luna push the cost efficiency frontier|https://artificialanalysis.ai/articles/gpt-6-sol-and-luna-push-the-cost-efficiency-frontier"
  - "OpenAI API pricing|https://developers.openai.com/api/docs/pricing"
  - "9to5Mac — OpenAI upgrading ChatGPT and Codex with two more GPT-6 models|https://9to5mac.com/2026/09/22/openai-upgrading-chatgpt-and-codex-with-two-more-gpt-6-models/"
---

# Is GPT-6 Luna as Smart as Sol? The Benchmark Says: Sometimes

A Reddit post made the new GPT-6 lineup easy to read: Luna Max can score about as high as Sol High on DeepSWE, while costing less per run. The post's title says three times cheaper than Sol and 7.3 times cheaper than Astra on that benchmark. It is a sharp comparison—and a good reason to look more closely at the launch charts. The Reddit image was not available for independent inspection here, so those exact effort-level cost ratios remain attributed to the post. They are not proof that Luna and Sol are equally capable at everything.

The more useful conclusion is smaller and more interesting: on at least one demanding software-engineering benchmark, the cheaper model gets close enough that many teams should test it first.

## What the Reddit chart actually compares

The post points to DeepSWE 1.1, a benchmark of long-horizon software-engineering tasks in real codebases. OpenAI reports GPT-6 Luna at max reasoning scoring 66.6% and GPT-6 Sol at max scoring 68.8%. The Reddit image compares Luna Max with Sol High and Astra Low. The gap between the published max-effort scores is narrow enough to make the headline plausible for this particular test.

But three details matter. First, “as high as” is a score comparison at selected effort settings, not a claim of identical capability. Second, effort settings are not universal units of compute or intelligence. Third, benchmark scores summarize a test suite, not every task a developer might hand to a coding agent.

So the Reddit post is best read as a routing suggestion: try Luna Max when the work resembles DeepSWE and cost matters. It is not a general-purpose model ranking.

## The launch story is about economics

OpenAI’s September 22 announcement describes Sol and Luna as more affordable versions that carry methods developed for GPT-6 Astra into lower-cost models. The API prices were cut by half relative to GPT-5.6 promotional pricing: Sol is listed at $2 per million input tokens and $10 per million output tokens; Luna at $0.10 and $0.50.

Those token prices are not the same as cost per completed task. The work can take different numbers of tokens, and benchmark runs include the particular harness and prompting used in the evaluation. That is why the task-cost figures are helpful—but should stay attached to the benchmark that produced them.

On DeepSWE, OpenAI reports Luna Max at $0.22 per task and Sol Max at $2.74. Luna’s score is 2.2 percentage points lower, with a task cost roughly one-twelfth as high in that setup. That is a striking performance-per-dollar result. It still does not tell us whether Luna will be one-twelfth as expensive on your repository, or whether your evaluation harness will reproduce the score.

## Across the chart, Luna is not simply “Sol for less”

The launch numbers show a capable smaller model, with clear differences by task:

| OpenAI evaluation | GPT-6 Luna best | GPT-6 Sol best | Read it as |
| --- | ---: | ---: | --- |
| DeepSWE 1.1 | 66.6% | 68.8% | Close scores on long software tasks; Luna’s reported task cost is much lower. |
| FrontierCode 1.1 | 42.4% | 49.3% | A wider gap on code judged for mergeability. |
| Agents’ Last Exam | 50.9% | 56.4% | Sol leads on long professional workflows. |
| OSWorld 2.0 offline | 52.7% | 64.4% | Sol has a larger advantage on computer-use tasks. |
| AutomationBench | 20.7% | 33.2% | Different levels of performance on cross-app business workflows. |

These are each model’s reported best settings, so the table is a compact orientation rather than a controlled comparison at one common effort level. OpenAI says Astra remains its strongest model overall. It also says Luna Max exceeds GPT-5.6 Sol Medium on OSWorld at one-tenth the task cost—another useful generational comparison, but not a Sol-versus-Luna tie.

The practical picture is a curve, not a ladder rung: Luna gets surprisingly close in some demanding work and remains behind on other tests. Sol buys more headroom on several agentic tasks. Astra sits above both in OpenAI’s positioning when the strongest result matters more than price.

## A caveat from the first wave of coverage

Digital Applied’s early chart analysis notes that a few launch comparisons depend on which competitor setting is selected. For example, OpenAI’s FrontierCode text compares Sol with Claude Fable 5.1 at xhigh, which is that model’s lowest score in the chart; its low setting scores slightly higher than Sol’s best. That does not erase Sol’s cost advantage in the cited comparison, but it is a reminder to inspect the full chart rather than repeat the launch headline.

The same analysis found GPT-5.6 Sol still had higher best scores than GPT-6 Sol on two charts, DeepSWE and OSWorld, though at more than twice the task cost in those settings. Early launch coverage has focused on this same tension: the new story is clearly lower cost, while score improvements depend on the benchmark and comparison point.

## A sensible way to route the work

If you build with models, test Luna Max against a small set of your own representative tasks. Include successful and failed cases, measure completion quality and human correction time, and track both token spend and end-to-end task cost. For coding, include whether the patch passes tests and is actually reviewable—not just whether the agent produced a plausible diff.

A practical starting rule could be:

- **Luna:** high-volume, well-scoped tasks where a small miss is easy to catch and retry.
- **Sol:** longer or more connected work where stronger performance across several agentic benchmarks can save review and repair time.
- **Astra:** work where top-end capability is worth the additional spend.

Treat that as a hypothesis to validate, not a vendor-neutral law. Your model version, reasoning effort, tool access, prompt, codebase and acceptance criteria all change the result.

## What I verified

I checked the Reddit post title and its cited OpenAI announcement, compared the published benchmark figures and task costs against launch-day chart analysis, and reviewed early release coverage. The Reddit preview image was blocked by its CDN; the precise Sol High and Astra Low cost ratios are therefore attributed to the post rather than independently checked. The benchmark results and prices are provider-reported. I did not run a matched Luna-versus-Sol test on an independent task set, so the evidence supports “near-parity on DeepSWE at selected settings,” not “equal intelligence overall.”

The Reddit post caught a real and useful result. Its broader lesson is about access: if a lower-cost model can approach a stronger model on the task you actually need, the right question is no longer only which one wins a benchmark. It is how much capability your workflow needs—and what it costs to get a reliable result.
