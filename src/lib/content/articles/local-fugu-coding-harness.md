---
title: "My Fugu/Fusion Harness Now Has One Conductor and Three Real Reviewers"
seo_title: "My 2026 Fugu/Fusion Coding Harness: GPT-5.6, Nemotron, DeepSeek, and GLM"
slug: "local-fugu-coding-harness"
status: "published"
draft_type: "build-log"
date: "2026-07-12"
updated_date: "2026-07-12"
release_date: "2026-07-12"
release_time: "16:00"
audience:
  - "developers building multi-model coding workflows"
  - "AI agent operators"
  - "local-LLM tinkerers"
tags:
  - "multi-agent"
  - "orchestration"
  - "Fugu"
  - "Fusion"
  - "Hermes"
  - "GPT-5.6"
  - "Nemotron"
  - "DeepSeek"
  - "GLM-5.2"
  - "local LLM"
  - "model routing"
  - "coding agents"
  - "verification"
related_posts:
  - "local-fugu-coding-harness-june-2026"
  - "nvidia-nemotron-3-ultra-hermes-agent-production-setup"
  - "glm-5-2-hermes-cloudflare-workers-ai-delegation"
  - "agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns"
credits:
  - "Ryan Spice"
  - "OpenAI Codex"
accent: "#a3e635"
image: "/img/articles/local-fugu-coding-harness/fugu-codex-focal-1200.webp"
image_alt: "A conductor console routing planning, implementation, verification, and local review lanes."
image_credit: "Generated raster visual by Ryan Spice / Codex"
image_position: "center center"
row_image: "/img/articles/local-fugu-coding-harness/fugu-codex-focal-1200.webp"
row_image_alt: "A multi-model coding harness organized around one conductor and bounded specialist lanes."
row_image_credit: "Generated raster visual by Ryan Spice / Codex"
row_image_position: "center center"
background_image: "/img/articles/local-fugu-coding-harness/fugu-memory-audit-loop.svg"
background_image_alt: "A verification loop connecting model workers, deterministic evidence, and human review."
background_image_credit: "Generated SVG diagram by Ryan Spice / Codex"
background_image_position: "center center"
further_reading:
  - "The June 2026 harness (archived)|/local-fugu-coding-harness-june-2026/"
  - "NVIDIA Nemotron 3 Ultra in Hermes|/nvidia-nemotron-3-ultra-hermes-agent-production-setup/"
  - "GLM-5.2 in Hermes|/glm-5-2-hermes-cloudflare-workers-ai-delegation/"
summary: "I rebuilt my Fugu/Fusion coding harness around the models that are actually available: GPT-5.6 Sol conducts, Fugu executes through bounded specialist lanes, and a three-model remote Fusion panel reviews important work before the conductor decides."
seo_description: "A practical build log for a GPT-5.6 Sol Fugu/Fusion coding harness using Nemotron, DeepSeek, GLM-5.2, Spark, Terra, Luna, VibeThinker, and an explicit local Gemmable lane."
---

# My Fugu/Fusion Harness Now Has One Conductor and Three Real Reviewers

> [!status-brief]
> **Current setup, July 12, 2026:** GPT-5.6 Sol is the single conductor and final judge. Fugu is the execution pipeline. Fusion is the independent remote review panel. Local models are optional queued reviewers, never a dependency for the normal path.
>
> This article replaces my [June 2026 Fugu/Fusion harness write-up](/local-fugu-coding-harness-june-2026/). I preserved that version because it shows the earlier design honestly, but its model map is no longer operationally correct.

The first version of my harness had the right instinct and the wrong roster.

It separated planning, implementation, verification, and final judgment. That part held up. The configuration around it did not. The conductor's identity was inconsistent, a retired local model was still treated as structurally important, Claude remained in the active map after it stopped being available, and GLM-5.2 was parked at the edge instead of being used where it was actually valuable.

I have now rebuilt the system around the models I actually have.

The new rule is simple:

```text
one conductor
-> bounded specialist execution
-> evidence first
-> independent review when the risk earns it
-> one final decision
```

That sounds less exciting than “a swarm of agents.” Good. It is also much easier to operate.

## The new operating model

There are three layers, and they have different jobs.

| Layer | Owner | Job |
|---|---|---|
| **Conductor** | GPT-5.6 Sol | Classify, route, synthesize, and make the final call. |
| **Fugu execution** | Nemotron, Spark, Flash, Pro, Terra, Luna, and guarded GLM | Plan and perform bounded work with an independent verifier. |
| **Fusion review** | Nemotron 3 Ultra, DeepSeek V4 Pro, and NVIDIA GLM-5.2 | Produce independent reviews for important decisions; GPT-5.6 Sol judges the panel. |

