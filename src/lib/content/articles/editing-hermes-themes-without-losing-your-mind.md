---
title: "Editing Hermes Themes Without Losing Your Mind"
slug: "editing-hermes-themes-without-losing-your-mind"
status: "draft"
draft_type: "technical-debugging-note"
date: "2026-06-04"
updated_date: "2026-06-04"
audience:
  - "developers using Hermes Agent"
  - "terminal customization people"
  - "AI workflow builders"
  - "Windows PowerShell users"
possible_publication_targets:
  - "blog.ryanspice.com"
  - "ryanspice.com"
tags:
  - hermes agent
  - terminal themes
  - cli tooling
  - powershell
  - ai workflow
  - debugging
  - developer experience
credits:
  - "Ryan Spice"
references:
  - "https://hermes-agent.nousresearch.com/docs/user-guide/features/skins"
  - "https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/skins.md"
related_posts:
  - "hermes-deepseek-setup"
  - "agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns"
  - "agent-mixing-part-3-expanded-formula-zen-m3-puter-gemma4"
link_terms:
  - "Hermes Agent|https://hermes-agent.nousresearch.com/docs"
  - "skins|https://hermes-agent.nousresearch.com/docs/user-guide/features/skins"
  - "/skin|https://hermes-agent.nousresearch.com/docs/user-guide/features/skins"
summary: "A practical debugging note on editing Hermes Agent skins, why a profile can say it is using a custom skin while still rendering the default theme, and the checklist I should have used before rewriting YAML."
---
# Editing Hermes Themes Without Losing Your Mind

I lost more time than I should have trying to apply a custom Hermes Agent skin.

That is usually how these things go.

The actual goal was simple: take a working Hermes profile, switch the model to a new GPT-5.5 + DeepSeek routing profile, and keep the same Metro / Windows Phone-inspired blue terminal theme I had already built.

The reality was less elegant:

```text
configured skin = metro-needle
current skin = metro-needle
terminal still looks orange/gold
welcome line still says default Hermes Agent
```

That combination is the trap.

The config looked right. The runtime did not.

This article is the note I wish I had written before touching anything.

## First: Hermes skins are appearance, not personality

Hermes has separate systems for how the agent **talks** and how the CLI **looks**.

A skin controls the terminal presentation:

- banner colours
- banner logo and hero art
- spinner faces and verbs
- response labels
- branding strings
- prompt symbol
- tool prefix
- tool emojis
- some status and selection colours

A personality controls wording, tone, and conversational behavior.

That distinction matters because changing a skin should not be treated like changing the model, the system prompt, or the profile's agent behavior. A skin is a visual layer. If a model profile starts behaving differently after a theme edit, something else changed too.

## The symptom

The profile launched correctly.

The model was right:

```text
gpt-5.5 · Nous Research
Profile: gpt-55-deepseek-pro-g4-plus
```

The config appeared to be right:

```yaml
display:
  skin: metro-needle
```

But the terminal still looked like default Hermes:

- gold/orange border
- gold caduceus art
- default welcome message
- default-feeling status bar

Running `/skin` made it stranger:

```text
Current skin: metro-needle

Available skins:
  default
  ares
  mono
  slate
  daylight
  warm-lightmode
  poseidon
  sisyphus
  charizard

Custom skins: drop a YAML file in ~/AppData\Local\hermes\profiles\gpt-55-deepseek-pro-g4-plus/skins/
```

That was the key line.

The profile said the current skin was `metro-needle`, but the skin was not in the available list.

So Hermes had a configured skin name, but not a loadable skin file.

## The mistake

I started by writing the skin to the obvious global locations:

```text
<USER_HOME>\.hermes\skins\metro-needle.yaml
<USER_LOCAL_APPDATA>\hermes\skins\metro-needle.yaml
```

Those are sensible places to try.

They were not enough for this profile.

The active Hermes profile was telling me it wanted the custom skin here:

```text
<USER_LOCAL_APPDATA>\hermes\profiles\<profile-name>\skins\metro-needle.yaml
```

That was the path that mattered.

The lesson is blunt:

> **When Hermes prints a custom skin path, believe the runtime before the docs, before memory, and before whatever worked last time.**

Documentation tells you the default convention. The running profile tells you what this session is actually doing.

