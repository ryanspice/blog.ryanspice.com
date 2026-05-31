# Blog fragment: Agent skills need provenance, not copy-folder archaeology

Most AI tooling demos show the fun part: the agent writes code, searches sources, runs tests, and generates a polished answer.

The part that decides whether the workflow survives longer than a week is duller:

> Can the agent trust its own operating context?

In my AI Wiki setup, that means reusable skills cannot live as random Markdown fragments forever. They need a repo-backed source of truth, provenance metadata, validation, duplicate policy, and boring package-manager hygiene.

The recent cleanup was a good example. The `agent-skills` repo had three problems tangled together: the command contract needed to be `pnpm`, provenance hashes had drifted after skill edits, and an old `repo-skill-recommender - Copy` lane was still polluting the skill surface.

The fix was not glamorous. Remove the copy lanes. Repair `skills/provenance.json`. Recalculate hashes. Keep dependency installs out of the synced AI Wiki/OneDrive clone. Validate with:

```powershell
pnpm run check
pnpm test
pnpm run build
pnpm run aiwiki:status
pnpm run aiwiki:rebuild-indexes -- --apply
```

The useful lesson is that search is not governance. Search can find everything, including stale copies, half-promoted drafts, and old generated junk. A working AI skill library needs to say what is canonical, what is candidate, what is historical, and what should be ignored.

That becomes even more important when building deep-research workflows. If the research agent depends on unclear skills, stale notes, or duplicated source lanes, the final report can look polished while being structurally untrustworthy.

Better AI work is not just better models. It is cleaner context maintenance.