The conductor does not compete with the panel. Nemotron and GLM do not become alternate leads halfway through the run. GPT-5.6 Sol owns decomposition and the final synthesis from start to finish.

That fixed the largest conceptual problem in the old setup: several strong models were implicitly fighting for the same role.

## Fugu is the execution pipeline

Fugu is how normal delegated work moves through the system.

```text
GPT-5.6 Sol conductor
-> Nemotron plan or rank, when planning is needed
-> Spark, Flash, Terra, or a lead worker implements
-> a capable model from another family reviews
-> deterministic checks settle what they can
-> GPT-5.6 Sol judges the evidence
```

The roles are intentionally boring:

| Lane | Model shape | Use it for |
|---|---|---|
| `thinker` | Nemotron 3 Ultra | Architecture, decomposition, ranking, tradeoffs, and blind spots. |
| `worker-spark` | GPT-5.3 Codex Spark | Fast bounded implementation and exact patch maps. |
| `worker-flash` | DeepSeek Flash | Directed, output-heavy implementation, checks, and cross-family review. |
| `worker-lead` | GPT lead lane | Larger multi-file work when one worker needs broader ownership. |
| `worker-terra` | GPT Terra | Everyday scoped implementation and exploration. |
| `aux-luna` | GPT Luna | Extraction, mechanical summaries, and compact support work. |
| `review-pro` / `synthesis-pro` | DeepSeek Pro | Risky review and deeper research synthesis. |
| `glm` | GLM-5.2 | One-shot lead-programmer review or an alternative implementation strategy. |

This is not a fixed ceremony for every task. A one-line change can stay with the conductor. A meaningful architecture fork can go through the full sequence. The conductor spends coordination only when the risk justifies it.

## Fusion is a review panel, not another coding loop

Fusion now has three remote seats:

1. **Nemotron 3 Ultra** for architecture, ranking, and blind spots.
2. **DeepSeek V4 Pro** for deep review and a genuinely different reasoning path.
3. **NVIDIA GLM-5.2** for lead-programmer judgment and alternative implementation strategy.

GPT-5.6 Sol is the judge.

I deliberately did not add another GPT panelist. The conductor already represents that family. Repeating the same family inside the panel would spend another seat without buying the same amount of disagreement.

Fusion is for decisions where independent attempts are useful: architecture forks, canon choices, release-risk reviews, and important implementation plans. It is not the default response to every code edit.

The practical distinction is:

```text
Fugu  = plan and execute the work
Fusion = independently review the consequential decision
```

For epic work, I can run Fugu first and send the resulting evidence packet through Fusion afterward. The panel reviews the artifact and its proof, not a giant raw transcript.

## The local tier no longer blocks the remote path

I still want local reviewers. I no longer pretend they belong in every run.

**VibeThinker** is the cheap CPU skeptic. It is good for a small plan, a patch map, or one suspicious assumption. It runs through a single queue and receives compact context. It does not get a fully loaded agent profile because that degrades a small fed-context model.

**Gemmable** is back, but only as a critical/private divergent reviewer. It occupies the GPU, so it is explicit-only, queued, and serial. It never runs in parallel with another local inference job and it cannot block the standard remote Fusion panel.

That gives me two honest local choices:

| Local lane | Cost shape | Operational rule |
|---|---|---|
| `verify-vibe` | Cheap CPU skeptic | Small bounded packets; queue-only. |
| `critical-gem` | GPU critical/private reviewer | Explicit use only; queue-only; requires `-Force`. |

GLM is also guarded with `-Force`. The flag is not security. It is friction: a deliberate reminder that scarce quota and GPU residency are not routine resources.

## Claude is gone from active routing

The old article kept Claude in the code-sidecar map. The current harness does not.

Claude is unavailable in this environment, so no active route depends on it. A compatibility switch that once attempted to include Claude now fails explicitly instead of silently sending work toward a dead lane.

Some unreachable legacy helper functions still exist inside the large PowerShell runner. They are cleanup debt, not active architecture. I would rather state that plainly than call the script fully clean before the dead code is physically removed.

## The verification rule got stricter

The most important policy is still:

> The producer never signs off on its own artifact.

The stronger version adds a capability gate. “Different model family” is useful, but it is not proof by itself.

Before I trust a verifier, I ask:

1. Can it inspect the evidence the claim depends on?
2. Is the evidence inside its knowledge horizon, or does it have a live source packet?
3. Can a compiler, test, schema check, or direct fetch settle the question instead?

Deterministic evidence wins before model voting:

```text
tests / typecheck / compiler / direct source fetch
-> model review for judgment that remains
-> conductor synthesis
```

The author-to-reviewer map is explicit:

