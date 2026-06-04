---
title: "Agent Mixing, Part 3: The Expanded Formula — Zen/M3, Puter Panels, Gemma4, and Specialist Rotators"
slug: "agent-mixing-part-3-expanded-formula-zen-m3-puter-gemma4"
status: "draft"
draft_type: "agent-architecture"
date: "2026-06-04"
updated_date: "2026-06-04"
audience:
  - "developers building agentic coding workflows"
  - "Hermes users designing model-composition profiles"
  - "AI practitioners comparing peer delegates, panels, and specialist rotators"
possible_publication_targets:
  - "AI Wiki inbox"
  - "ryanspice.com"
tags:
  - opencode zen
  - minimax m3
  - puter
  - gemma4
  - agent orchestration
  - hermes
  - model routing
credits:
  - "Ryan Spice"
  - "AI Wiki research notes"
references:
  - "https://api-docs.deepseek.com/quick_start/pricing"
  - "https://api-docs.deepseek.com/news/news260424"
  - "https://puter.com/"
  - "https://docs.puter.com/"
  - "https://docs.puter.com/AI/"
  - "https://deepmind.google/models/gemma/"
related_posts:
  - "agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns"
  - "agent-mixing-part-2-gpt-55-as-orchestrator"
summary: "A draft extension to the agent-mixing article that solidifies the expanded formula: Lead + Flash delegates + Zen/M3 peer challenger + Puter-style sanitized panel + Gemma4 local junior + one specialist rotator."
---
# Agent Mixing, Part 3: The Expanded Formula — Zen/M3, Puter Panels, Gemma4, and Specialist Rotators

**Draft created:** June 4, 2026  
**Last updated:** June 4, 2026  
**Series:** Agent mixing / Hermes routing, Part 3

Part 1 established the baseline:

```text
Pro + Flash * n + Gemma4
```

Part 2 corrected `Pro` into a role:

```text
Lead(5.5 or DeepSeek V4 Pro) + bounded delegates
```

Part 3 expands the formula with the extra lanes that matter in a real Hermes setup:

* OpenCode Zen / MiniMax M3 as a peer code challenger
* Puter-style model access as a sanitized model-diversity panel
* Gemma4 as the always-available local junior pass
* one specialist rotator only when the task really needs it

The mistake would be putting all of these into one giant “rotator.”

That loses the point.

Each lane has a different trust level, cost profile, privacy boundary, and job.

## The corrected formula

The expanded formula should look like this:

```text
conversation =
  Lead(5.5 or DeepSeek V4 Pro)
  + DeepSeekFlash(n implementation/review delegates)
  + OpenCodeZenM3(0|1 peer code delegate)
  + PuterPanel(0..k sanitized second opinions)
  + Gemma4Local(always/lightweight)
  + Rotator(0|1 specialist)
```

Or in the compact style:

```text
C = Lead
  + Flash * n
  + ZenM3(peer-code)
  + Puter(panel, sanitized)
  + G4(local-junior)
  + Rotator(specialist)
```

That formula is useful because it names the roles instead of merely naming the vendors.

The model is less important than the trust boundary.

## The role table

| Lane | Trust level | Use it for | Do not use it for |
| --- | --- | --- | --- |
| GPT-5.5 / DeepSeek V4 Pro | Highest | final plan, synthesis, merge decisions, architecture, tradeoffs | blindly accepting delegate output |
| DeepSeek V4 Flash | high utility | parallel implementation, variant solutions, fast bug hunts, test ideas | final product decisions |
| OpenCode Zen / MiniMax M3 | peer delegate | “what did we miss?”, long-context repo review, edge cases, architecture challenge | treating free or opportunistic access as permanent foundation |
| Puter.js models | low-to-medium | style, UX, accessibility, security smell checks, alternate wording, quick adversarial reads | private repo dumps, secrets, client code, final authority |
| Gemma4 local | safe local junior | readability, scope risk, practical pseudocode, visual concerns, sanity checks | owning architecture |
| Rotator | specialist | one targeted outside perspective: security, Svelte, PHP, docs, tests | random committee voting |

This table is the important part.

Without the trust boundary, the formula becomes decoration.

## Why Zen/M3 should not be “just a rotator”

The earlier instinct was right: OpenCode Zen / MiniMax M3 should not be merely another random rotating model.

Its best role is different from Flash.

Flash is the fast implementation and review multiplier.

Zen/M3 should be the peer code challenger:

```text
Flash: implement or inspect a bounded lane.
Zen/M3: challenge the architecture, edge cases, and missed repo implications.
Lead: decide what to accept.
```

