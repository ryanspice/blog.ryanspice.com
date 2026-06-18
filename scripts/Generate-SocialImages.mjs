import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const articlesRoot = path.join(projectRoot, 'src', 'lib', 'content', 'articles');
const outputRoot = path.join(projectRoot, 'static', 'img', 'social');
const manifestPath = path.join(outputRoot, '.manifest.json');
const width = 1200;
const height = 630;

const siteThemes = {
	ryan: {
		label: 'Ryan Spice / Canopy Digital',
		mark: 'RS',
		background: '#08110f',
		panel: 'rgba(8, 17, 15, 0.86)',
		text: '#fff7df',
		muted: '#bed7c9',
		accent: '#7ad39d',
		ring: '#d5b35f'
	},
	canopy: {
		label: 'Canopy Digital Blog',
		mark: 'CD',
		background: '#f7f1df',
		panel: 'rgba(255, 250, 238, 0.9)',
		text: '#143127',
		muted: '#4b695a',
		accent: '#377d58',
		ring: '#c6933f'
	}
};

const siteHomeCards = {
	ryan: {
		label: 'blog.ryanspice.com',
		badge: 'Technical notes',
		title: 'Practical technical notes by Ryan Spice',
		summary: 'Source-aware web work, AI research notes, Windows repair logs, and production writeups.',
		tags: ['SvelteKit', 'AI research', 'Dev log'],
		accent: '#7ad39d'
	},
	canopy: {
		label: 'Canopy Digital Blog',
		badge: 'Web design + SEO',
		title: 'Practical web design and SEO notes',
		summary: 'Local SEO, maintainable websites, care plans, and small-business technology decisions.',
		tags: ['Web design', 'Local SEO', 'Maintenance'],
		accent: '#377d58'
	}
};

const today = new Date();
const args = new Set(process.argv.slice(2));
const requestedSite = [...args].find((arg) => arg.startsWith('--site='))?.split('=')[1]?.trim().toLowerCase();
const sites = requestedSite && siteThemes[requestedSite] ? [requestedSite] : Object.keys(siteThemes);

await main();

async function main() {
	const manifest = await readManifest();
	const articles = (await readArticles()).filter(isPublicArticle);
	if (!articles.length) {
		console.log('No public articles found for social image generation.');
		return;
	}

	await fs.mkdir(outputRoot, { recursive: true });
	const browser = await chromium.launch();
	let generated = 0;
	let skipped = 0;

	try {
		const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

		for (const siteId of sites) {
			const homeKey = `${siteId}:home`;
			const homeFingerprint = hashJson({ siteId, home: siteHomeCards[siteId], version: 1 });
			const homeOutputPath = path.join(outputRoot, siteId, 'home.png');

			if (!args.has('--force') && manifest[homeKey]?.fingerprint === homeFingerprint && await exists(homeOutputPath)) {
				skipped += 1;
			} else {
				await fs.mkdir(path.dirname(homeOutputPath), { recursive: true });
				await page.setContent(renderSiteCardHtml(siteHomeCards[siteId], siteThemes[siteId]), {
					waitUntil: 'networkidle',
					timeout: 30_000
				});
				await page.screenshot({ path: homeOutputPath, type: 'png' });
				manifest[homeKey] = {
					fingerprint: homeFingerprint,
					path: path.relative(projectRoot, homeOutputPath).replace(/\\/g, '/'),
					updatedAt: new Date().toISOString()
				};
				generated += 1;
			}

			for (const article of articles) {
				const key = `${siteId}:${article.locale}:${article.slug}`;
				const fingerprint = hashJson({ siteId, article, version: 2 });
				const outputPath = socialImageOutputPath(siteId, article);

				if (!args.has('--force') && manifest[key]?.fingerprint === fingerprint && await exists(outputPath)) {
					skipped += 1;
					continue;
				}

				await fs.mkdir(path.dirname(outputPath), { recursive: true });
				await page.setContent(renderCardHtml(article, siteThemes[siteId]), {
					waitUntil: 'networkidle',
					timeout: 30_000
				});
				await page.screenshot({ path: outputPath, type: 'png' });
				manifest[key] = {
					fingerprint,
					path: path.relative(projectRoot, outputPath).replace(/\\/g, '/'),
					updatedAt: new Date().toISOString()
				};
				generated += 1;
			}
		}
	} finally {
		await browser.close();
	}

	await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
	console.log(`Social images ready: ${generated} generated, ${skipped} unchanged.`);
}

