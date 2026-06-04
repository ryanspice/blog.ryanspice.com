---
title: "Hermes + DeepSeek: The Practical Two-Profile Setup for Fast and Pro AI Agent Work"
slug: "hermes-deepseek-setup"
status: "draft"
draft_type: "setup-guide"
date: "2026-05-30"
audience:
  - "developers"
  - "agent operators"
  - "Windows users"
  - "AI Wiki users"
possible_publication_targets:
  - "AI Wiki inbox"
  - "ryanspice.com"
tags:
  - "Hermes"
  - "DeepSeek"
  - "AI agents"
  - "Windows"
  - "profiles"
  - "AI Wiki"
related_posts:
  - "editing-hermes-themes-without-losing-your-mind"
  - "agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns"
  - "what-can-you-actually-do-with-a-deepseek-api-key"
summary: "A two-profile Hermes setup that uses DeepSeek Flash for everyday work and DeepSeek Pro for deeper reasoning, plus an optional AI Wiki layer."
---

# Hermes + DeepSeek: The Practical Two-Profile Setup for Fast and Pro AI Agent Work

The cleanest Hermes setup is not one giant profile. It is two profiles:

- Flash for fast, cheap, everyday work
- Pro for deeper planning, architecture, audits, and hard debugging

That split keeps the workflow boring enough that you actually use it.

## What you are building

```text
Hermes
├─ flash profile
│  ├─ provider: deepseek
│  ├─ model: deepseek-v4-flash
│  └─ use for everyday agent work
└─ pro profile
   ├─ provider: deepseek
   ├─ model: deepseek-v4-pro
   └─ use for harder reasoning and repo review
```

## Why Hermes plus DeepSeek works well

Hermes gives you the agent layer: tools, sessions, memory, skills, terminal access, and editor integration.
DeepSeek gives you a lower-cost model backend with a clean speed / reasoning split.

Use Flash for:

- routine coding tasks
- repo summaries
- small refactors
- prompt cleanup
- markdown and docs
- command generation
- quick triage

Use Pro for:

- architecture reviews
- ugly debugging
- multi-file reasoning
- security-sensitive review
- deep research synthesis
- large planning tasks

## Install Hermes on Windows

On Windows, the native installer path is:

```powershell
iex (irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1)
```

Then restart your terminal and check:

```powershell
hermes version
hermes doctor
```

If native Windows gives you trouble, use WSL2. Native is convenient; WSL2 is usually less surprising.

## Set the DeepSeek API key

Do not hard-code the key in project files.

```powershell
$DeepSeekKey = Read-Host "Paste your DeepSeek API key"
[Environment]::SetEnvironmentVariable("DEEPSEEK_API_KEY", $DeepSeekKey, "User")
[Environment]::SetEnvironmentVariable("DEEPSEEK_BASE_URL", "https://api.deepseek.com", "User")
$env:DEEPSEEK_API_KEY = $DeepSeekKey
$env:DEEPSEEK_BASE_URL = "https://api.deepseek.com"
```

Close and reopen PowerShell after setting user-level environment variables.

## Use the correct DeepSeek endpoints

For Hermes, use the standard DeepSeek base URL:

```text
https://api.deepseek.com
```

DeepSeek also exposes an Anthropic-compatible endpoint:

```text
https://api.deepseek.com/anthropic
```

Use that only when a client specifically expects the Anthropic-shaped API.

## Create the Flash profile

```powershell
hermes profile create flash --clone
hermes profile use flash
hermes -p flash model
```

Choose:

- Provider: DeepSeek
- Base URL: `https://api.deepseek.com`
- Model: `deepseek-v4-flash`

Test it:

```powershell
hermes -p flash chat -q "Say which Hermes profile and DeepSeek model should be used for fast everyday coding work."
```

## Create the Pro profile

Clone Flash and switch only the model:

```powershell
hermes profile create pro --clone-from flash
hermes -p pro model
```

Choose:

- Provider: DeepSeek
- Base URL: `https://api.deepseek.com`
- Model: `deepseek-v4-pro`

Test it:

```powershell
hermes -p pro chat -q "You are the Pro profile. Explain when I should escalate from Flash to Pro."
```

## Recommended daily workflow

Use Flash by default:

```powershell
hermes -p flash chat
```

Use Pro when the task deserves it:

```powershell
hermes -p pro chat
```

For one-shot tasks:

```powershell
hermes -p flash chat -q "Summarize this project and list the next three useful commands."
```

For heavier work:

```powershell
hermes -p pro chat -q "Audit this repo architecture and identify the top five risks before I refactor anything."
```

## Add aliases if you want speed

```powershell
hermes profile alias flash --name h-flash
hermes profile alias pro --name h-pro
```

Then use:

```powershell
h-flash chat
h-pro chat
```

## Use Hermes profiles from VS Code ACP

If your editor supports ACP agents, point it at Hermes and pass the profile name.

```json
{
  "acp.agents": {
    "Hermes DeepSeek Flash": {
      "command": "hermes",
      "args": ["-p", "flash", "acp"]
    },
    "Hermes DeepSeek Pro": {
      "command": "hermes",
      "args": ["-p", "pro", "acp"]
    }
  }
}
```

That gives you one fast default and one deliberate escalation lane.

## Do not use the old aliases for new setups

Avoid these for new profiles:

- `deepseek-chat`
- `deepseek-reasoner`

Use the explicit model names instead:

- `deepseek-v4-flash`
- `deepseek-v4-pro`

## Suggested profile policy

- Quick coding help → Flash
- README and docs cleanup → Flash
- Small bug triage → Flash
- Multi-file refactor planning → Pro
- Architecture review → Pro
- Security-sensitive review → Pro
- Deep research synthesis → Pro
- Long agent loop → start Flash, escalate to Pro

The trap is using Pro too early. Let Flash gather facts first.

## Optional: add an AI Wiki layer

Once Hermes works, the next upgrade is not another model. It is better local context.

Use the wiki for:

- project decisions
- repo notes
- reusable prompts
- generated skills
- research outputs
- build failures
- troubleshooting history
- architecture decisions
- “do not do this again” notes

The rule is simple: keep source material as evidence and generate derived summaries, indexes, and skills from it.

## Troubleshooting

If Hermes only shows other providers, check the terminal-level model configuration.

If the DeepSeek key is not picked up, verify the environment variables:

```powershell
$env:DEEPSEEK_API_KEY
$env:DEEPSEEK_BASE_URL
```

If a file is blocked by an invisible BOM, rewrite it as UTF-8 without BOM and rerun `hermes doctor`.

## Final default

For most developers, the default should be:

- profile: flash
- escalation profile: pro
- provider: DeepSeek
- base URL: `https://api.deepseek.com`
- model names: `deepseek-v4-flash` and `deepseek-v4-pro`

That is the clean version.
