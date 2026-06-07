---
title: "Why I'm Using Hermes as My AI Builder Inside VS Code"
slug: "why-im-using-hermes-ai-builder-vs-code"
status: "draft"
draft_type: "technical-workflow-guide"
date: "2026-06-07"
updated_date: "2026-06-07"
audience:
  - "frontend and platform engineers"
  - "AI-assisted development users"
  - "VS Code users"
  - "developers building agent workflows"
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
  - local models
  - prompt operations
credits:
  - "Ryan Spice"
related_posts:
  - "how-i-turned-vs-code-ai-engineering-workbench-hermes"
  - "hermes-deepseek-setup"
  - "best-ways-to-use-gpt-5-3-codex-spark"
summary: "A practical argument for using Hermes as the persistent AI agent runtime inside VS Code, with the editor as the workspace and ACP as the bridge between human workflow and agent execution."
---
# Why I'm Using Hermes as My AI Builder Inside VS Code

The AI coding landscape is changing quickly. Six months ago, most developers were choosing between chat interfaces, standalone coding agents, and autocomplete tools. Today, a different pattern is emerging: treat the editor as the workspace and let a dedicated agent runtime do the heavy lifting.

That's the approach I'm increasingly taking with Hermes and VS Code.

## The Shift From AI Chat To AI Runtime

Most AI coding tools began as conversations.

You opened a chat window, pasted code, asked questions, and copied results back into your project.

That workflow works well for small tasks, but it starts to break down when you're:

* Working across dozens of files
* Managing multiple repositories
* Running research tasks
* Maintaining long-term project context
* Building reusable workflows and skills

At that point, the problem isn't generating code. The problem is orchestration.

Hermes approaches this differently by acting as a persistent agent runtime rather than simply another chat interface.

## Why VS Code Still Matters

Despite all the excitement around AI-native tools, most engineering work still happens inside an editor.

Code review.

Debugging.

Git operations.

Testing.

Architecture discussions.

Documentation.

For me, VS Code remains the center of that workflow.

Instead of replacing the editor, Hermes plugs into it through ACP (Agent Client Protocol), allowing the agent to operate directly within the development environment. The editor becomes the human interface while Hermes handles reasoning, tool execution, memory, and workflow automation.

## The Architecture I Actually Want

Rather than stacking multiple competing AI assistants, I prefer a layered approach:

```text
VS Code
├── GitHub Copilot (autocomplete)
├── Hermes (agent runtime)
├── Local models
├── Cloud models
└── Project knowledge systems
```

Each component has a clear responsibility.

Autocomplete remains autocomplete.

The agent handles multi-step work.

The editor stays focused on editing.

This separation reduces friction and makes the workflow easier to reason about.

## Why ACP Is Interesting

ACP is starting to feel a lot like what LSP did for language tooling.

Instead of every AI vendor inventing its own editor integration, ACP provides a common way for editors and agents to communicate. VS Code clients can connect to Hermes, and Hermes can expose tools, sessions, file operations, terminal execution, and approvals through a standardized interface.

That means the editor isn't locked to a specific AI provider.

The agent becomes swappable.

The workflow becomes portable.

That's a much healthier direction for the ecosystem.

## What Hermes Brings To The Table

What makes Hermes particularly interesting isn't just model access.

It's the combination of:

* Persistent memory
* Skills and reusable workflows
* Tool execution
* Session history
* Multi-provider routing
* Local and remote deployment options

The result is an agent that can evolve alongside your development process instead of starting from scratch every session.

## Where I See This Going

The next generation of developer tooling won't be about finding the single best model.

It will be about building durable systems around models.

Editors.

Agents.

Knowledge bases.

Automation.

Documentation.

Operational workflows.

The winning setup will be the one that lets developers move between models and providers without rebuilding everything each time.

That's why I'm increasingly treating Hermes as the runtime and VS Code as the interface.

The editor stays familiar.

The workflow becomes more powerful.

And the underlying models can change without forcing a complete reset of how I work.