That makes Zen/M3 useful even when it is not the strongest final answer model.

A rotator is disposable.

A peer challenger is part of the serious-code route.

That is the distinction.

## The caveat about free capacity

Any “free” model lane should be treated as opportunistic capacity.

That does not mean ignore it. It means do not build your entire trusted workflow on the assumption that free access remains stable, unlimited, private, or equally capable forever.

Use a free Zen/M3 route like this:

```text
peer-opencodezen-minimax-m3-free:
  role: architecture_challenge
  max_instances: 1
  receives: summarized repo context or selected file bundle
  returns: risks, edge cases, missed tests, architecture objections
  never_owns: final merge decision
```

That way, if pricing, access, context limits, or provider behavior changes, the workflow degrades gracefully.

The peer lane can be disabled without breaking the whole system.

## Puter is a panel, not a core implementation lane

Puter-style model access is interesting because it can give quick access to a broad set of models from a frontend/client-side workflow.

That makes it useful for model diversity.

But that also makes it the wrong place to dump private repo history, secrets, client data, internal business material, or commercially sensitive code.

Use Puter like a sanitized panel:

```text
panel-puter-accessibility:
  input: redacted UI excerpt or screenshot description
  output: accessibility concerns only

panel-puter-code-style:
  input: small redacted code excerpt
  output: readability/style smell checks only

panel-puter-security-smell:
  input: minimal redacted pseudocode
  output: broad security smell notes only
```

Do not let Puter become the implementation owner.

A panel can say:

> “This flow is confusing.”

or:

> “This smells like missing validation.”

It should not say:

> “Here is the final patch for your private production repo.”

That is the wrong trust boundary.

## Gemma4 remains the local junior lane

Gemma4 should remain simple.

That is the point.

Its best role is not “skeptic.”

Its best role is:

```text
gemma4-e4b-local:
  role: junior_sanity_pass
  sees: compact brief, selected snippets, UI descriptions, pseudocode
  returns:
    - readability concerns
    - practical implementation concerns
    - visual / UX clarity notes
    - over-scope warnings
    - small pseudocode ideas
  never_owns:
    - final architecture
    - final security decision
    - final merge decision
```

Because it is local, Gemma4 is also a useful privacy-preserving lane. It can inspect more sensitive summaries than a random external panel, assuming the local runtime is actually local and the prompt does not leave the machine.

That gives it durable value even if the model is weaker than the cloud lead.

## The specialist rotator should stay rare

A rotator is useful when it has a specialty.

Bad rotator use:

```text
Ask one more model what it thinks.
```

Good rotator use:

```text
Ask a security specialist to inspect only auth/session risk.
Ask a Svelte specialist to inspect runes/store migration hazards.
Ask a PHP specialist to inspect adapter/runtime routing concerns.
Ask a docs specialist to inspect public clarity.
```

The rotator should have:

* one role
* one question
* one output shape
* one chance to add value

Then the lead decides.

No committee voting.

## The practical routing modes

Here is the routing policy I would actually use.

### 1. Simple task

```text
Lead only
or
Lead + Gemma4
```

Use for small edits, direct answers, one-file fixes, or anything where delegation would add more overhead than value.

### 2. Normal code change

```text
Lead
+ delegate-deepseek-v4-flash
+ Gemma4
```

Use for everyday SvelteKit, TypeScript, PHP adapter, docs, and local tooling work.

### 3. Hard feature work

```text
Lead
+ delegate-deepseek-v4-flash * 2
+ peer-opencodezen-minimax-m3-free
+ gemma4-e4b-local
```

Use for serious implementation where the cost of missing an edge case is real.

### 4. Security-sensitive or architecture-sensitive work

```text
Lead
+ peer-opencodezen-minimax-m3-free
+ delegate-deepseek-v4-flash
+ local/static checks
+ optional sanitized Puter smell check
```

Use for auth, deploys, cPanel/SSH flows, client work, private repo restructuring, secrets handling, or anything that can create a real-world mess.

Puter only receives redacted summaries or tiny snippets.

### 5. UI / docs / public-facing polish

```text
Lead
+ delegate-deepseek-v4-flash
+ gemma4-e4b-local
+ puter-style-panel * 1..3
```

This is where Puter makes the most sense.

Model diversity can catch style, accessibility, wording, confusing layout, or “this is ugly” issues.

### 6. Stuck debugging

```text
Lead asks Flash and Zen/M3 for independent failure theories.
Lead chooses one hypothesis.
Then tests/logs decide.
```

The important part is that only one hypothesis moves forward at a time.

Otherwise debugging turns into fan fiction.

## The anti-garbage rule

