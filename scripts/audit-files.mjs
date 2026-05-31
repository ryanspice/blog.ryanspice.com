import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
	'package.json',
	'.env.example',
	'README.md',
	'svelte.config.js',
	'vite.config.ts',
	'src/routes/+page.svelte',
	'src/routes/dev-log/+page.svelte',
	'src/routes/login/+page.svelte',
	'src/routes/login/+page.ts',
	'src/routes/auth/callback/+page.svelte',
	'src/routes/auth/callback/+page.ts',
	'src/routes/drafts/+page.svelte',
	'src/routes/drafts/+page.ts',
	'src/routes/drafts/[slug]/+page.svelte',
	'src/routes/drafts/[slug]/+page.ts',
	'src/routes/[slug]/+page.ts',
	'src/routes/rss.xml/+server.ts',
	'src/routes/robots.txt/+server.ts',
	'src/routes/sitemap.xml/+server.ts',
	'src/lib/auth.ts',
	'src/lib/article-links.ts',
	'src/lib/dev-log.ts',
	'src/lib/articles.ts',
	'src/lib/components/FooterAuthControls.svelte',
	'src/lib/content/articles/debugging-gimp-3-python-plugin-failures-windows-windhawk.md',
	'src/lib/content/articles/gimp-3-repair-photogimp-pixelboats-workstation.md',
	'src/lib/content/articles/hermes-deepseek-setup.md',
	'src/lib/content/articles/how-chatgpt-performs-deep-research.md',
	'src/lib/content/articles/ingesting-voxel-engine-optimisations-ai-wiki-pixelboats.md',
	'src/lib/content/articles/pixelboats-networking-final-recommendation.md',
	'src/lib/content/articles/pixelboats-networking-player-hosted-php.md',
	'src/lib/content/articles/pixelboats-water-pipeline-pixi-webgl.md',
	'src/lib/content/articles/phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game.md',
	'src/lib/content/articles/ship-fast-for-windows-microsoft-store-playbook.md',
	'src/lib/content/articles/what-can-you-actually-do-with-a-deepseek-api-key.md',
	'context/source-fragments/dev-log.md',
	'context/source-html/gimp-repair-blog-realworld-demo-v0.1.0.html',
	'context/source-html/gimp-windhawk-debug-blog-realworld-demo-v0.1.0.html',
	'.thoughts'
];

let failed = false;
for (const item of required) {
	const full = path.join(root, item);
	if (!fs.existsSync(full)) {
		console.error(`missing: ${item}`);
		failed = true;
	} else {
		console.log(`ok: ${item}`);
	}
}

process.exitCode = failed ? 1 : 0;
