---
title: "Make Windows Terminal Copy on Highlight with One PowerShell Command"
slug: "windows-terminal-copy-on-select"
status: "draft"
draft_type: "quick-technical-note"
date: "2026-06-10"
updated_date: "2026-06-10"
summary: "A quick Windows Terminal workflow tweak: enable copy-on-highlight by setting copyOnSelect to true, with a backup-safe PowerShell one-liner and undo command."
accent: "#53b8ff"
image: "/img/articles/windows-terminal-copy-on-select/focal.svg"
image_alt: "A stylized Windows Terminal window with highlighted copyOnSelect text flowing into a clipboard."
image_credit: "Generated SVG illustration by Ryan Spice / ChatGPT"
image_position: "center center"
row_image: "/img/articles/windows-terminal-copy-on-select/row.svg"
row_image_alt: "A compact terminal card showing highlighted copyOnSelect text and a clipboard indicator."
row_image_credit: "Generated SVG illustration by Ryan Spice / ChatGPT"
row_image_position: "center center"
background_image: "/img/articles/windows-terminal-copy-on-select/focal.svg"
background_image_alt: "Terminal copy-on-highlight visual background."
background_image_credit: "Generated SVG illustration by Ryan Spice / ChatGPT"
background_image_position: "center center"
audience:
  - "Windows developers"
  - "PowerShell users"
  - "frontend and platform engineers"
  - "terminal-heavy builders"
possible_publication_targets:
  - "AI Wiki inbox"
  - "ryanspice.com"
tags:
  - "Windows Terminal"
  - "PowerShell"
  - "developer workflow"
  - "Windows 11"
  - "terminal setup"
credits:
  - "Ryan Spice"
references:
  - "https://learn.microsoft.com/en-us/windows/terminal/customize-settings/interaction"
  - "https://learn.microsoft.com/en-us/windows/terminal/selection"
---
# Make Windows Terminal Copy on Highlight with One PowerShell Command

**Draft created:** June 10, 2026  
**Last updated:** June 10, 2026  
**Status:** quick technical note

This is one of those tiny terminal settings that makes Windows feel less sticky.

If you are used to Linux terminals, mintty, PuTTY-style behavior, or anything where selecting text can immediately copy it, Windows Terminal can do the same thing. You do not need a plugin. You just need the global Windows Terminal setting:

```json
"copyOnSelect": true
```

When that setting is enabled, selecting text with the mouse copies it to your clipboard as soon as the selection is created.

## The pasteable PowerShell command

Run this in PowerShell:

```powershell
$paths=@("$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json","$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe\LocalState\settings.json","$env:LOCALAPPDATA\Microsoft\Windows Terminal\settings.json"); $file=$paths|?{Test-Path $_}|Select-Object -First 1; if(!$file){throw "Windows Terminal settings.json not found. Open Windows Terminal Settings once, then retry."}; Copy-Item $file "$file.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"; $s=Get-Content $file -Raw; if($s -match '"copyOnSelect"\s*:'){ $s=$s -replace '"copyOnSelect"\s*:\s*(true|false)', '"copyOnSelect": true' } else { $s=$s -replace '^\s*\{', "{`r`n    `"copyOnSelect`": true," }; Set-Content $file $s -Encoding UTF8; "Enabled copy-on-highlight in $file"
```

That command does four useful things:

- checks the common Windows Terminal settings locations
- finds the first `settings.json` that exists
- creates a timestamped backup beside it
- adds or updates `"copyOnSelect": true`

That is safer than hand-editing JSON while half-paying attention.

## Why this is useful

Terminal output is often temporary working material:

- file paths
- generated commands
- branch names
- package versions
- error snippets
- IDs, hashes, and ports

Without copy-on-highlight, you select text, hit a copy shortcut or right-click, then paste. That is not hard, but it is a small interruption repeated all day.

With copy-on-highlight enabled, the workflow becomes:

1. highlight the text
2. paste where you need it

That is the whole move.

## What changes in Windows Terminal

This is a Windows Terminal setting, not a PowerShell setting.

You are editing Windows Terminal's global `settings.json`, so it applies to profiles opened inside Windows Terminal: PowerShell, Command Prompt, WSL, Git Bash, Azure shells, and whatever else you have configured there.

The official setting is called `copyOnSelect`. Microsoft documents it as an optional boolean setting that defaults to `false`. When set to `true`, newly selected text is copied to the clipboard immediately.

One behavior note: with `copyOnSelect` enabled, right-clicking in the terminal acts as paste. Also, if you modify a selection using the keyboard, Windows Terminal may still require a normal manual copy action.

## Quick verification

After running the command:

1. close and reopen Windows Terminal
2. run any command with visible output, such as `Get-ChildItem`
3. highlight a filename or path with your mouse
4. paste into Notepad, VS Code, or a chat window

If the text appears, it worked.

## Undo command

To turn it back off:

```powershell
$paths=@("$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json","$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe\LocalState\settings.json","$env:LOCALAPPDATA\Microsoft\Windows Terminal\settings.json"); $file=$paths|?{Test-Path $_}|Select-Object -First 1; if(!$file){throw "Windows Terminal settings.json not found."}; $s=Get-Content $file -Raw; $s=$s -replace '"copyOnSelect"\s*:\s*true', '"copyOnSelect": false'; Set-Content $file $s -Encoding UTF8; "Disabled copy-on-highlight in $file"
```

Or restore the backup file created by the first command:

```powershell
Get-ChildItem "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json.bak-*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

Then copy the backup over `settings.json` if you want to fully roll back.

## My recommendation

Enable it.

It is a low-risk quality-of-life setting, especially if you spend your day jumping between Windows Terminal, VS Code, browser docs, issue trackers, and AI-assisted coding sessions.

The only real adjustment is remembering that selecting text now means it is already on your clipboard. That is the point, but it can surprise you for the first hour.

## References

- [Windows Terminal interaction settings](https://learn.microsoft.com/en-us/windows/terminal/customize-settings/interaction)
- [Selecting text in Windows Terminal](https://learn.microsoft.com/en-us/windows/terminal/selection)