The rule that keeps this from becoming garbage is simple:

> **Do not ask every model the same broad question.**

Bad:

```text
Tell me how to implement this feature.
```

Good:

```text
Flash Delegate:
Implement the smallest viable patch. Return changed files, test commands, and risk notes.

Zen/M3 Peer:
Review the proposed patch for architecture mistakes, missed edge cases, security issues, and test gaps. Do not rewrite unless necessary.

Gemma4 Local:
Act as junior engineer. Identify readability issues, confusing flows, UX/visual risks, and over-scoping.

Puter Panel:
Given this redacted excerpt, provide only accessibility/style/security smell checks. No implementation.
```

Model diversity only helps when each model has a different job.

## Diminishing returns after the expanded formula

For this expanded workflow, the useful curve is probably:

```text
Lead only                             = fast, but blind spots
Lead + 1 Flash                        = strong default
Lead + 2 Flash + Gemma4               = good hard-work baseline
Lead + 2 Flash + Zen + Gemma4         = best serious-code mode
Lead + 2 Flash + Zen + G4 + Puter     = public/security/polish gate only
Anything beyond that                  = release/security/architecture exception only
```

Past four or five voices, quality usually stops improving unless the extra model has a specific specialty.

Otherwise you get:

* duplicate advice
* contradictions
* more context packing
* more synthesis work
* more tokens spent arbitrating vibes

The lead should cut scope, not collect every possible opinion.

## Recommended Hermes profile names

Use names that describe the lane, not vendor hype.

```text
gpt-55-lead-flash-g4
deepseek-v4-pro-g4
deepseek-v4-flash-g4
delegate-deepseek-v4-flash
peer-opencodezen-minimax-m3-free
panel-puter-code-style
panel-puter-security-smell
panel-puter-accessibility
gemma4-e4b-local
rotator-code-specialist
```

I would avoid:

```text
rotator-opencodezen
```

That undersells the role.

Use:

```text
peer-opencodezen-minimax-m3-free
```

or:

```text
delegate-opencodezen-minimax-m3-free
```

My pick is `peer-*` because the best role is challenge, not obedient generation.

## The corrected mental model

The formula is not:

```text
strong model + many weaker models = better answer
```

The formula is:

```text
Lead
+ fast implementers
+ one serious peer challenger
+ local junior sanity
+ optional sanitized model-diversity panel
+ optional true specialist
```

That is the setup.

So yes, the expanded serious-code route should be:

```text
(5.5 or DeepSeek V4 Pro)
+ DeepSeek V4 Flash * n
+ OpenCode Zen / MiniMax M3 as peer
+ Gemma4 local
+ Puter as sanitized panel
+ one rotating specialist when justified
```

The main correction is:

```text
Zen/M3 = peer delegate
Puter = sanitized panel
Gemma4 = local junior
Rotator = specialist only
Lead = final decision boundary
```

That is the part worth preserving.

## Bottom line

OpenCode Zen / MiniMax M3 should sit beside Flash in importance, but not beside Flash in job description.

Flash is the fast implementation/review multiplier.

Zen/M3 is the peer code challenger.

Puter is a lower-trust model-diversity panel.

Gemma4 is the local junior sanity pass.

The rotator is for a specialty, not random voting.

The lead must remain the lead.

That is the corrected formula.

## Series navigation

**Draft created:** June 4, 2026  
**Last updated:** June 4, 2026

* **Part 1:** [Agent Mixing Without Theater: DeepSeek Pro, Flash, Gemma4, and the Law of Diminishing Returns](/agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns/)
* **Part 2 draft:** [What changes when GPT-5.5 is the orchestrator](/drafts/agent-mixing-part-2-gpt-55-as-orchestrator/)
* **Part 3:** this draft.
* **Planned mini-note:** why the formula notation is useful, but the corrected formula matters.
* **Planned Part 4:** Cathedral Edition / Prompt Operations framing — how Hermes makes the pattern operational instead of theoretical.
* **Planned Part 5:** field history, test runs, results, mistakes, and what changed after using the system for real.

*Small footer note: this is a private draft preview until promoted from `status: draft` to `status: published`.*

## Sources and further reading

* [DeepSeek API Docs — Models and pricing](https://api-docs.deepseek.com/quick_start/pricing)
* [DeepSeek API Docs — DeepSeek V4 Preview Release](https://api-docs.deepseek.com/news/news260424)
* [Puter](https://puter.com/)
* [Puter Docs](https://docs.puter.com/)
* [Puter AI Docs](https://docs.puter.com/AI/)
* [Google DeepMind — Gemma](https://deepmind.google/models/gemma/)