## Why the wrong colours fooled me

The skin file I wrote was not orange.

It was this kind of palette:

```yaml
colors:
  banner_border: "#00AEEF"
  banner_title: "#7FDBFF"
  banner_accent: "#21D4FD"
  banner_dim: "#5F8199"
  banner_text: "#E6F8FF"

  ui_accent: "#21D4FD"
  ui_label: "#7FDBFF"
  ui_ok: "#42D392"
  ui_error: "#FF5F7A"
  ui_warn: "#FFD166"

  prompt: "#7FDBFF"
  input_rule: "#00AEEF"
  response_border: "#21D4FD"
```

That is obviously blue/cyan.

So when the terminal appeared orange, the correct conclusion was not:

> "The palette is wrong."

The correct conclusion was:

> "The custom skin is not actually loaded."

That one distinction would have saved the whole loop.

## Use a sentinel string

The fastest way to prove a skin is loaded is not by looking at the colours.

Colours can inherit. Some chrome may still be hard-coded. Some keys may not affect the section you are staring at.

Use branding text instead.

For example:

```yaml
branding:
  agent_name: "Hermes Needle"
  welcome: "Welcome to Hermes Needle. Metro dark mode live — type a message or /help for commands."
  response_label: " ◆ Needle "
  prompt_symbol: "❯"
```

Then launch Hermes.

If the welcome line still says this:

```text
Welcome to Hermes Agent! Type your message or /help for commands.
```

the skin did not load.

Do not keep tweaking hex codes.

Fix the loader path.

## The safer workflow

Here is the workflow I should have used from the start.

### 1. Launch the target profile

```powershell
hermes -p gpt-55-deepseek-pro-g4-plus
```

### 2. Ask Hermes where custom skins belong

Inside Hermes:

```text
/skin
```

Do not skim the output. Read the custom skin path.

If it says:

```text
Custom skins: drop a YAML file in ~/AppData\Local\hermes\profiles\gpt-55-deepseek-pro-g4-plus/skins/
```

then that profile wants profile-local skins.

### 3. Install the skin into the profile-local folder

From PowerShell:

```powershell
$ErrorActionPreference = "Stop"

$ProfilesRoot = "$env:LOCALAPPDATA\hermes\profiles"
$Profile = "gpt-55-deepseek-pro-g4-plus"

$SkinName = "metro-needle"
$ProfileSkins = Join-Path $ProfilesRoot "$Profile\skins"
$SkinPath = Join-Path $ProfileSkins "$SkinName.yaml"

New-Item -ItemType Directory -Force -Path $ProfileSkins | Out-Null

@'
name: metro-needle
description: Metro Needle / Windows Phone dark-blue skin.

colors:
  banner_border: "#00AEEF"
  banner_title: "#7FDBFF"
  banner_accent: "#21D4FD"
  banner_dim: "#5F8199"
  banner_text: "#E6F8FF"

  ui_accent: "#21D4FD"
  ui_label: "#7FDBFF"
  ui_ok: "#42D392"
  ui_error: "#FF5F7A"
  ui_warn: "#FFD166"

  prompt: "#7FDBFF"
  input_rule: "#00AEEF"
  response_border: "#21D4FD"

  session_label: "#FFD166"
  session_border: "#35566B"

  status_bar_bg: "#06111F"
  voice_status_bg: "#06111F"
  selection_bg: "#123A54"
  completion_menu_bg: "#071725"
  completion_menu_current_bg: "#123A54"
  completion_menu_meta_bg: "#071725"
  completion_menu_meta_current_bg: "#123A54"

spinner:
  waiting_faces:
    - "(▣)"
    - "(◈)"
    - "(◇)"
    - "(◆)"
  thinking_faces:
    - "(⌁)"
    - "(◉)"
    - "(◎)"
    - "(✦)"
  thinking_verbs:
    - "routing"
    - "staging"
    - "indexing"
    - "rendering"
    - "syncing"
    - "composing"
  wings:
    - ["⟦", "⟧"]
    - ["▸", "◂"]
    - ["◜", "◞"]

branding:
  agent_name: "Hermes Needle"
  welcome: "Welcome to Hermes Needle. Metro dark mode live — type a message or /help for commands."
  goodbye: "Metro Needle session closed. ⚕"
  response_label: " ◆ Needle "
  prompt_symbol: "❯"
  help_header: "▣ Metro Needle Commands"

tool_prefix: "▏"

tool_emojis:
  terminal: "💻"
  file: "📄"
  read_file: "📖"
  write_file: "✍️"
  patch: "🔧"
  web_search: "🔎"
  browser: "🌐"
  memory: "🧠"
  skills: "📚"
  mcp: "⚡"
  image_gen: "🎨"
  todo: "📋"
  clarify: "❓"
'@ | Set-Content -Path $SkinPath -Encoding UTF8

hermes -p $Profile config set display.skin $SkinName
```

