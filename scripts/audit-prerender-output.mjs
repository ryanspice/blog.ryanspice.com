import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const buildDir = path.join(root, process.env.BLOG_BUILD_DIR ?? 'build');

const requiredFiles = ['index.html', 'robots.txt', 'sitemap.xml', 'rss.xml', '.htaccess'];
const bannedMarkers = [
	'http://localhost',
	'https://localhost',
	'http://127.0.0.1',
	'https://127.0.0.1',
	'http://sveltekit-prerender'
];

function walk(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walk(full));
		} else if (entry.isFile()) {
			files.push(full);
		}
	}
	return files;
}

function readText(filePath) {
	return fs.readFileSync(filePath, 'utf8');
}

let failed = false;

if (!fs.existsSync(buildDir)) {
	console.error(`missing: build dir (${buildDir})`);
	process.exit(1);
}

for (const item of requiredFiles) {
	const full = path.join(buildDir, item);
	if (!fs.existsSync(full)) {
		console.error(`missing: build/${item}`);
		failed = true;
	} else {
		console.log(`ok: build/${item}`);
	}
}

const textFiles = walk(buildDir).filter((file) => /\.(html|xml|txt|js)$/.test(file));

for (const file of textFiles) {
	let contents = '';
	try {
		contents = readText(file);
	} catch {
		continue;
	}

	for (const marker of bannedMarkers) {
		if (contents.includes(marker)) {
			console.error(`fail: found "${marker}" in ${path.relative(root, file).replace(/\\/g, '/')}`);
			failed = true;
		}
	}
}

if (fs.existsSync(path.join(buildDir, 'robots.txt'))) {
	const robots = readText(path.join(buildDir, 'robots.txt'));
	if (!/Sitemap:\s+https?:\/\/\S+/i.test(robots)) {
		console.error('fail: robots.txt missing Sitemap: line');
		failed = true;
	}
}

if (fs.existsSync(path.join(buildDir, 'sitemap.xml'))) {
	const sitemap = readText(path.join(buildDir, 'sitemap.xml'));
	if (!sitemap.includes('<urlset')) {
		console.error('fail: sitemap.xml missing <urlset>');
		failed = true;
	}
	if (!sitemap.includes('<loc>')) {
		console.error('fail: sitemap.xml missing <loc>');
		failed = true;
	}
}

process.exitCode = failed ? 1 : 0;
