# Dev Log Automation

This is the operating contract for the blog dev-log and owner-gated morning-brief run.

## Schedule

- Run the primary owner-gated weekly brief on Monday mornings at about 8:00 AM America/Toronto.
- Additional weekday runs can still create short briefs or dev-log entries when an automation wakeup asks for them and there are useful work signals.
- Skip publishing a dev-log entry when there are fewer than two meaningful work signals or when the only signals are routine file churn.
- Still write a private morning brief when there is useful focus guidance, even if the public dev log is not updated.

## Allowed sources

- The current blog repository: source files, docs, package scripts, and recent git history.
- Codex memory summaries and rollout summaries that are already readable in the local Codex memory folder.
- AI Wiki notes, Hermes output, Hermes profile or skill docs, and local agent-runtime docs only through readable files or non-interactive helper surfaces that work in the automation shell.
- Claude, ChatGPT, GPT, DeepSeek, or other assistant conversation material only when it exists as an explicit local export or readable project memory. Do not scrape browser profiles, session stores, cookies, credential-backed app databases, app credentials, or private runtime storage.
- Public web research when a brief needs current external context. Prefer official docs, primary sources, release notes, standards, and project repositories.

### Local agent memory surfaces

Treat these local agent roots as source candidates for the weekday dev-log and morning-brief workflow, but default to metadata, inventory, generated summaries, project memory, skills, plugins, and explicit exports. Do not mine private runtime databases or credential-bearing files for publishable material.

- Claude user root: settings, sessions/history metadata, skills, plugins, and project memory, including PixelBoats project memory.
- Hermes user root: config, skills, skins, dashboard themes, and non-secret project notes.
- Hermes local data root: profiles, sessions/log metadata, memories, hooks, cron, launchers, `SOUL.md`, `USER.md`, and non-secret config summaries.
- Codex user root: sessions/rollout summaries, memories, skills, automations, plugins, and non-secret agent instructions.
- AI Wiki hidden/runtime folders: `.claude`, `.deepseekgui`, explicit ChatGPT/GPT exports, GPT bridge outputs, curated project-source bundles, and project memory notes.

Use these as strict no-go files unless the user explicitly asks for a separate private recovery/security task:

- Claude credentials and raw credential stores.
- Hermes `.env`, auth stores, and large state databases.
- Codex auth files, browser data, logs/state/memory SQLite databases, and credential-like config.
- Raw browser profiles, cookies, session stores, local storage, cache folders, and credential-backed app databases.
- Raw assistant conversation bodies from sessions/history unless they were explicitly exported or curated as project memory.

For routine automation, it is acceptable to count files, extensions, sizes, timestamps, and project/workspace metadata. Public or website-readable briefs must summarize these sources as coarse labels such as `Claude local memory`, `Hermes local memory`, `Codex memory`, `AI Wiki`, `PixelBoats project memory`, or `DeepSeek GUI metadata`; do not publish exact local paths.

## Privacy rules

- Do not publish secrets, token names with values, `.env` contents, private keys, account IDs, emails, or raw private messages.
- Do not publish raw local filesystem paths. Replace them with coarse labels such as `blog repo`, `AI Wiki`, `PixelBoats repo`, `Windows app repo`, or `Codex memory`.
- Do not include private client names or private personal details unless they are already intentionally public in the blog.
- Summarize evidence. Do not quote private conversations.
- Keep public entries useful without making the dev log a surveillance trail.

## Output files

- Public/process-visible: update `src/lib/dev-log.ts` only when there is enough signal.
- Private/project-local source notes: write morning briefs under `context/morning-briefs/YYYY-MM-DD.md`.
- Private website lane: write sanitized, owner-readable briefs under `src/lib/content/morning-briefs/YYYY-MM-DD-slug.md` with frontmatter for `title`, `date`, `summary`, `tags`, `projects`, and `status: private`.
- The website brief lane uses the same Microsoft owner UI gate as drafts. It is not a server-enforced secret store, so every brief must remain sanitized before it enters `src/lib/content/morning-briefs/`.
- Do not commit, push, deploy, publish, or clean deployment buckets from the automation run.

## Dev-log entry shape

Each public entry needs:

- `date`
- `title`
- `summary`
- `source`
- `tags`
- `relatedArticleTags`
- `accent`

Use short tags that will still make sense months later. Prefer topic tags such as:

- `blog`
- `pixelboats`
- `sveltekit-php`
- `ai-wiki`
- `hurrcut`
- `keyword-astro`
- `lg-ultragear`
- `sidecar`
- `12bar`
- `seo`
- `windows-apps`
- `automation`
- `research`

Use `relatedArticleTags` to connect a dev-log entry to public article filters, for example `PixelBoats`, `SvelteKit`, `Windows`, `Microsoft Store`, `SEO`, `AI`, or `developer workflow`.

## Morning brief shape

Keep each brief short:

1. Date and source window.
2. What changed.
3. What to focus on today.
4. Research queue.
5. Watchlist or blockers.
6. Suggested public tags if a dev-log entry was created.
7. Privacy notes.

Use searchable tags in the frontmatter and in the brief body. Prefer stable project/topic tags over raw filenames, exact local paths, or private conversation labels.

## Research lane

Use the active project signals to choose research. Current priority clusters:

- PixelBoats: water rendering, Sea Loop feel, GDD/lore continuity, tavern slice, HUD readability.
- SvelteKit PHP adapter: release proof, host behavior, static/PHP routing, native-host bridge evidence.
- AI Wiki and Hermes: non-interactive helper reliability, searchable memory, portable skill/context packaging.
- keyword-astro and SEO audit: connector quality, partial-success UX, Windows Store packaging, practical SEO workflows.
- HurrCut, Sidecar, 12Bar, LG UltraGear, EFSDB, live wallpapers, and Needle: keep on the watchlist unless recent signals show active movement.

## Verification

After changing code:

```powershell
pnpm check
```

Run `pnpm run build:blog` when the change affects routes, article rendering, RSS, sitemap, or deployment output.
