# Codex prompt: finish deep-research skill promotion after provenance cleanup

We are in the `ryanspice/agent-skills` repo, currently consumed by the AI Wiki under `04_skills/agent-skills/skills`.

Current state:

- pnpm command contract is fixed.
- repo-skill-recommender copy lanes were removed.
- validation passes using `pnpm run check`, `pnpm test`, and `pnpm run build`.
- AI Wiki indexes rebuild with `pnpm run aiwiki:rebuild-indexes -- --apply`.
- Remaining untracked intended additions:
  - `skills/deep-research-workflow/`
  - `skills/enterprise-deep-research-workflow/`
  - `skills/candidates/deepseek-research-api-substrate-v0.1.0/`

Task:

1. Inspect the three untracked skill folders.
2. Ensure each `SKILL.md` has correct frontmatter:
   - `name` or `title`
   - `version`
   - `status`
   - `provenance_origin`
   - `provenance_source_path`
   - `provenance_credit`
   - `provenance_ingested_as`
   - `provenance_note`
   - `provenance_upstream` only where modified/adapted.
3. Update `skills/provenance.json` with all new skill documents and support files, including SHA-256 hashes.
4. Update `skills/README.md` index rows.
5. Run:

```powershell
pnpm run check
pnpm test
pnpm run build
pnpm run aiwiki:status
pnpm run aiwiki:rebuild-indexes -- --apply
```

6. Commit with:

```powershell
git add -A -- skills/deep-research-workflow skills/enterprise-deep-research-workflow skills/candidates/deepseek-research-api-substrate-v0.1.0 skills/provenance.json skills/README.md
git commit -m "feat: promote deep research workflow skills"
```

Constraints:

- Do not reintroduce `repo-skill-recommender - Copy` or `repo-skill-recommender-copy`.
- Do not install dependencies into the OneDrive-backed AI Wiki clone.
- Use pnpm command contract only.
- Keep DeepSeek as a candidate unless source/API validation is upgraded.
