---
title: "How I Turned VS Code Into an AI Engineering Workbench With Hermes"
slug: "how-i-turned-vs-code-ai-engineering-workbench-hermes"
status: "draft"
draft_type: "technical-workflow-guide"
date: "2026-06-07"
updated_date: "2026-06-07"
audience:
  - "frontend and platform engineers"
  - "AI-assisted development users"
  - "VS Code users"
  - "developers setting up local agent workflows"
possible_publication_targets:
  - "AI Wiki inbox"
  - "ryanspice.com"
tags:
  - hermes
  - vscode
  - acp
  - agent client protocol
  - ai coding agents
  - developer workflow
  - github copilot
  - local models
  - prompt operations
credits:
  - "Ryan Spice"
related_posts:
  - "why-im-using-hermes-ai-builder-vs-code"
  - "hermes-deepseek-setup"
  - "best-ways-to-use-gpt-5-3-codex-spark"
summary: "A practical setup guide for using VS Code as an AI engineering workbench with Hermes, ACP, model routing, terminal access, profiles, and repository-native agent workflows."
---
# How I Turned VS Code Into an AI Engineering Workbench With Hermes

Most developers are approaching AI tooling backwards.

They start with the model.

I started with the workflow.

After experimenting with multiple coding agents, chat interfaces, browser tools, and IDE integrations, I eventually landed on a simple goal:

**Keep VS Code as the primary workspace and bring the agent into the editor.**

That's where Hermes and ACP (Agent Client Protocol) come in.

## What We're Building

The final setup looks like this:

```text
VS Code
├── GitHub Copilot (optional)
├── Hermes Agent
│   ├── GPT-5.5
│   ├── DeepSeek
│   ├── Gemini
│   ├── Claude
│   └── Local models
├── Git
├── Terminal
└── Project Workspace
```

Instead of bouncing between browser tabs and chat windows, the agent can work directly inside the repository.

File edits, terminal commands, diffs, approvals, memory, and tool usage all happen inside VS Code. Hermes exposes these capabilities through ACP, allowing compatible editors to communicate with the agent runtime.

## Step 1: Install Hermes

Start by installing and configuring Hermes.

Verify the installation:

```powershell
hermes --version
```

Then configure your preferred provider:

```powershell
hermes setup
```

or

```powershell
hermes model
```

Depending on your configuration, Hermes can route requests to local models, cloud models, or a combination of both.

## Step 2: Verify ACP Support

Hermes can run as an ACP server, which allows editors such as VS Code to connect and use it as an editor-native coding agent.

Verify ACP is available:

```powershell
hermes acp --check
```

If that succeeds, you're ready for the editor integration.

## Step 3: Install the ACP Client Extension

Install the ACP Client extension for VS Code.

ACP Client is a generic agent connector that can communicate with Hermes and other ACP-compatible agents.

Once installed:

1. Open VS Code.
2. Open the ACP panel.
3. Add or select Hermes.
4. Connect.

Many installations discover Hermes automatically. If yours does not, manually configure:

```json
{
  "command": "hermes",
  "args": ["acp"]
}
```

This launches Hermes as an ACP server and allows VS Code to communicate with it over standard I/O.

## Step 4: Open a Real Repository

This is where the workflow changes.

Instead of pasting files into chat, simply open the repository:

```powershell
code B:\Dev\MyProject
```

Then ask Hermes things like:

```text
Review this codebase.
```

```text
Find duplicated utilities.
```

```text
Upgrade this project to SvelteKit 2.
```

```text
Explain the failing tests.
```

Hermes can inspect files, run tools, execute terminal commands, generate patches, and maintain session history directly within the workspace.

## Step 5: Keep Copilot for What It Does Best

One mistake I see often is trying to replace everything with a single tool.

Copilot remains excellent at:

* inline completions
* quick code suggestions
* boilerplate generation

Hermes excels at:

* repository analysis
* architecture work
* refactoring
* debugging
* research
* multi-file changes
* automation

These tools complement each other rather than compete.

## Step 6: Create Specialized Profiles

The real power comes from creating purpose-built agent profiles.

Examples:

```text
builder
reviewer
researcher
architect
documentation
release-manager
```

Each profile can use different models, skills, prompts, and tool permissions.

Instead of switching applications, you switch operating modes.

The workflow starts to feel less like using an AI chatbot and more like working with specialized engineering assistants.

## Common Problems

### Hermes Does Not Appear In VS Code

Verify Hermes is on your PATH:

```powershell
hermes --version
```

Then:

```powershell
hermes acp --check
```

Reconnect ACP afterward.

### Commands Run In The Wrong Environment

Open VS Code from the correct shell:

```powershell
cd B:\Dev\Project
code .
```

This ensures the workspace, environment variables, and terminal context match what Hermes sees.

### Wrong Files Are Being Modified

Open the repository root rather than a nested folder.

Agent tooling works best when the workspace boundary matches the actual project root.

## Why This Setup Works

The biggest improvement isn't better code generation.

It's reducing context switching.

You stay inside:

* VS Code
* your repository
* your terminal
* your Git workflow

The agent becomes part of the development environment instead of another browser tab demanding attention.

For me, that's the real promise of AI-assisted development: not replacing engineering workflows, but integrating directly into them.
