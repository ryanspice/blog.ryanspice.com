# Dev Log Automation

This is the operating contract for the weekday blog dev-log and morning-brief run.

## Schedule

- Run once on weekday mornings at 8:15 AM America/Toronto.
- Skip publishing a dev-log entry when there are fewer than two meaningful work signals or when the only signals are routine file churn.
- Still write a private morning brief when there is useful focus guidance, even if the public dev log is not updated.

## Allowed sources

- The current blog repository: source files, docs, package scripts, and recent git history.
- Codex memory summaries and rollout summaries that are already readable in the local Codex memory folder.
- AI Wiki notes and Hermes output only through non-interactive helper surfaces that work in the automation shell.
- Claude, ChatGPT, or GPT conversation material only when it exists as an explicit local export or readable project memory. Do not scrape browser profiles, session stores, cookies, or credential-backed app databases.
- Public web research when a brief needs current external context. Prefer official docs, primary sources, release notes, standards, and project repositories.

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