async function readArticles() {
	const files = [
		...(await markdownFiles(articlesRoot, 'en')),
		...(await markdownFiles(path.join(articlesRoot, 'fr'), 'fr'))
	];

	return files.map(({ filePath, locale }) => {
		const raw = filePath.raw;
		const frontmatter = parseFrontmatter(raw);
		const fallbackSlug = path.basename(filePath.name, '.md');
		const title = stringValue(frontmatter.title) || fallbackSlug.replaceAll('-', ' ');
		return {
			locale,
			title,
			slug: stringValue(frontmatter.slug) || slugify(title),
			status: stringValue(frontmatter.status) || 'draft',
			draftType: stringValue(frontmatter.draft_type) || 'technical-blog-post',
			date: stringValue(frontmatter.date) || '2026-05-28',
			releaseDate: stringValue(frontmatter.release_date),
			summary: stringValue(frontmatter.summary),
			tags: arrayValue(frontmatter.tags).slice(0, 5),
			accent: stringValue(frontmatter.accent) || '#7ad39d',
			image: firstValue(
				stringValue(frontmatter.image),
				stringValue(frontmatter.row_image),
				stringValue(frontmatter.background_image)
			),
			imagePosition: firstValue(
				stringValue(frontmatter.image_position),
				stringValue(frontmatter.row_image_position),
				stringValue(frontmatter.background_image_position),
				'center center'
			)
		};
	});
}

async function markdownFiles(root, locale) {
	if (!await exists(root)) return [];
	const entries = await fs.readdir(root, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name.includes('-draft.')) continue;
		const fullPath = path.join(root, entry.name);
		files.push({
			locale,
			filePath: {
				name: entry.name,
				raw: await fs.readFile(fullPath, 'utf8')
			}
		});
	}

	return files;
}

function parseFrontmatter(raw) {
	const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
	if (!normalized.startsWith('---\n')) return {};
	const end = normalized.indexOf('\n---', 4);
	if (end < 0) return {};
	const yaml = normalized.slice(4, end);
	const result = {};
	let activeKey = null;

	for (const line of yaml.split('\n')) {
		const listItem = line.match(/^\s+-\s+(.+)$/);
		if (listItem && activeKey) {
			result[activeKey] = [...(Array.isArray(result[activeKey]) ? result[activeKey] : []), cleanYamlValue(listItem[1])];
			continue;
		}

		const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
		if (!pair) continue;
		activeKey = pair[1];
		result[activeKey] = pair[2] ? cleanYamlValue(pair[2]) : [];
	}

	return result;
}

function cleanYamlValue(value) {
	const trimmed = value.trim();
	const quote = trimmed[0];
	if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
		return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
	}
	return trimmed;
}

function isPublicArticle(article) {
	if (article.status === 'published') return true;
	if (!article.releaseDate) return false;
	const release = new Date(`${article.releaseDate}T00:00:00Z`);
	if (Number.isNaN(release.getTime())) return false;
	return release <= today;
}

function socialImageOutputPath(siteId, article) {
	const segments = [outputRoot, siteId, 'articles'];
	if (article.locale !== 'en') segments.push(article.locale);
	return path.join(...segments, `${article.slug}.png`);
}

