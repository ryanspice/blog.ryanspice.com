import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const buildDir = path.join(root, process.env.BLOG_BUILD_DIR ?? 'build');
const adapterMode = process.env.ADAPTER_MODE ?? 'php-static';

const requiredFiles = [
	'index.php',
	'.htaccess',
	'router.php',
	'_runtime/compat.php',
	'_app/version.json',
	'adapter/route-manifest.php',
	'tower-accent.php',
	'robots.txt',
	'sitemap.xml',
	'rss.xml'
];

if (adapterMode === 'js-ssr') {
	requiredFiles.push('server/handler.mjs', 'server/index.js');
} else {
	requiredFiles.push('_protected/.htaccess');
}

const bannedMarkers = [
	'http://localhost',
	'https://localhost',
	'http://127.0.0.1',
	'https://127.0.0.1',
	'http://sveltekit-prerender'
];

const bannedFileNames = new Set([
	'debug_payload.json',
	'adapter_debug.log',
	'debug_env.txt',
	'php.stderr.log',
	'php.stdout.log',
	'sidecar.stderr.log',
	'sidecar.stdout.log'
]);
const protectedPaths = ['_protected'];

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

function rel(filePath) {
	return path.relative(root, filePath).replace(/\\/g, '/');
}

function hasAnyBuildFile(paths) {
	return paths.some((item) => fs.existsSync(path.join(buildDir, item)));
}

function textFromBuildFiles(paths) {
	return paths
		.map((item) => path.join(buildDir, item))
		.filter((file) => fs.existsSync(file))
		.map((file) => {
			try {
				return readText(file);
			} catch {
				return '';
			}
		})
		.join('\n');
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

for (const protectedPath of protectedPaths) {
	const htaccess = path.join(buildDir, protectedPath, '.htaccess');
	if (!fs.existsSync(path.join(buildDir, protectedPath)) && adapterMode === 'js-ssr') {
		continue;
	}
	if (!fs.existsSync(htaccess)) {
		console.error(`missing: build/${protectedPath}/.htaccess`);
		failed = true;
		continue;
	}
	const contents = readText(htaccess);
	if (!/Require\s+all\s+denied/i.test(contents) && !/Deny\s+from\s+all/i.test(contents)) {
		console.error(`fail: build/${protectedPath}/.htaccess does not deny direct access`);
		failed = true;
	}
}

const htaccessPath = path.join(buildDir, '.htaccess');
if (fs.existsSync(htaccessPath)) {
	const htaccess = readText(htaccessPath);
	if (!/RewriteEngine\s+On/i.test(htaccess)) {
		console.error('fail: build/.htaccess missing RewriteEngine On');
		failed = true;
	}
	if (!/__data\?\.json/i.test(htaccess)) {
		console.error('fail: build/.htaccess missing __data.json rewrite support');
		failed = true;
	}
}

const homepageRuntimeFiles = ['index.php', '__data.php', '__data.template.json', '_protected/_page.php'];
if (!hasAnyBuildFile(homepageRuntimeFiles)) {
	console.error('fail: homepage runtime output missing index/data files');
	failed = true;
} else {
	const homepageOutput = textFromBuildFiles(homepageRuntimeFiles);
	const requiredHomepageMarkers = [
		'Recent published posts',
		'publishedArticles',
		'how-chatgpt-performs-deep-research'
	];

	for (const marker of requiredHomepageMarkers) {
		if (!homepageOutput.includes(marker)) {
			console.error(`fail: homepage production output missing marker: ${marker}`);
			failed = true;
		}
	}
}

const allFiles = walk(buildDir);
for (const file of allFiles) {
	if (bannedFileNames.has(path.basename(file))) {
		console.error(`fail: banned debug artifact present at ${rel(file)}`);
		failed = true;
	}
}

const textFiles = allFiles.filter(
	(file) =>
		(rel(file).startsWith('build/server/') === false &&
			rel(file).startsWith('build/adapter/') === false &&
			(/\.(html|xml|txt|js|php|json)$/i.test(file) || path.basename(file) === '.htaccess'))
);

for (const file of textFiles) {
	let contents = '';
	try {
		contents = readText(file);
	} catch {
		continue;
	}

	for (const marker of bannedMarkers) {
		if (contents.includes(marker)) {
			console.error(`fail: found "${marker}" in ${rel(file)}`);
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
