---
title: "A Love of Digital Technology Bridges Canopy Into the Fold"
slug: "a-love-of-digital-technology-bridges-canopy-into-the-fold"
status: "published"
draft_type: "technical-note"
date: "2026-06-15"
updated_date: "2026-06-15"
audience:
  - "technical founders"
  - "small teams maintaining practical web infrastructure"
  - "clients and collaborators following Canopy Digital"
possible_publication_targets:
  - "ryanspice.com"
  - "blog.canopydigital.ca"
tags:
  - "Canopy Digital"
  - "SvelteKit"
  - "static publishing"
  - "technical operations"
  - "personal website"
  - "web infrastructure"
credits:
  - "Ryan Spice"
related_posts:
  - "how-i-turned-vs-code-ai-engineering-workbench-hermes"
  - "why-im-using-hermes-ai-builder-vs-code"
  - "ship-fast-for-windows-microsoft-store-playbook"
image: "/img/articles/a-love-of-digital-technology-bridges-canopy-into-the-fold/canopy-fold-architecture.svg"
image_alt: "Diagram showing one blog source publishing to a Ryan Spice site and a Canopy Digital themed site."
row_image: "/img/articles/a-love-of-digital-technology-bridges-canopy-into-the-fold/canopy-fold-architecture.svg"
row_image_alt: "Diagram of a shared publishing pipeline branching into Ryan Spice and Canopy Digital blog surfaces."
background_image: "/img/articles/a-love-of-digital-technology-bridges-canopy-into-the-fold/canopy-fold-architecture.svg"
background_image_alt: "Shared source and dual-domain publishing diagram."
summary: "A short note on bringing Canopy Digital into the same publishing fold as the personal technical blog without duplicating the content system."
---
# A Love of Digital Technology Bridges Canopy Into the Fold

I have always liked the part of digital work where the system gets simpler after the decision is made.

Not simpler because the work is smaller.

Simpler because the shape is finally honest.

That is what happened with the blog and Canopy Digital.

For a while, the personal site and Canopy could have become two separate little web systems. Two themes. Two deployment habits. Two content lanes. Two places to forget a fix. That is easy to start and annoying to maintain.

The better answer was to bring Canopy into the fold.

Same source.

Same writing system.

Same publishing discipline.

Different public surface.

## Why This Is Worth Doing

The personal blog has become more than a place to post articles. It is a working record of how I build, test, route AI-assisted development, repair tooling, make small product decisions, and keep technical ideas from disappearing into chat history.

Canopy Digital should be able to share that energy without copying the whole machine.

That matters because the audience is adjacent, not identical.

On the personal site, the voice can stay closer to the bench: agent stacks, SvelteKit, local automation, deployment notes, PixelBoats, debugging, and all the little engineering trails that make a system real.

On the Canopy blog, the same material can sit inside a quieter business-facing frame. The content can still be technical, but the shell should feel like Canopy: lighter, more client-readable, and less tied to the personal-site utilities that only matter to me.

The technical move is small, but the operating result is useful.

## The Pattern

The site now has a lightweight site-flavor layer.

```text
One content system
One SvelteKit build
One static publishing pipeline

Site flavor: Ryan
  domain: blog.ryanspice.com
  theme: personal technical blog
  includes: dev log, library, owner utilities

Site flavor: Canopy
  domain: blog.canopydigital.ca
  theme: Canopy Digital
  includes: published articles, Canopy metadata, Canopy RSS, Canopy sitemap
```

The important part is what this avoids.

It avoids a clone that slowly drifts.

It avoids a second CMS.

It avoids writing the same post twice.

It avoids pretending a business blog needs a totally different content engine when the real difference is the public frame.

That is usually where small websites get messy. The code starts duplicating the brand instead of separating the brand from the publishing system.

## What Changes For Readers

On `blog.ryanspice.com`, the site remains the full personal technical surface.

On `blog.canopydigital.ca`, the same published article stream gets a Canopy-themed shell. The Canopy build uses its own metadata, RSS title, sitemap host, robots policy, and lighter visual treatment.

That means a post like this can exist in both places and make sense in both contexts.

The Ryan version says: here is the engineering note.

The Canopy version says: here is how we think about practical web infrastructure.

Same source. Different doorway.

## The Deployment Rule

The branch model is also being tightened around the same idea.

`main` is for work.

`production` is for publishing.

Pull requests and pushes into the working lane should run checks and tests, not publish the internet by accident. Production deploys should happen from the production branch, and when that branch moves forward, both domains should be built and deployed from the same commit.

That keeps the promise simple:

```text
If it is in production, both sites can publish it.
If it is still being worked on, neither site should surprise-deploy it.
```

This is not flashy infrastructure. It is the kind of boring rule that makes publishing safer.

## Why I Like This

This is the part of digital technology I keep coming back to.

You can take something that feels like a branding question and solve it with architecture.

You can take something that feels like a deployment question and solve it with a branch rule.

You can take something that feels like duplicate work and make it a configuration choice.

That is the bridge I wanted between the personal blog and Canopy Digital.

Not two sites pretending they are unrelated.

Not one site wearing two masks badly.

One publishing system with enough structure to serve both.

That feels right for Canopy: practical, lightweight, maintainable, and grounded in the work.