| Artifact author | Valid reviewer families |
|---|---|
| GPT or Spark | DeepSeek or Nemotron |
| DeepSeek | Spark, Nemotron, or VibeThinker |
| Nemotron | DeepSeek or GLM |
| GLM | DeepSeek, Spark, or VibeThinker |

This is not “two model votes mean correct.” It is “use the strongest available ground truth, then use a capable independent reviewer for the uncertainty that remains.”

## A useful failure during this rewrite

I used the harness while rewriting this article.

The Nemotron thinker received a bounded editorial packet that explicitly named GPT-5.6 Sol as the single conductor. Its response still called Nemotron the lead, then invented stronger guarantees for some local lanes than the live policy contains.

That output was articulate, structured, and wrong.

The fix was not to ask it to sound more careful. I checked the answer against the canonical role map, dispatcher, Fusion policy, and real panel-health result, rejected the bad claims, and kept only the useful outline ideas.

That is the harness working as intended. A model response is an evidence packet, not authority.

## The dispatcher is the contract

Every lane goes through one adapter. I do not hand-write provider-specific agent commands inside a task.

```powershell
Invoke-FuguLane.ps1 -Lane thinker `
  -Prompt "Review this architecture fork. Return recommendation, risks, and confidence." `
  -OutFile "$env:TEMP\fugu-nemotron.txt"

Invoke-FuguLane.ps1 -Lane glm -Force `
  -Prompt "Audit this implementation contract as lead programmer. Return no more than 10 findings." `
  -OutFile "$env:TEMP\fugu-glm.txt"

Invoke-FuguLane.ps1 -Lane critical-gem -Force `
  -Prompt "Find one serious assumption the remote panel may have missed." `
  -OutFile "$env:TEMP\fugu-gemmable.txt"
```

The current lane list is:

```text
thinker
worker-spark
worker-flash
worker-lead
worker-terra
aux-luna
verify-flash
verify-vibe
critical-gem
evidence-a
evidence-b
synthesis-pro
review-pro
glm
```

The old profile name `fusion-gpt55` remains for compatibility. It now runs GPT-5.6 Sol. Renaming it would break callers for no operational gain, so the public name and the actual model are documented separately.

## What I verified on the real panel

I ran the remote Fusion health path against the configured NVIDIA transport on July 12, 2026.

| Panelist | Result | Latency |
|---|---|---:|
| DeepSeek V4 Pro | Transport OK; usable response | 1.442 s |
| Nemotron 3 Ultra | Transport OK; usable response | 1.958 s |
| GLM-5.2 | Transport OK; usable response | 5.180 s |
| **Whole panel** | **Status: OK** | **10.888 s** |

This was a health test, not a quality benchmark. It proved that all three configured workers could answer through the real panel runner and that the panel could complete as one operation. It did not prove that every future review will be correct.

That boundary matters. Transport health, content quality, and decision quality are three different claims.

## What changed from the June setup

| June 2026 setup | Current setup |
|---|---|
| Generic or inconsistent conductor identity | One GPT-5.6 Sol conductor and judge |
| Claude presented as an active code-sidecar | Claude removed from active routing |
| Local Gemma treated as a normal second brain | Gemmable is explicit-only critical/private review |
| GLM-5.2 kept mainly as a scarce side lane | GLM is a guarded Fugu reviewer and a Fusion panel member |
| Local tier felt structurally mandatory | Standard remote path works without local inference |
| Cross-family review emphasized model identity | Capability and deterministic evidence come first |

The architecture is simpler even though the roster is larger. Every model has one reason to be there.

## The practical division of labour

When I return to this setup cold, this is the cheat sheet:

- Normal low-risk work: GPT-5.6 Sol directly.
- Small bounded code: Spark.
- Bulk or mechanical code and checks: DeepSeek Flash.
- Architecture and option ranking: Nemotron.
- Risky implementation review: DeepSeek Pro.
- Everyday scoped implementation: Terra.
- Extraction and mechanical summaries: Luna.
- Important long-context programming judgment: GLM-5.2.
- Cheap skepticism: VibeThinker.
- Critical, private, divergent second opinion: Gemmable.
- Architecture forks and major risk: Fugu execution followed by Fusion review.

## Residual risk

Three things remain deliberately unfinished.

First, the Fusion PowerShell runner still contains dead Claude and legacy local-model functions. They are unreachable from the active route, but they should be physically deleted in a later cleanup pass.

Second, GLM sits behind a trial-style endpoint with an effective quota I do not treat as guaranteed. The guard remains even though GLM is now a real panel member.

Third, a healthy panel can still agree on a bad assumption. The system reduces correlated error; it does not remove the need for tests, direct sources, or human judgment.

That is the version of multi-model orchestration I trust: fewer heroic claims, clearer ownership, evidence before votes, and one conductor responsible for the final call.
