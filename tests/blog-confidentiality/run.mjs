import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { testGeneratorAliases } from './generator-aliases.mjs';
import { testMountedPreviews } from './mounted-preview.mjs';

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testRoot, '..', '..');
const fixtureRoot = path.join(testRoot, 'fixtures');
const kitBin = path.join(repoRoot, 'node_modules', '@sveltejs', 'kit', 'svelte-kit.js');
const viteBin = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const phpBinary = process.env.PHP_BIN || 'php';
const phpBinaryAvailable = phpBinary.includes(path.sep) ? fs.existsSync(phpBinary) : true;

const publicSentinels = {
	en: 'PUBLIC_EN_BODY_SENTINEL_7F3A9C21D8E4',
	fr: 'PUBLIC_FR_BODY_SENTINEL_2B6D4E80A1C7',
	version: 'PUBLIC_VERSION_BODY_SENTINEL_9C1F6A32E7B4'
};

const privateSentinels = [
	'PRIVATE_VERSION_BODY_SENTINEL_4D8B2E61F9A3',
	'FUTURE_VERSION_BODY_SENTINEL_6A2C9E13B7D5',
	'PRIVATE_DRAFT_SUMMARY_SENTINEL_7B1E4A9C3D6F',
	'PRIVATE_DRAFT_BODY_SENTINEL_8E5B1D47C2F9',
	'PRIVATE_BRIEF_TITLE_SENTINEL_3F7A2C9D5E1B',
	'PRIVATE_BRIEF_SUMMARY_SENTINEL_A8D2F6C41E9B',
	'PRIVATE_BRIEF_BODY_SENTINEL_3F7A2C9D5E1B',
	'ARCHIVED_BRIEF_TITLE_SENTINEL_1C6E8B34A9D2',
	'ARCHIVED_BRIEF_SUMMARY_SENTINEL_5E9D1B7A3C8F',
	'ARCHIVED_BRIEF_BODY_SENTINEL_1C6E8B34A9D2'
];

const privateSlugs = [
	'synthetic-private-confidentiality-draft',
	'synthetic-private-brief',
	'synthetic-archived-brief'
];

const ownerEmail = 'confidentiality-owner@example.invalid';
const nonownerEmail = 'confidentiality-nonowner@example.invalid';
const ownerHash = crypto.createHash('sha256').update(ownerEmail).digest('hex');

const results = [];
const buildInfo = {};
const endpointInfo = {};

function record(name, ok, detail = {}) {
	results.push({ name, ok, ...detail });
	if (!ok) {
		console.error(`FAIL ${name}${Object.keys(detail).length ? ` ${JSON.stringify(detail)}` : ''}`);
	}
}

function assert(condition, name, detail = {}) {
	record(name, Boolean(condition), detail);
}

function assertEqual(name, actual, expected) {
	record(name, actual === expected, { actual, expected });
}

function tail(value, limit = 4000) {
	return value.length > limit ? value.slice(-limit) : value;
}

async function runCommand(args, label, environment) {
	const logPath = path.join(logRoot, `${label}.log`);
	const logFd = fs.openSync(logPath, 'w');
	console.log(`\n$ ${process.execPath} ${args.map((arg) => (arg.includes(' ') ? JSON.stringify(arg) : arg)).join(' ')}`);
	try {
		const result = await spawnSyncProcess(process.execPath, args, logFd, environment);
		if (result.status !== 0) {
			const output = fs.readFileSync(logPath, 'utf8');
			throw new Error(`${label} failed with exit ${result.status}\n${tail(output)}`);
		}
		return logPath;
	} finally {
		fs.closeSync(logFd);
	}
}

function spawnSyncProcess(command, args, logFd, environment) {
	// Spawn with inherited file descriptors, not pipes: the sandboxed Windows
	// environment cannot allocate named pipes for piped child stdio.
	const child = spawn(command, args, {
		cwd: workspaceRoot,
		env: { ...process.env, ...environment },
		stdio: ['ignore', logFd, logFd],
		windowsHide: true
	});
	let settled = false;
	const deadline = setTimeout(() => {
		if (settled) return;
		settled = true;
		try {
			child.kill();
		} catch {
			// Best effort.
		}
	}, 15 * 60 * 1000);

	return new Promise((resolve, reject) => {
		child.on('error', (error) => {
			clearTimeout(deadline);
			reject(error);
		});
		child.on('exit', (code, signal) => {
			clearTimeout(deadline);
			resolve({ status: code ?? (signal ? 1 : 0), signal });
		});
	});
}

async function copyFixtureContent() {
	const sourceRoot = path.join(fixtureRoot, 'content');
	const targetRoot = path.join(workspaceRoot, 'src', 'lib', 'content');
	await fsp.mkdir(path.join(targetRoot, 'articles', 'fr'), { recursive: true });
	await fsp.mkdir(path.join(targetRoot, 'articles', '.versions'), { recursive: true });
	await fsp.mkdir(path.join(targetRoot, 'morning-briefs'), { recursive: true });
	await fsp.cp(path.join(sourceRoot, 'articles'), path.join(targetRoot, 'articles'), {
		recursive: true,
		force: true
	});
	await fsp.cp(path.join(sourceRoot, 'morning-briefs'), path.join(targetRoot, 'morning-briefs'), {
		recursive: true,
		force: true
	});
}

// The fixture workspace must contain enough real public articles for the site's
// internal links and prerender crawl to resolve. Only files that are public by
// their own frontmatter are copied. Private article bodies are never copied or
// logged, and real version folders are deliberately excluded so the synthetic
// private/future version fixtures stay authoritative.
function frontmatterFields(raw) {
	const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
	if (!normalized.startsWith('---\n')) return {};
	const end = normalized.indexOf('\n---', 4);
	if (end < 0) return {};
	const fields = {};
	for (const line of normalized.slice(4, end).split('\n')) {
		const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
		if (!match) continue;
		fields[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '').trim();
	}
	return fields;
}

