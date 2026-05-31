# Blog publish checklist: Agent Skills Provenance and pnpm

Before publishing to `blog.ryanspice.com`:

- [ ] Replace or remove machine-specific local paths.
- [ ] Decide whether this is a full post or a fragment inside a broader Prompt Operations article.
- [ ] Add screenshots only if they clarify validation/index output.
- [ ] Link to `ryanspice/agent-skills` when the relevant branch/PR is public-ready.
- [ ] Avoid claiming the deep-research skill promotion is complete until the final promotion commit lands.
- [ ] Keep `pnpm` guidance clear: validation scripts are dependency-free, but command contract should still be pnpm.
- [ ] If adding source links, cite repo README, provenance validator, and Prompt Operations Handbook chapter.
- [ ] Consider adding a diagram: `skills -> provenance manifest -> validator -> AI Wiki indexes -> active skill set`.