### 4. Relaunch and verify

```powershell
hermes -p gpt-55-deepseek-pro-g4-plus
```

Inside Hermes:

```text
/skin
```

The important check is not just:

```text
Current skin: metro-needle
```

The important check is that `metro-needle` appears in the available/custom skins list.

Then check the welcome line.

You want:

```text
Welcome to Hermes Needle. Metro dark mode live — type a message or /help for commands.
```

If the welcome line did not change, the skin is still not loaded.

## The profile-safe installer

For multiple profiles, I would use a mirror script instead of pasting YAML by hand into one location.

```powershell
$ErrorActionPreference = "Stop"

$SkinName = "metro-needle"
$ProfilesRoot = "$env:LOCALAPPDATA\hermes\profiles"

$Profiles = @(
  "gpt-55-deepseek-pro-g4-plus",
  "gpt-55-deepseek-flash-g4-plus"
)

$SourceSkin = "$env:LOCALAPPDATA\hermes\skins\$SkinName.yaml"

if (!(Test-Path $SourceSkin)) {
  throw "Missing source skin: $SourceSkin"
}

foreach ($Profile in $Profiles) {
  $ProfileRoot = Join-Path $ProfilesRoot $Profile
  $ProfileSkins = Join-Path $ProfileRoot "skins"
  $TargetSkin = Join-Path $ProfileSkins "$SkinName.yaml"

  if (!(Test-Path $ProfileRoot)) {
    throw "Missing profile: $ProfileRoot"
  }

  New-Item -ItemType Directory -Force -Path $ProfileSkins | Out-Null
  Copy-Item $SourceSkin $TargetSkin -Force

  hermes -p $Profile config set display.skin $SkinName
  hermes -p $Profile config set display.tool_progress new

  Write-Host "Installed $SkinName for $Profile"
}
```

That does three things:

1. Copies the skin into the profile's local `skins` folder.
2. Sets `display.skin`.
3. Keeps `tool_progress` at a quieter `new` setting.

The important part is that the skin file and the profile config move together.

## What I would automate next

The correct tooling is a tiny "Hermes skin doctor" script.

It should answer these questions:

```text
Which profile am I using?
What does display.skin say?
Where does this profile look for custom skins?
Does the YAML exist there?
Does the YAML parse?
Does the YAML name match the filename?
Does /skin list this skin as available?
Does the branding.welcome sentinel render?
```

That would prevent the entire failure mode.

The script should also refuse to call the job done if the skin is configured but not loadable.

The condition to catch is:

```text
Current skin: metro-needle
Available skins: default, ares, mono...
```

That state should be treated as a warning:

```text
Configured but not available. Hermes is probably falling back to default.
```

## A better rule of thumb

When editing Hermes themes:

```text
Config says what you want.
Runtime says what is real.
The welcome string proves what loaded.
```

Do not debug a skin by colour first.

Debug it by path, availability, and sentinel text.

Only after the skin is definitely loaded should you tune the palette.

## Why this matters

This was a small theme issue, but it is the same pattern as larger agent tooling problems.

The system has multiple layers:

- global config
- profile config
- runtime home path
- profile-local overrides
- default fallback
- user-visible session state

When those layers disagree, it is easy to edit the wrong thing repeatedly.

The fix is not more confidence.

The fix is a better verification loop.

## The final checklist

Before blaming the YAML:

```text
1. Run /skin.
2. Read the custom skin path.
3. Put the YAML there.
4. Confirm the skin appears in the available list.
5. Confirm branding.welcome changed.
6. Confirm display.skin persists.
7. Relaunch the profile.
8. Only then adjust colours.
```

That checklist is boring.

That is why it works.
