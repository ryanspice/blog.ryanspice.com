import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
	'package.json',
	'svelte.config.js',
	'vite.config.ts',
	'src/routes/+page.svelte',
	'src/routes/[slug]/+page.ts',
	'src/routes/rss.xml/+server.ts',
	'src/routes/robots.txt/+server.ts',
	'src/routes/sitemap.xml/+server.ts',
	'src/lib/articles.ts',
	'src/lib/content/articles/debugging-gimp-3-python-plugin-failures-windows-windhawk.md',
	'src/lib/content/articles/gimp-3-repair-photogimp-pixelboats-workstation.md',
	'src/lib/content/articles/how-chatgpt-performs-deep-research.md',
	'src/lib/content/articles/phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game.md',
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
