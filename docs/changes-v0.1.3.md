# v0.1.3 changes

- Fixed Obsidian-style article links that pointed to dated Markdown filenames instead of public article slugs.
- Added `normalizeArticleTarget()` in `src/lib/markdown.ts` to strip `.md` and leading `YYYY-MM-DD-` from wiki-link targets.
- Updated `scripts/Build-BlogStatic.ps1` to run `svelte-kit sync` before Vite build so `.svelte-kit/tsconfig.json` exists before TypeScript config resolution.
- Updated `package.json` to `0.1.3`.
- Moved Vite to `^8.0.0` to match the currently resolved SvelteKit/Vite plugin peer requirement from the local install log.
- Moved `@types/node` to `^24.0.0` because the local build is running on Node 24.

## Expected verification

```powershell
cd "<AI_WIKI_ROOT>\07_Projects\blog.ryanspice.com"
pnpm install
pnpm check
pnpm run build:blog
pnpm run deploy:plan
```

