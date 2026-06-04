---
title: "Claude Code Keeps Asking for Permission? Use the Right Bypass Flag"
slug: "claude-code-keeps-asking-permission-use-right-bypass-flag"
status: "draft"
draft_type: "technical-blog-post"
date: "2026-05-31"
audience:
  - "AI-assisted development workflows"
  - "Windows and PowerShell users"
  - "developer productivity tooling"
possible_publication_targets:
  - "AI Wiki inbox"
  - "ryanspice.com"
  - "Canopy Digital internal/process content"
tags:
  - Claude Code
  - permissions
  - shell tools
  - Windows
  - PowerShell
  - developer workflow
  - AI assistants
related_posts:
  - "hermes-deepseek-setup"
  - "editing-hermes-themes-without-losing-your-mind"
summary: "A practical explanation of why Claude Code still prompts for approvals and the two flag patterns that actually enable skip-permission behavior in trusted repos."
link_terms:
  - "Claude Code|https://www.anthropic.com"
  - "Shift+Tab|https://en.wikipedia.org/wiki/Tab"
  - "Permission mode|https://docs.anthropic.com"
  - "PowerShell|https://learn.microsoft.com/powershell/scripting/overview"
  - "Bypass permissions|https://www.anthropic.com"
  - "JSON schema|https://json.schemastore.org/claude-code-settings.json"
source_context:
  repo_root: "S:\\OneDrive\\Obsidan\\AI-Wiki\\07_Projects\\blog.ryanspice.com"
---

# Claude Code Keeps Asking for Permission? Use the Right Bypass Flag

If Claude Code keeps asking you to approve every file edit, shell command, or repo action, the problem may be your settings.
It may be the flag you launched it with.

## The confusing bit

```powershell
claude --allow-dangerously-skip-permissions
```

That flag does not start Claude Code in full bypass mode.

It only makes the dangerous bypass mode available in the interactive mode cycle, usually through `Shift+Tab`.

If you want Claude Code to actually stop prompting for normal repo work, launch it like this:

```powershell
claude --dangerously-skip-permissions
```

Or use the explicit permission mode form:

```powershell
claude --permission-mode bypassPermissions
```

Both are for trusted repos where you are comfortable letting Claude edit files and run commands without repetitive approvals.

## The Windows setup I use

For a trusted repo:

```powershell
cd "B:\Dev\YourRepo"
claude --dangerously-skip-permissions
```

Do not run this casually from your home folder, drive root, or a folder with unrelated personal files.

Use it only from inside the repo you actually want Claude to work on.

## Make bypass mode the default

If you want Claude Code to open in bypass mode by default, update your user settings:

```powershell
$ClaudeDir = Join-Path $env:USERPROFILE ".claude"
$SettingsPath = Join-Path $ClaudeDir "settings.json"

New-Item -ItemType Directory -Force $ClaudeDir | Out-Null

$Settings = if (Test-Path $SettingsPath) {
  Get-Content $SettingsPath -Raw | ConvertFrom-Json -AsHashtable
} else {
  @{}
}

$Settings["$schema"] = "https://json.schemastore.org/claude-code-settings.json"

if (-not $Settings.ContainsKey("permissions") -or -not ($Settings["permissions"] -is [hashtable])) {
  $Settings["permissions"] = @{}
}

$Settings["permissions"]["defaultMode"] = "bypassPermissions"
$Settings["permissions"]["skipDangerousModePermissionPrompt"] = $true

$Settings | ConvertTo-Json -Depth 20 | Set-Content $SettingsPath -Encoding UTF8

Get-Content $SettingsPath
```

Then launch Claude Code normally from the repo:

```powershell
cd "B:\Dev\YourRepo"
claude
```

## Project-only settings

If you only want this behavior for one repo, put a local settings file inside the project:

```powershell
cd "B:\Dev\YourRepo"

New-Item -ItemType Directory -Force ".claude" | Out-Null

@'
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "defaultMode": "bypassPermissions",
    "allow": [
      "Bash",
      "PowerShell",
      "Edit",
      "Write",
      "MultiEdit",
      "NotebookEdit",
      "WebFetch",
      "WebSearch"
    ]
  }
}
'@ | Set-Content ".claude\settings.local.json" -Encoding UTF8
```

This is usually safer than making bypass mode global.

## If it still asks

Inside Claude Code, run:

```text
/status
```

Check which settings are active and whether something is overriding your local config.

The main thing to look for is this setting:

```json
{
  "permissions": {
    "disableBypassPermissionsMode": "disable"
  }
}
```

If that is set by managed or higher-priority settings, bypass mode may be blocked no matter what flag you pass.

## Practical rule

Use this when you want Claude Code to actually go in bypass mode inside a trusted repo:

```powershell
cd "B:\YourRepo"
claude --dangerously-skip-permissions
```

Use this only in repos you trust.

Do not use it from random folders.

Do not use it when secrets, credentials, or unrelated personal files are nearby.

If you used `--allow-dangerously-skip-permissions` and asked why Claude was still asking for approval, that was the trap.
That flag allows the mode to be selected later, but it does not start Claude Code in that mode.
