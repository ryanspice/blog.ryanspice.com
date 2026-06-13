import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
	'package.json',
	'pnpm-lock.yaml',
	'.env.example',
	'README.md',
	'svelte.config.js',
	'vite.config.ts',
	'.github/workflows/deploy-blog.yml',
	'docs/deployment.md',
	'scripts/Build-BlogStatic.ps1',
	'scripts/Deploy-BlogStatic.ps1',
	'scripts/audit-files.mjs',
	'scripts/audit-prerender-output.mjs',
	'adapter/index.js',
	'adapter/source-manifest.json',
	'src/routes/+layout.server.ts',
	'src/routes/+layout.svelte',
	'src/routes/+page.server.ts',
	'src/routes/+page.svelte',
	'src/routes/[slug]/+page.server.ts',
	'src/routes/[slug]/+page.svelte',
	'src/routes/[lang=lang]/+page.server.ts',
	'src/routes/[lang=lang]/+page.svelte',
	'src/routes/[lang=lang]/[slug]/+page.server.ts',
	'src/routes/[lang=lang]/[slug]/+page.svelte',
	'src/routes/login/+page.svelte',
	'src/routes/auth/callback/+page.svelte',
	'src/routes/drafts/+page.svelte',
	'src/routes/drafts/[slug]/+page.server.ts',
	'src/routes/drafts/[slug]/+page.svelte',
	'src/routes/briefs/+page.svelte',
	'src/routes/briefs/[slug]/+page.server.ts',
	'src/routes/briefs/[slug]/+page.svelte',
	'src/routes/dev-log/+page.svelte',
	'src/routes/library/+page.server.ts',
	'src/routes/library/+page.svelte',
	'src/routes/status/+page.server.ts',
	'src/routes/status/+page.svelte',
	'src/routes/rss-reader/+page.server.ts',
	'src/routes/rss-reader/+page.svelte',
	'src/routes/rss.xml/+server.ts',
	'src/routes/robots.txt/+server.ts',
	'src/routes/sitemap.xml/+server.ts',
	'src/routes/status.json/+server.ts',
	'src/routes/status.live.json/+server.php',
	'src/lib/auth.ts',
	'src/lib/article-frontmatter.ts',
	'src/lib/article-links.ts',
	'src/lib/articles.ts',
	'src/lib/dev-log.ts',
	'src/lib/markdown.ts',
	'src/lib/morning-briefs.ts',
	'src/lib/research-library.ts',
	'src/lib/server/draft-metadata.ts',
	'src/lib/server/home-page.ts',
	'src/lib/server/rss.ts',
	'src/lib/i18n/locales.ts',
	'src/lib/i18n/dictionaries.ts',
	'src/lib/components/ArticleView.svelte',
	'src/lib/components/FooterAuthControls.svelte',
	'src/lib/components/SiteHeader.svelte',
	'src/lib/content/articles/how-chatgpt-performs-deep-research.md',
	'src/lib/content/articles/openjarvis-local-ai-personal-ai-on-your-pc.md',
	'src/lib/content/articles/recover-deepseek-gui-conversations-after-update.md',
	'src/lib/content/articles/fr/openjarvis-local-ai-personal-ai-on-your-pc.md',
	'context/source-fragments/dev-log.md',
	'context/source-html/gimp-repair-blog-realworld-demo-v0.1.0.html',
	'context/source-html/gimp-windhawk-debug-blog-realworld-demo-v0.1.0.html',
	'.thoughts'
];

const requiredCollections = [
	{
		dir: 'src/lib/content/articles',
		extension: '.md',
		minimum: 20,
		label: 'article markdown files'
	},
	{
		dir: 'src/lib/content/morning-briefs',
		extension: '.md',
		minimum: 4,
		label: 'morning brief markdown files'
	}
];

let failed = false;

for (const item of requiredFiles) {
	const full = path.join(root, item);
	if (!fs.existsSync(full)) {
		console.error(`missing: ${item}`);
		failed = true;
	} else {
		console.log(`ok: ${item}`);
	}
}

for (const collection of requiredCollections) {
	const full = path.join(root, collection.dir);
	const files = fs.existsSync(full)
		? walkFiles(full).filter((file) => file.endsWith(collection.extension))
		: [];

	if (files.length < collection.minimum) {
		console.error(
			`missing: expected at least ${collection.minimum} ${collection.label} in ${collection.dir}, found ${files.length}`
		);
		failed = true;
	} else {
		console.log(`ok: ${collection.dir} (${files.length} ${collection.label})`);
	}
}

process.exitCode = failed ? 1 : 0;

function walkFiles(dir) {
	const files = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walkFiles(full));
		} else if (entry.isFile()) {
			files.push(toPosix(path.relative(root, full)));
		}
	}
	return files;
}

function toPosix(value) {
	return value.replace(/\\/g, '/');
}