function isPublicFrontmatter(raw) {
	const fields = frontmatterFields(raw);
	if (fields.status === 'published') return true;
	const releaseDate = fields.release_date ?? '';
	if (!releaseDate) return false;
	const parsed = new Date(`${releaseDate}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return false;
	const now = new Date();
	const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	return parsed.getTime() <= todayUtc;
}

// The production build generates social cards before Vite runs. The isolated
// fixture build copies og-default.png to the public article social paths so the
// prerender crawl can resolve them without invoking Playwright.
async function ensureSocialImagePlaceholders() {
	const articlesRoot = path.join(workspaceRoot, 'src', 'lib', 'content', 'articles');
	const socialRoot = path.join(workspaceRoot, 'static', 'img', 'social', 'ryan', 'articles');
	const defaultImage = path.join(workspaceRoot, 'static', 'og-default.png');
	let created = 0;

	for (const [directory, locale] of [
		[articlesRoot, 'en'],
		[path.join(articlesRoot, 'fr'), 'fr']
	]) {
		let entries = [];
		try {
			entries = await fsp.readdir(directory, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
			const raw = await readPublicFrontmatterOnly(path.join(directory, entry.name));
			if (!isPublicFrontmatter(raw)) continue;
			const fields = frontmatterFields(raw);
			const slug =
				fields.slug ||
				entry.name.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
			if (!slug) continue;
			const relative = locale === 'fr' ? path.join('fr', `${slug}.png`) : `${slug}.png`;
			const target = path.join(socialRoot, relative);
			try {
				await fsp.access(target);
				continue;
			} catch {
				// Missing card: create the placeholder below.
			}
			await fsp.mkdir(path.dirname(target), { recursive: true });
			await fsp.copyFile(defaultImage, target);
			created += 1;
		}
	}

	buildInfo.socialPlaceholdersCreated = created;
}

async function readPublicFrontmatterOnly(file) {
	const handle = await fsp.open(file, 'r');
	try {
		const buffer = Buffer.alloc(512);
		let collected = '';
		let offset = 0;
		while (offset < 32768) {
			const { bytesRead } = await handle.read(buffer, 0, buffer.length, offset);
			if (!bytesRead) break;
			offset += bytesRead;
			collected += buffer.subarray(0, bytesRead).toString('utf8');
			if (!collected.startsWith('---')) return collected;
			const end = collected.indexOf('\n---', 4);
			if (end >= 0) return collected.slice(0, end + 4);
		}
		return collected;
	} finally {
		await handle.close();
	}
}

async function copyPublicArticleSources() {
	const sourceRoot =
		process.env.BLOG_CONFIDENTIALITY_PUBLIC_CONTENT_ROOT ||
		path.join(repoRoot, 'src', 'lib', 'content', 'articles');
	const targetRoot = path.join(workspaceRoot, 'src', 'lib', 'content', 'articles');
	let copied = 0;

	for (const [directory, targetDirectory] of [
		[sourceRoot, targetRoot],
		[path.join(sourceRoot, 'fr'), path.join(targetRoot, 'fr')]
	]) {
		let entries = [];
		try {
			entries = await fsp.readdir(directory, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
			const source = path.join(directory, entry.name);
			const frontmatter = await readPublicFrontmatterOnly(source);
			if (!isPublicFrontmatter(frontmatter)) continue;
			await fsp.copyFile(source, path.join(targetDirectory, entry.name));
			copied += 1;
		}
	}

	buildInfo.copiedPublicArticleCount = copied;
}

async function walk(directory) {
	const entries = await fsp.readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(full)));
		else if (entry.isFile()) files.push(full);
	}
	return files;
}

function fileContains(buffer, value) {
	return buffer.includes(Buffer.from(value));
}

async function auditBuild() {
	const buildRoot = path.join(workspaceRoot, 'build');
	const privateRoot = path.join(workspaceRoot, 'output', 'private-content');
	const files = await walk(buildRoot);
	buildInfo.buildFileCount = files.length;
	buildInfo.buildRoot = buildRoot;
	buildInfo.privateRoot = privateRoot;
	const sourceHeaders = await fsp.readFile(path.join(workspaceRoot, 'static', '.htaccess'), 'utf8');
	const builtHeaders = await fsp.readFile(path.join(buildRoot, '.htaccess'), 'utf8');
	const policyPattern = /Header always set Content-Security-Policy "([^"]+)"/g;
	const sourcePolicies = [...sourceHeaders.matchAll(policyPattern)].map((match) => match[1]);
	const builtPolicies = [...builtHeaders.matchAll(policyPattern)].map((match) => match[1]);
	// This fixture runs Vite directly. Build-BlogStatic.ps1 merges the site header
	// overlay afterward; the raw adapter must not add a conflicting CSP.
	record('raw adapter has no conflicting CSP', sourcePolicies.length === 1 &&
		builtPolicies.every((policy) => policy === sourcePolicies[0]));
	const connect = sourcePolicies[0]?.split(';').map((part) => part.trim())
		.find((part) => part.startsWith('connect-src '));
	record('CSP permits only self and exact Microsoft authority connections',
		connect === "connect-src 'self' https://login.microsoftonline.com");

	const findings = [];
	const foundPublic = new Set();
	const foundPrivateSlugs = [];
	let clientAssetText = '';

	for (const file of files) {
		const buffer = await fsp.readFile(file);
		const relative = path.relative(buildRoot, file).replaceAll('\\', '/');
		for (const sentinel of privateSentinels) {
			if (fileContains(buffer, sentinel)) findings.push({ file: relative, marker: sentinel });
		}
		for (const slug of privateSlugs) {
			if (fileContains(buffer, slug)) foundPrivateSlugs.push({ file: relative, marker: slug });
		}
		for (const [name, sentinel] of Object.entries(publicSentinels)) {
			if (fileContains(buffer, sentinel)) foundPublic.add(name);
		}
		if (relative.startsWith('_app/')) clientAssetText += buffer.toString('utf8');
	}

	const markdownFiles = files
		.filter((file) => file.toLowerCase().endsWith('.md'))
		.map((file) => path.relative(buildRoot, file).replaceAll('\\', '/'));
	const privateMarkdownFiles = markdownFiles.filter((relative) =>
		/(synthetic-private|synthetic-archived|morning-briefs|\.versions\/)/.test(relative)
	);
	const packageArtifacts = files
		.map((file) => path.relative(buildRoot, file).replaceAll('\\', '/'))
		.filter((relative) =>
			['owner-guard.php', 'owner.json', 'manifest.json', 'briefs/manifest.json'].includes(relative)
		);

	buildInfo.findings = findings;
	buildInfo.privateSlugFindings = foundPrivateSlugs;
	buildInfo.markdownFiles = markdownFiles;
	buildInfo.privateMarkdownFiles = privateMarkdownFiles;
	buildInfo.publicSentinelHits = [...foundPublic];
	buildInfo.clientAssetBytes = clientAssetText.length;

	assert(findings.length === 0, 'public build contains no private sentinels', { findings });
	assert(foundPrivateSlugs.length === 0, 'public build contains no private slugs', {
		findings: foundPrivateSlugs
	});
	assert(
		privateMarkdownFiles.length === 0,
		'public build ships no private or version Markdown source files',
		{ privateMarkdownFiles }
	);
	assert(packageArtifacts.length === 0, 'public build ships no private runtime artifacts', {
		packageArtifacts
	});
	assert(
		!clientAssetText.includes('private-briefs') && !clientAssetText.includes('private-articles'),
		'public client assets do not reference server-only private modules'
	);
	assert(foundPublic.has('en'), 'public EN article positive control reaches the build');
	assert(foundPublic.has('fr'), 'public FR article positive control reaches the build');
	assert(foundPublic.has('version'), 'explicitly public version positive control reaches the build');

	const privateFiles = await walk(privateRoot);
	const privateRelative = path.relative(buildRoot, privateRoot);
	buildInfo.privatePayloadOutsideBuild =
		privateRelative.startsWith('..') || path.isAbsolute(privateRelative);
	assert(buildInfo.privatePayloadOutsideBuild, 'private payload is outside the deployable build');
	assert(
		privateFiles.some((file) => file.endsWith('owner-guard.php')),
		'private payload contains the owner guard'
	);
	assert(
		privateFiles.some((file) => file.endsWith('owner.json')),
		'private payload contains the generated owner mapping'
	);

	const articleManifestPath = path.join(privateRoot, 'manifest.json');
	const briefManifestPath = path.join(privateRoot, 'briefs', 'manifest.json');
	const articleManifest = JSON.parse(await fsp.readFile(articleManifestPath, 'utf8'));
	const briefManifest = JSON.parse(await fsp.readFile(briefManifestPath, 'utf8'));
	buildInfo.articleManifestCount = articleManifest.articles?.length ?? -1;
	buildInfo.briefManifestCount = briefManifest.briefs?.length ?? -1;

	assert(
		(articleManifest.articles ?? []).some(
			(article) => article.slug === 'synthetic-private-confidentiality-draft'
		),
		'private article manifest contains the synthetic private draft'
	);
	assert(
		(briefManifest.briefs ?? []).some((brief) => brief.slug === 'synthetic-private-brief'),
		'private brief manifest contains the synthetic private brief'
	);
	assert(
		!(briefManifest.briefs ?? []).some((brief) => brief.slug === 'synthetic-archived-brief'),
		'private brief manifest excludes the archived brief'
	);
	const rawBodyFields = [...(articleManifest.articles ?? []), ...(briefManifest.briefs ?? [])].filter(
		(entry) => 'body' in entry || 'previousBody' in entry || entry.html !== ''
	);
	assert(rawBodyFields.length === 0, 'private manifests contain no raw body or preview HTML', {
		rawBodyFields
	});
	assert(
		!JSON.stringify(articleManifest).includes('PRIVATE_DRAFT_BODY_SENTINEL') &&
			!JSON.stringify(briefManifest).includes('PRIVATE_BRIEF_BODY_SENTINEL'),
		'private manifests contain no raw private body sentinel'
	);

	const articlePayload = JSON.parse(
		await fsp.readFile(
			path.join(privateRoot, 'articles', 'synthetic-private-confidentiality-draft.json'),
			'utf8'
		)
	);
	const briefPayload = JSON.parse(
		await fsp.readFile(path.join(privateRoot, 'briefs', 'synthetic-private-brief.json'), 'utf8')
	);
	assert(
		typeof articlePayload.article?.html === 'string' &&
			articlePayload.article.html.includes('PRIVATE_DRAFT_BODY_SENTINEL_8E5B1D47C2F9'),
		'private article payload keeps the private body for the owner runtime'
	);
	assert(
		typeof briefPayload.brief?.html === 'string' &&
			briefPayload.brief.html.includes('PRIVATE_BRIEF_BODY_SENTINEL_3F7A2C9D5E1B'),
		'private brief payload keeps the private body for the owner runtime'
	);
	assert(
		typeof articlePayload.article?.body === 'undefined' &&
			typeof articlePayload.article?.previousBody === 'undefined' &&
			typeof briefPayload.brief?.body === 'undefined',
		'private payloads omit raw Markdown body fields'
	);

	const status = JSON.parse(await fsp.readFile(path.join(buildRoot, 'status.json'), 'utf8'));
	const sitemap = await fsp.readFile(path.join(buildRoot, 'sitemap.xml'), 'utf8');
	const rss = await fsp.readFile(path.join(buildRoot, 'rss.xml'), 'utf8');
	const engineeringPath = path.join(buildRoot, 'engineering.json');
	const engineeringExists = fs.existsSync(engineeringPath);
	const engineering = engineeringExists ? await fsp.readFile(engineeringPath, 'utf8') : '';
	const home = await fsp
		.readFile(path.join(buildRoot, 'index.php'), 'utf8')
		.catch(() => fsp.readFile(path.join(buildRoot, 'index.html'), 'utf8'));
	const briefShell = await fsp
		.readFile(path.join(buildRoot, 'briefs', 'index.php'), 'utf8')
		.catch(() => fsp.readFile(path.join(buildRoot, 'briefs', 'index.html'), 'utf8'));
	const statusText = JSON.stringify(status);

	assert(
		!statusText.includes('synthetic-private') && !statusText.includes('synthetic-archived'),
		'public status.json exposes no private brief/draft fields'
	);
	assert(
		sitemap.includes('synthetic-public-confidentiality') &&
			!sitemap.includes('synthetic-private') &&
			!sitemap.includes('synthetic-archived'),
		'sitemap contains public content only'
	);
	assert(
		rss.includes('PUBLIC_EN_SUMMARY_SENTINEL_5A1C7E93D2B8') &&
			!rss.includes('synthetic-private') &&
			!rss.includes('PRIVATE_BRIEF_BODY_SENTINEL'),
		'RSS feed contains public content only'
	);
	if (engineeringExists) {
		assert(
			engineering.includes(publicSentinels.en) &&
				!engineering.includes('synthetic-private') &&
				!engineering.includes('PRIVATE_BRIEF_BODY_SENTINEL'),
			'engineering feed contains public content only'
		);
	} else {
		record('engineering feed route is absent in this checkout; RSS/sitemap audit applied', true);
	}
	assert(
		home.includes('synthetic-public-confidentiality'),
		'homepage lists the synthetic public article'
	);
	assert(
		!briefShell.includes('PRIVATE_BRIEF') && !briefShell.includes('synthetic-private-brief'),
		'prefetched brief shell contains no private brief markers'
	);
}

function getFreePort() {
	return new Promise((resolve, reject) => {
		const server = net.createServer();
		server.unref();
		server.on('error', reject);
		server.listen(0, '127.0.0.1', () => {
			const address = server.address();
			server.close(() => resolve(address.port));
		});
	});
}

async function startPhpServer({ privateContentRoot, ownerHashValue, logName }) {
	const port = await getFreePort();
	const logPath = path.join(logRoot, logName);
	const logFd = fs.openSync(logPath, 'w');
	const environment = {
		...process.env,
		BLOG_PRIVATE_CONTENT_ROOT: privateContentRoot,
		BLOG_TEST_GRAPH_FIXTURE: path.join(logRoot, 'graph-profiles.json'),
		BLOG_ARTICLE_SOURCE_ROOT: path.join(workspaceRoot, 'src', 'lib', 'content', 'articles'),
		SK_BASE_PATH: ''
	};
	if (ownerHashValue) environment.BLOG_OWNER_EMAIL_SHA256 = ownerHashValue;
	else delete environment.BLOG_OWNER_EMAIL_SHA256;

	const child = spawn(
		phpBinary,
		[
			'-d',
			`auto_prepend_file=${path.join(fixtureRoot, 'php', 'graph-fixture-wrapper.php')}`,
			'-S',
			`127.0.0.1:${port}`,
			'-t',
			path.join(workspaceRoot, 'build'),
			path.join(workspaceRoot, 'build', 'router.php')
		],
		{
			cwd: path.join(workspaceRoot, 'build'),
			env: environment,
			stdio: ['ignore', logFd, logFd],
			windowsHide: true
		}
	);

	const base = `http://127.0.0.1:${port}`;
	try {
		await waitForServer(base, logPath);
	} catch (error) {
		child.kill();
		fs.closeSync(logFd);
		throw error;
	}
	return { child, base, logPath, logFd };
}

async function stopPhpServer(server) {
	if (!server) return;
	try {
		server.child.kill();
	} catch {
		// Best effort.
	}
	await new Promise((resolve) => setTimeout(resolve, 250));
	try {
		fs.closeSync(server.logFd);
	} catch {
		// Already closed.
	}
}

async function waitForServer(base, logPath) {
	for (let attempt = 0; attempt < 100; attempt += 1) {
		try {
			const response = await fetch(`${base}/status.json`);
			if (response.ok) return;
		} catch {
			// Server not ready yet.
		}
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	throw new Error(`PHP server did not become ready at ${base}\n${tail(await fsp.readFile(logPath, 'utf8'))}`);
}

async function request(base, method, requestPath, headers = {}) {
	const response = await fetch(`${base}${requestPath}`, {
		method,
		headers,
		redirect: 'manual'
	});
	const text = await response.text();
	return {
		status: response.status,
		headers: Object.fromEntries(response.headers.entries()),
		text
	};
}

function assertStatus(name, response, expected) {
	const ok = response.status === expected;
	record(name, ok, { status: response.status, expected });
	if (!ok) {
		throw new Error(`${name}: expected ${expected}, got ${response.status}`);
	}
}

function containsPrivate(text) {
	return privateSentinels.some((sentinel) => text.includes(sentinel));
}

async function runEndpointTests() {
	const privateRoot = path.join(workspaceRoot, 'output', 'private-content');
	const missingRoot = path.join(logRoot, 'private-missing');
	const insideRoot = path.join(workspaceRoot, 'build', 'private-inside-docroot-test');
	await fsp.mkdir(missingRoot, { recursive: true });
	await fsp.copyFile(
		path.join(privateRoot, 'owner-guard.php'),
		path.join(missingRoot, 'owner-guard.php')
	);
	await fsp.mkdir(insideRoot, { recursive: true });

	await fsp.writeFile(
		path.join(logRoot, 'graph-profiles.json'),
		JSON.stringify(
			{
				'confidentiality-owner-token': { mail: ownerEmail, userPrincipalName: ownerEmail },
				'confidentiality-nonowner-token': { mail: nonownerEmail, userPrincipalName: nonownerEmail }
			},
			null,
			2
		),
		'utf8'
	);

	const ownerHeaders = { Authorization: 'Bearer confidentiality-owner-token' };
	const nonownerHeaders = { Authorization: 'Bearer confidentiality-nonowner-token' };
	const revokedHeaders = { Authorization: 'Bearer confidentiality-revoked-token' };
	const invalidHeaders = { Authorization: 'Bearer invalid-token' };

	const server = await startPhpServer({
		privateContentRoot: privateRoot,
		ownerHashValue: '',
		logName: 'php-owner-endpoint.log'
	});

	try {
		const base = server.base;
		const metadataServer = await startPhpServer({ privateContentRoot: privateRoot,
			ownerHashValue: ownerHash, logName: 'php-metadata-action.log' });
		try {
		const actionPath = '/drafts/synthetic-private-confidentiality-draft/?/save';
		for (const accept of ['text/html', 'application/json']) {
			const failure = await fetch(`${metadataServer.base}${actionPath}`, {
				method: 'POST', headers: { Accept: accept }, redirect: 'manual'
			});
			record(`metadata missing-token ${accept} preserves failure status`, failure.status === 400);
			record(`metadata missing-token ${accept} is not redirected`, !failure.headers.has('location'));
			const text = await failure.text();
			record(`metadata missing-token ${accept} returns feedback`, accept === 'application/json'
				? JSON.parse(text)?.data?.metadataSave?.ok === false : text.length > 0);
		}
		const saved = await fetch(`${metadataServer.base}${actionPath}`, {
			method: 'POST', redirect: 'manual', headers: {
				Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded'
			}, body: new URLSearchParams({ owner_token: 'confidentiality-owner-token', status: 'draft' })
		});
		const savedResult = await saved.json();
		record('metadata synthetic owner save succeeds without redirect', saved.status === 200 &&
			!saved.headers.has('location') && savedResult?.data?.metadataSave?.ok === true,
			{ status: saved.status, result: savedResult });
		} finally { await stopPhpServer(metadataServer); }
		let response = await request(base, 'GET', '/drafts/owner/private/');
		assertStatus('anonymous article manifest denied', response, 401);
		record('anonymous article manifest has no private content', !containsPrivate(response.text));

		response = await request(base, 'GET', '/drafts/owner/private/?kind=briefs');
		assertStatus('anonymous brief manifest denied', response, 401);
		record('anonymous brief manifest has no private content', !containsPrivate(response.text));

		response = await request(base, 'GET', '/drafts/owner/private/?kind=briefs&slug=synthetic-private-brief');
		assertStatus('anonymous brief body denied', response, 401);

		response = await request(base, 'GET', '/drafts/owner/private/', {
			Cookie: 'blog-auth=owner',
			'X-Owner': '1'
		});
		assertStatus('unsigned cookie/header does not grant access', response, 401);

		response = await request(base, 'GET', '/drafts/owner/private/?kind=briefs', invalidHeaders);
		assertStatus('invalid token denied for briefs', response, 401);

		response = await request(base, 'GET', '/drafts/owner/private/?kind=briefs', revokedHeaders);
		assertStatus('revoked token denied for briefs', response, 401);

		response = await request(base, 'GET', '/drafts/owner/private/?kind=briefs', nonownerHeaders);
		assertStatus('non-owner verified profile denied for briefs', response, 403);
		record('non-owner brief response has no private content', !containsPrivate(response.text));

		response = await request(base, 'GET', '/drafts/owner/private/?kind=unknown', {});
		assertStatus('anonymous unknown kind is denied before kind parsing', response, 401);
		record('anonymous unknown kind response has no private content', !containsPrivate(response.text));

		response = await request(base, 'GET', '/drafts/owner/private/', ownerHeaders);
		assertStatus('owner article manifest allowed', response, 200);
		const articleManifest = JSON.parse(response.text);
		record(
			'owner article manifest returns private metadata',
			Array.isArray(articleManifest.articles) && articleManifest.articles.length === 1,
			{ count: articleManifest.articles?.length }
		);
		record(
			'owner article manifest omits raw/private body HTML',
			!response.text.includes('PRIVATE_DRAFT_BODY_SENTINEL_8E5B1D47C2F9') &&
				!response.text.includes('"body"') &&
				!response.text.includes('"previousBody"')
		);
		record(
			'owner article manifest headers are no-store with Vary Authorization',
			/no-store/i.test(response.headers['cache-control'] || '') &&
				/authorization/i.test(response.headers['vary'] || '')
		);
		record(
			'owner article manifest has no wildcard CORS',
			!('access-control-allow-origin' in response.headers)
		);

		response = await request(
			base,
			'GET',
			'/drafts/owner/private/?kind=articles&slug=synthetic-private-confidentiality-draft',
			ownerHeaders
		);
		assertStatus('owner article body allowed through the default-compatible kind', response, 200);
		const articlePayload = JSON.parse(response.text);
		record(
			'owner article body contains the private body after auth',
			response.text.includes('PRIVATE_DRAFT_BODY_SENTINEL_8E5B1D47C2F9')
		);
		record(
			'owner article body omits raw Markdown body fields',
			typeof articlePayload.article?.body === 'undefined' &&
				typeof articlePayload.article?.previousBody === 'undefined'
		);

		response = await request(base, 'GET', '/drafts/owner/private/?kind=briefs', ownerHeaders);
		assertStatus('owner brief manifest allowed', response, 200);
		const briefManifest = JSON.parse(response.text);
		record(
			'owner brief manifest returns metadata only for visible briefs',
			Array.isArray(briefManifest.briefs) &&
				briefManifest.briefs.length === 1 &&
				briefManifest.briefs[0].slug === 'synthetic-private-brief'
		);
		record(
			'owner brief manifest omits the archived brief',
			!response.text.includes('synthetic-archived-brief')
		);
		record(
			'owner brief manifest omits raw/private body HTML',
			!response.text.includes('PRIVATE_BRIEF_BODY_SENTINEL_3F7A2C9D5E1B')
		);
		record(
			'owner brief manifest headers are no-store with Vary Authorization',
			/no-store/i.test(response.headers['cache-control'] || '') &&
				/authorization/i.test(response.headers['vary'] || '')
		);

		response = await request(
			base,
			'GET',
			'/drafts/owner/private/?kind=briefs&slug=synthetic-private-brief',
			ownerHeaders
		);
		assertStatus('owner brief body allowed', response, 200);
		const briefPayload = JSON.parse(response.text);
		record(
			'owner brief body contains the private body after auth',
			response.text.includes('PRIVATE_BRIEF_BODY_SENTINEL_3F7A2C9D5E1B')
		);
		record(
			'owner brief body preserves metadata',
			response.text.includes('PRIVATE_BRIEF_TITLE_SENTINEL_3F7A2C9D5E1B')
		);
		record(
			'owner brief body omits raw Markdown body fields',
			typeof briefPayload.brief?.body === 'undefined'
		);
		record(
			'owner brief body headers are no-store with Vary Authorization',
			/no-store/i.test(response.headers['cache-control'] || '') &&
				/authorization/i.test(response.headers['vary'] || '')
		);
		record(
			'owner brief body has no wildcard CORS',
			!('access-control-allow-origin' in response.headers)
		);

		response = await request(
			base,
			'GET',
			'/drafts/owner/private/?kind=briefs&slug=synthetic-archived-brief',
			ownerHeaders
		);
		assertStatus('archived brief is not delivered', response, 404);

		response = await request(base, 'GET', '/drafts/owner/private/?kind=unknown', ownerHeaders);
		assertStatus('unknown kind denied with 400', response, 400);
		record('unknown kind response has no private content', !containsPrivate(response.text));

		response = await request(
			base,
			'GET',
			'/drafts/owner/private/?kind=briefs&slug=..%2F..%2Fmanifest',
			ownerHeaders
		);
		assertStatus('brief traversal slug rejected', response, 400);

		response = await request(
			base,
			'GET',
			'/drafts/owner/private/?kind=briefs&slug=..%252F..%252Fmanifest',
			ownerHeaders
		);
		assertStatus('brief double-encoded traversal slug rejected', response, 400);

		response = await request(
			base,
			'GET',
			'/drafts/owner/private/?slug=..%2F..%2Fmanifest',
			ownerHeaders
		);
		assertStatus('article traversal slug rejected', response, 400);

		response = await request(
			base,
			'GET',
			'/drafts/owner/private/?kind=briefs&slug=does-not-exist',
			ownerHeaders
		);
		assertStatus('unknown brief returns 404 after auth', response, 404);

		response = await request(base, 'GET', '/drafts/owner/private/manifest.json');
		assertStatus('direct private article manifest path not served', response, 404);
		response = await request(base, 'GET', '/drafts/owner/private/briefs/manifest.json');
		assertStatus('direct private brief manifest path not served', response, 404);
		response = await request(base, 'GET', '/manifest.json');
		assertStatus('private root is not exposed as a public path', response, 404);

		response = await request(base, 'POST', '/drafts/owner/private/', ownerHeaders);
		assertStatus('unsupported method rejected', response, 405);

		response = await request(base, 'GET', '/briefs/');
		assertStatus('brief index shell is public', response, 200);
		record('brief index shell has no private content', !containsPrivate(response.text));
		record(
			'brief index shell does not fall back to a homepage 200 with article content',
			!response.text.includes('PUBLIC_EN_BODY_SENTINEL')
		);

		response = await request(base, 'GET', '/briefs/synthetic-private-brief/');
		record(
			'legacy brief URL redirects to the private preview',
			[301, 302, 303, 307, 308].includes(response.status) &&
				(response.headers.location || '').includes('/briefs/?slug=synthetic-private-brief')
		);
		record('legacy brief redirect has no private content', !containsPrivate(response.text));

		response = await request(base, 'GET', '/briefs/synthetic-private-brief/', ownerHeaders);
		record(
			'legacy brief URL still redirects after auth without content',
			[301, 302, 303, 307, 308].includes(response.status) && !containsPrivate(response.text)
		);

		response = await request(base, 'GET', '/drafts/');
		assertStatus('draft list shell is public', response, 200);
		record('draft list shell has no private content', !containsPrivate(response.text));
	} finally {
		await stopPhpServer(server);
	}

	const missingServer = await startPhpServer({
		privateContentRoot: missingRoot,
		ownerHashValue: '',
		logName: 'php-owner-endpoint-missing-config.log'
	});
	try {
		const response = await request(
			missingServer.base,
			'GET',
			'/drafts/owner/private/?kind=briefs',
			ownerHeaders
		);
		assertStatus('missing owner configuration denies brief access', response, 503);
		record('missing configuration response has no private content', !containsPrivate(response.text));
	} finally {
		await stopPhpServer(missingServer);
	}

	const articlesOnlyRoot = path.join(logRoot, 'private-articles-only');
	await fsp.mkdir(path.join(articlesOnlyRoot, 'articles'), { recursive: true });
	await fsp.copyFile(
		path.join(privateRoot, 'owner-guard.php'),
		path.join(articlesOnlyRoot, 'owner-guard.php')
	);
	await fsp.copyFile(path.join(privateRoot, 'owner.json'), path.join(articlesOnlyRoot, 'owner.json'));
	await fsp.copyFile(
		path.join(privateRoot, 'manifest.json'),
		path.join(articlesOnlyRoot, 'manifest.json')
	);
	await fsp.cp(
		path.join(privateRoot, 'articles'),
		path.join(articlesOnlyRoot, 'articles'),
		{ recursive: true }
	);

	const articlesOnlyServer = await startPhpServer({
		privateContentRoot: articlesOnlyRoot,
		ownerHashValue: '',
		logName: 'php-owner-endpoint-articles-only.log'
	});
	try {
		let response = await request(
			articlesOnlyServer.base,
			'GET',
			'/drafts/owner/private/?kind=briefs',
			ownerHeaders
		);
		assertStatus('missing brief manifest is an honest unavailable error', response, 503);
		record(
			'missing brief manifest does not return an empty success payload',
			!response.text.includes('"ok":true') && !containsPrivate(response.text)
		);

		response = await request(articlesOnlyServer.base, 'GET', '/drafts/owner/private/', ownerHeaders);
		assertStatus('articles remain available when the brief manifest is missing', response, 200);
	} finally {
		await stopPhpServer(articlesOnlyServer);
	}

	const insideServer = await startPhpServer({
		privateContentRoot: insideRoot,
		ownerHashValue: ownerHash,
		logName: 'php-owner-endpoint-inside-docroot.log'
	});
	try {
		const response = await request(insideServer.base, 'GET', '/drafts/owner/private/', ownerHeaders);
		assertStatus('private root inside document root denied', response, 503);
		record('inside-docroot response has no private content', !containsPrivate(response.text));
	} finally {
		await stopPhpServer(insideServer);
		await fsp.rm(insideRoot, { recursive: true, force: true });
	}

	endpointInfo.ownerHashSource = 'synthetic fixture env';
	endpointInfo.logs = logRoot;
}

let logRoot = '';
let workspaceRoot = '';
let workspacePrepared = false;

async function testPrivateDestination(buildEnvironment) {
	const generator = path.join(workspaceRoot, 'scripts', 'Build-PrivateContent.mjs');
	const publicTarget = path.join(workspaceRoot, 'static', 'private-link-target');
	const link = path.join(workspaceRoot, 'output', 'linked-private-parent');
	await fsp.mkdir(publicTarget, { recursive: true });
	await fsp.mkdir(path.dirname(link), { recursive: true });
	const sentinel = path.join(publicTarget, 'preserved.txt');
	await fsp.writeFile(sentinel, 'preserve-public-target');
	await fsp.symlink(publicTarget, link, process.platform === 'win32' ? 'junction' : 'dir');
	try {
		for (const [label, destination] of [
			['linked-parent', path.join(link, 'private')],
			['public-directory', publicTarget],
			['dot-prefixed-public-child', path.join(workspaceRoot, 'build', '..private-payload')],
			['project-ancestor', workspaceRoot]
		]) {
			const fd = fs.openSync(path.join(logRoot, `reject-${label}.log`), 'w');
			try {
				const result = await spawnSyncProcess(process.execPath, [generator], fd, {
					...buildEnvironment, BLOG_PRIVATE_CONTENT_OUT: destination
				});
				record(`private generator rejects ${label}`, result.status !== 0);
			} finally { fs.closeSync(fd); }
		}
		record('rejected private destination preserves existing public target',
			(await fsp.readFile(sentinel, 'utf8')) === 'preserve-public-target' &&
			!fs.existsSync(path.join(publicTarget, 'private')));
	} finally {
		await fsp.unlink(link);
		await fsp.rm(publicTarget, { recursive: true, force: true });
	}
}

async function testRootPolicy() {
	const fd = fs.openSync(path.join(logRoot, 'root-policy.log'), 'w');
	try {
		const result = await spawnSyncProcess(phpBinary, [
			path.join(fixtureRoot, 'php', 'root-policy.php'),
			path.join(workspaceRoot, 'src', 'routes', 'drafts', 'owner', 'private', '+server.php'),
			path.join(workspaceRoot, 'output', 'private-content'),
			path.join(workspaceRoot, 'build')
		], fd, {});
		record('private endpoint requires a real document root', result.status === 0);
	} finally { fs.closeSync(fd); }
	if (process.platform !== 'win32') {
		const privateRoot = path.join(workspaceRoot, 'output', 'private-content');
		record('private payload root mode is 0700', ((await fsp.stat(privateRoot)).mode & 0o777) === 0o700);
		record('private payload file mode is 0600', ((await fsp.stat(path.join(privateRoot, 'manifest.json'))).mode & 0o777) === 0o600);
	}
}

async function main() {
	if (!fs.existsSync(kitBin) || !fs.existsSync(viteBin)) {
		throw new Error(
			`Repository dependencies are missing. Run pnpm install --frozen-lockfile first (looked for ${kitBin}).`
		);
	}
	if (!phpBinaryAvailable) {
		throw new Error(
			`PHP runtime not found at ${phpBinary}. Set PHP_BIN to the PHP 8.5 executable to run the private endpoint tests.`
		);
	}

	logRoot =
		process.env.BLOG_CONFIDENTIALITY_LOG_DIR ||
		path.join(repoRoot, 'output', 'blog-confidentiality-logs');
	workspaceRoot =
		process.env.BLOG_CONFIDENTIALITY_WORKDIR ||
		path.join(repoRoot, 'output', 'blog-confidentiality-work');
	// Cleanup is confined to distinct task directories below this repo's output.
	const outputRoot = path.join(repoRoot, 'output');
	for (const target of [logRoot, workspaceRoot]) {
		const relative = path.relative(outputRoot, path.resolve(target));
		if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
			throw new Error('Test workspace/log directory must be below repository output/.');
		}
		for (let current = path.resolve(target); ; current = path.dirname(current)) {
			try {
				if ((await fsp.lstat(current)).isSymbolicLink()) throw new Error('Linked test output is unsafe.');
			} catch (error) { if (error?.code !== 'ENOENT') throw error; }
			if (path.dirname(current) === current) break;
		}
	}
	const overlap = path.relative(path.resolve(logRoot), path.resolve(workspaceRoot));
	const reverseOverlap = path.relative(path.resolve(workspaceRoot), path.resolve(logRoot));
	if (!overlap.startsWith('..') || !reverseOverlap.startsWith('..')) {
		throw new Error('Test workspace/log directories must not overlap.');
	}
	workspacePrepared = true;

	await fsp.rm(logRoot, { recursive: true, force: true });
	await fsp.mkdir(logRoot, { recursive: true });
	await fsp.rm(workspaceRoot, { recursive: true, force: true });
	await fsp.mkdir(workspaceRoot, { recursive: true });

	console.log(`Repository: ${repoRoot}`);
	console.log(`Isolated test workspace: ${workspaceRoot}`);
	console.log(`Fixture logs: ${logRoot}`);

	for (const directory of ['src', 'static', 'scripts', 'adapter']) {
		const contentDir = path.join(repoRoot, 'src', 'lib', 'content');
		await fsp.cp(path.join(repoRoot, directory), path.join(workspaceRoot, directory), {
			recursive: true,
			filter: (source) => path.resolve(source) !== path.resolve(contentDir)
		});
	}
	for (const file of [
		'package.json',
		'svelte.config.js',
		'vite.config.ts',
		'tsconfig.json',
		'.npmrc'
	]) {
		await fsp.copyFile(path.join(repoRoot, file), path.join(workspaceRoot, file));
	}
	await copyFixtureContent();
	await copyPublicArticleSources();
	await ensureSocialImagePlaceholders();

	const buildEnvironment = {
		ADAPTER_OUT: path.join(workspaceRoot, 'build'),
		ADAPTER_ASSETS: path.join(workspaceRoot, 'build'),
		BLOG_PRIVATE_CONTENT_OUT: path.join(workspaceRoot, 'output', 'private-content'),
		VITE_CACHE_DIR: path.join(workspaceRoot, 'output', '.vite-cache'),
		SVELTEKIT_OUTDIR: path.join(workspaceRoot, '.svelte-kit'),
		PUBLIC_SITE_ID: 'ryan',
		BLOG_SITE_ID: 'ryan',
		PUBLIC_SITE_URL: 'https://blog.ryanspice.com',
		PUBLIC_BASE_PATH: '',
		SK_BASE_PATH: '',
		DEPLOY_BASE: '',
		ADAPTER_MODE: 'php-static',
		ADAPTER_BASE_MODE: 'fixed',
		BLOG_OWNER_EMAIL_SHA256: ownerHash
	};

	await runCommand([kitBin, 'sync'], 'svelte-kit-sync', buildEnvironment);
	await testPrivateDestination(buildEnvironment);
	await testGeneratorAliases({ workspaceRoot, logRoot, record, run: async (script, log, env) => {
		const fd = fs.openSync(log, 'w');
		try { return (await spawnSyncProcess(process.execPath, [script], fd, { ...buildEnvironment, ...env })).status; }
		finally { fs.closeSync(fd); }
	} });
	await runCommand(
		[path.join(workspaceRoot, 'scripts', 'Build-PrivateContent.mjs')],
		'private-content',
		buildEnvironment
	);
	await runCommand([viteBin, 'build'], 'vite-build', buildEnvironment);
	await testRootPolicy();

	await auditBuild();
	await runEndpointTests();
	await testMountedPreviews({ workspaceRoot, logRoot, viteBin, port: await getFreePort(), record });

	record(
		'private owner hash fixture was synthetic, not a repository owner value',
		ownerHash === crypto.createHash('sha256').update(ownerEmail).digest('hex')
	);

	const failures = results.filter((result) => !result.ok);
	await writeReport();
	console.log(`\nReport: ${reportPath()}`);

	if (failures.length > 0) {
		throw new Error(`${failures.length} confidence check(s) failed. First: ${failures[0].name}`);
	}
	console.log(`All ${results.length} confidentiality checks passed.`);
}

let lastError = null;

function reportPath() {
	return (
		process.env.BLOG_CONFIDENTIALITY_REPORT ||
		path.join(repoRoot, 'output', 'blog-confidentiality-report.json')
	);
}

async function writeReport() {
	const failures = results.filter((result) => !result.ok);
	const report = {
		name: 'blog-confidentiality-regression',
		generatedAt: new Date().toISOString(),
		repoRoot,
		workspaceRoot,
		logRoot,
		publicSentinels,
		privateSentinelCount: privateSentinels.length,
		build: buildInfo,
		endpoint: endpointInfo,
		checkCount: results.length,
		failureCount: failures.length,
		checks: results,
		failures,
		...(lastError ? { error: lastError } : {})
	};

	const target = reportPath();
	await fsp.mkdir(path.dirname(target), { recursive: true });
	await fsp.writeFile(target, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
	return target;
}

try {
	await main();
} catch (error) {
	lastError = error instanceof Error ? error.message : String(error);
	console.error(error instanceof Error ? error.stack : error);
	await writeReport().catch((writeError) => {
		console.error(writeError);
	});
	process.exitCode = 1;
} finally {
	if (process.env.KEEP_CONFIDENTIALITY_WORKSPACE !== '1' && workspacePrepared) {
		await fsp.rm(workspaceRoot, { recursive: true, force: true }).catch(() => {});
	}
}