function resolveImageUrl(src) {
	if (!src) return '';
	if (/^https?:\/\//i.test(src)) return src;
	if (!src.startsWith('/')) return '';
	const imagePath = path.join(projectRoot, 'static', src.replace(/^\/+/, ''));
	if (!fsSync.existsSync(imagePath)) return pathToFileURL(imagePath).toString();
	const extension = path.extname(imagePath).toLowerCase();
	const mime = extension === '.svg'
		? 'image/svg+xml'
		: extension === '.webp'
			? 'image/webp'
			: extension === '.jpg' || extension === '.jpeg'
				? 'image/jpeg'
				: 'image/png';
	return `data:${mime};base64,${fsSync.readFileSync(imagePath).toString('base64')}`;
}

function renderCardHtml(article, theme) {
	const imageUrl = resolveImageUrl(article.image);
	const tags = article.tags.length ? article.tags.slice(0, 3) : [article.draftType.replaceAll('-', ' ')];
	const dateLabel = formatDate(article.date, article.locale);
	const title = clampWords(article.title, 16);
	const summary = clampWords(article.summary, 28);
	const safeAccent = /^#[0-9a-f]{6}$/i.test(article.accent) ? article.accent : theme.accent;

	return `<!doctype html>
<html>
<head>
	<meta charset="utf-8" />
	<style>
		* { box-sizing: border-box; }
		html, body { width: ${width}px; height: ${height}px; margin: 0; }
		body {
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			background:
				linear-gradient(135deg, ${theme.background}, ${mixHex(theme.background, safeAccent, 0.18)} 62%, ${mixHex(theme.background, theme.ring, 0.24)});
			color: ${theme.text};
			overflow: hidden;
		}
		.card {
			position: relative;
			width: 100%;
			height: 100%;
			padding: 54px;
			display: grid;
			grid-template-columns: 42% 1fr;
			gap: 42px;
		}
		.media {
			position: relative;
			border: 1px solid ${rgba(theme.text, 0.16)};
			border-radius: 30px;
			overflow: hidden;
			background: linear-gradient(140deg, ${safeAccent}, ${theme.ring});
			box-shadow: 0 28px 80px ${rgba('#000000', 0.24)};
		}
		.media::before {
			content: "";
			position: absolute;
			inset: 0;
			background-image: ${imageUrl ? `url("${imageUrl}")` : 'linear-gradient(135deg, transparent, rgba(255,255,255,0.22))'};
			background-size: cover;
			background-position: ${escapeCss(article.imagePosition)};
			filter: saturate(1.04) contrast(1.02);
			transform: scale(1.03);
		}
		.media::after {
			content: "";
			position: absolute;
			inset: 0;
			background:
				linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.34)),
				radial-gradient(circle at 18% 18%, rgba(255,255,255,0.28), transparent 36%);
		}
		.mark {
			position: absolute;
			left: 28px;
			bottom: 28px;
			width: 84px;
			height: 84px;
			border-radius: 24px;
			display: grid;
			place-items: center;
			background: ${theme.panel};
			color: ${theme.text};
			font-size: 28px;
			font-weight: 850;
			letter-spacing: 0;
			border: 1px solid ${rgba(theme.text, 0.2)};
			z-index: 2;
		}
		.copy {
			position: relative;
			min-width: 0;
			border-radius: 34px;
			padding: 40px 42px 38px;
			background: ${theme.panel};
			border: 1px solid ${rgba(theme.text, 0.16)};
			box-shadow: 0 28px 80px ${rgba('#000000', 0.16)};
			display: flex;
			flex-direction: column;
		}
		.kicker {
			margin: 0 0 26px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 18px;
			color: ${theme.muted};
			font-size: 23px;
			font-weight: 720;
		}
		.kicker span:last-child {
			color: ${safeAccent};
			white-space: nowrap;
		}
		h1 {
			margin: 0;
			font-size: ${title.length > 72 ? 48 : title.length > 54 ? 54 : 62}px;
			line-height: 1.02;
			letter-spacing: 0;
			font-weight: 880;
			color: ${theme.text};
		}
		.summary {
			margin: 26px 0 0;
			font-size: 27px;
			line-height: 1.25;
			color: ${theme.muted};
		}
		.tags {
			margin-top: auto;
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
		}
		.tag {
			padding: 10px 14px;
			border-radius: 999px;
			background: ${rgba(safeAccent, 0.16)};
			color: ${theme.text};
			font-size: 19px;
			font-weight: 760;
			border: 1px solid ${rgba(safeAccent, 0.28)};
		}
	</style>
</head>
<body>
	<main class="card">
		<section class="media" aria-hidden="true"><div class="mark">${escapeHtml(theme.mark)}</div></section>
		<section class="copy">
			<p class="kicker"><span>${escapeHtml(theme.label)}</span><span>${escapeHtml(dateLabel)}</span></p>
			<h1>${escapeHtml(title)}</h1>
			<p class="summary">${escapeHtml(summary)}</p>
			<div class="tags">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
		</section>
	</main>
</body>
</html>`;
}

function renderSiteCardHtml(card, theme) {
	const safeAccent = /^#[0-9a-f]{6}$/i.test(card.accent) ? card.accent : theme.accent;
	const tags = card.tags?.length ? card.tags.slice(0, 4) : [card.badge];

	return `<!doctype html>
<html>
<head>
	<meta charset="utf-8" />
	<style>
		* { box-sizing: border-box; }
		html, body { width: ${width}px; height: ${height}px; margin: 0; }
		body {
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			background:
				linear-gradient(90deg, ${rgba(safeAccent, 0.1)} 1px, transparent 1px),
				linear-gradient(180deg, ${rgba(safeAccent, 0.08)} 1px, transparent 1px),
				linear-gradient(135deg, ${theme.background}, ${mixHex(theme.background, safeAccent, 0.18)} 58%, ${mixHex(theme.background, theme.ring, 0.24)});
			background-size: 64px 64px, 64px 64px, auto;
			color: ${theme.text};
			overflow: hidden;
		}
		.frame {
			position: relative;
			width: 100%;
			height: 100%;
			padding: 54px;
			display: grid;
			grid-template-columns: 36% 1fr;
			gap: 36px;
		}
		.identity {
			position: relative;
			border-radius: 30px;
			background:
				radial-gradient(circle at 30% 24%, ${rgba(theme.ring, 0.32)}, transparent 38%),
				linear-gradient(145deg, ${rgba(safeAccent, 0.9)}, ${mixHex(safeAccent, theme.ring, 0.34)});
			border: 1px solid ${rgba(theme.text, 0.16)};
			box-shadow: 0 28px 80px ${rgba('#000000', 0.2)};
			overflow: hidden;
		}
		.identity::before,
		.identity::after {
			content: "";
			position: absolute;
			border: 1px solid ${rgba('#ffffff', 0.38)};
		}
		.identity::before {
			inset: 44px;
			border-radius: 28px;
		}
		.identity::after {
			left: 54px;
			right: 54px;
			top: 50%;
			height: 1px;
			transform: rotate(-24deg);
		}
		.mark {
			position: absolute;
			left: 50%;
			top: 50%;
			width: 168px;
			height: 168px;
			transform: translate(-50%, -50%);
			border-radius: 36px;
			display: grid;
			place-items: center;
			background: ${theme.panel};
			color: ${theme.text};
			font-size: 54px;
			font-weight: 900;
			border: 1px solid ${rgba(theme.text, 0.2)};
			box-shadow: 0 20px 48px ${rgba('#000000', 0.16)};
		}
		.copy {
			border-radius: 34px;
			padding: 42px 46px;
			background: ${theme.panel};
			border: 1px solid ${rgba(theme.text, 0.16)};
			box-shadow: 0 28px 80px ${rgba('#000000', 0.16)};
			display: flex;
			flex-direction: column;
			min-width: 0;
		}
		.kicker {
			margin: 0 0 24px;
			display: flex;
			justify-content: space-between;
			gap: 18px;
			color: ${theme.muted};
			font-size: 23px;
			font-weight: 760;
		}
		.kicker span:last-child {
			color: ${safeAccent};
			white-space: nowrap;
		}
		h1 {
			margin: 0;
			color: ${theme.text};
			font-size: ${card.title.length > 44 ? 58 : 66}px;
			line-height: 1.02;
			font-weight: 900;
			letter-spacing: 0;
		}
		.summary {
			margin: 26px 0 0;
			color: ${theme.muted};
			font-size: 29px;
			line-height: 1.25;
			max-width: 760px;
		}
		.tags {
			margin-top: auto;
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
		}
		.tag {
			padding: 10px 14px;
			border-radius: 999px;
			background: ${rgba(safeAccent, 0.16)};
			border: 1px solid ${rgba(safeAccent, 0.28)};
			color: ${theme.text};
			font-size: 19px;
			font-weight: 780;
		}
	</style>
</head>
<body>
	<main class="frame">
		<section class="identity" aria-hidden="true"><div class="mark">${escapeHtml(theme.mark)}</div></section>
		<section class="copy">
			<p class="kicker"><span>${escapeHtml(card.label)}</span><span>${escapeHtml(card.badge)}</span></p>
			<h1>${escapeHtml(card.title)}</h1>
			<p class="summary">${escapeHtml(card.summary)}</p>
			<div class="tags">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
		</section>
	</main>
</body>
</html>`;
}

function formatDate(value, locale) {
	const parsed = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return value;
	return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(parsed);
}

function clampWords(value, maxWords) {
	const words = String(value || '').trim().split(/\s+/).filter(Boolean);
	if (words.length <= maxWords) return words.join(' ');
	return `${words.slice(0, maxWords).join(' ')}...`;
}

function slugify(value) {
	return String(value)
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'article';
}

function firstValue(...values) {
	return values.find((value) => typeof value === 'string' && value.trim()) ?? '';
}

function stringValue(value) {
	return typeof value === 'string' ? value : '';
}

function arrayValue(value) {
	return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function escapeCss(value) {
	return String(value || 'center center').replace(/[;"{}]/g, '');
}

function rgba(hex, alpha) {
	const { r, g, b } = hexToRgb(hex);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHex(left, right, amount) {
	const a = hexToRgb(left);
	const b = hexToRgb(right);
	return rgbToHex({
		r: Math.round(a.r + (b.r - a.r) * amount),
		g: Math.round(a.g + (b.g - a.g) * amount),
		b: Math.round(a.b + (b.b - a.b) * amount)
	});
}

function hexToRgb(hex) {
	const normalized = hex.replace('#', '');
	const value = normalized.length === 3
		? normalized.split('').map((part) => part + part).join('')
		: normalized.padEnd(6, '0').slice(0, 6);
	return {
		r: Number.parseInt(value.slice(0, 2), 16),
		g: Number.parseInt(value.slice(2, 4), 16),
		b: Number.parseInt(value.slice(4, 6), 16)
	};
}

function rgbToHex({ r, g, b }) {
	return `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('')}`;
}

function hashJson(value) {
	return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function readManifest() {
	if (!await exists(manifestPath)) return {};
	try {
		return JSON.parse(await fs.readFile(manifestPath, 'utf8'));
	} catch {
		return {};
	}
}

async function exists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}
