import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const baseURL = process.env.CATALOG_BASE_URL ?? 'http://127.0.0.1:4173';
const outDir = join('docs', 'website-catalog', 'screenshots');
mkdirSync(outDir, { recursive: true });

const pages = [
	{
		name: 'Home',
		path: '/',
		category: 'Public'
	},
	{
		name: 'French home',
		path: '/fr/',
		category: 'Localization'
	},
	{
		name: 'Dev log',
		path: '/dev-log/',
		category: 'Public'
	},
	{
		name: 'Research library',
		path: '/library/',
		category: 'Public'
	},
	{
		name: 'Briefs',
		path: '/briefs/',
		category: 'Public'
	},
	{
		name: 'Brief: 2026-06-05',
		path: '/briefs/2026-06-05-blog-delivery-surface/',
		category: 'Public'
	},
	{
		name: 'Auth status',
		path: '/status',
		category: 'Private helper'
	},
	{
		name: 'RSS reader',
		path: '/rss-reader/',
		category: 'Public'
	},
	{
		name: 'Article: Pro/Flash/Gemma4',
		path: '/agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns/',
		category: 'Content'
	},
	{
		name: 'Article: GIMP repair',
		path: '/gimp-3-repair-photogimp-pixelboats-workstation/',
		category: 'Content'
	},
	{
		name: 'Article: Deep research',
		path: '/how-chatgpt-performs-deep-research/',
		category: 'Content'
	},
	{
		name: 'Phaser vs Pixi',
		path: '/phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game/',
		category: 'Content'
	},
	{
		name: 'OpenJarvis',
		path: '/openjarvis-local-ai-personal-ai-on-your-pc/',
		category: 'Content'
	}
];

const desktop = { width: 1600, height: 2200 };
const mobile = { width: 390, height: 844 };

function fileName(slug, viewport) {
	return `${slug}-${viewport.width}x${viewport.height}.png`;
}

function slugFromPath(path) {
	return path === '/' ? 'home' : path.replace(/\/+$/, '').replace(/\//g, '-').replace(/^-/, '');
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const manifest = [];

for (const item of pages) {
	const route = `${baseURL}${item.path}`;
	for (const viewport of [desktop, mobile]) {
		await page.setViewportSize(viewport);

		const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
		if (!response) {
			manifest.push({ ...item, viewport: `${viewport.width}x${viewport.height}`, status: 'n/a', screenshot: null, error: 'No response' });
			continue;
		}

		const status = response.status();
		const screenshotFile = fileName(slugFromPath(item.path), viewport);
		const fullPath = join(outDir, screenshotFile);

		if (status >= 400) {
			manifest.push({ ...item, viewport: `${viewport.width}x${viewport.height}`, status, screenshot: null, error: `HTTP ${status}` });
			continue;
		}

		await page.screenshot({ path: fullPath, fullPage: true });
		const title = await page.title();
		manifest.push({
			...item,
			viewport: `${viewport.width}x${viewport.height}`,
			status,
			screenshot: `./screenshots/${screenshotFile}`,
			title
		});
	}
}

await browser.close();

const manifestPath = join('docs', 'website-catalog', 'catalog.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`Catalog manifest written to ${manifestPath}`);
console.log(`Captured ${manifest.filter((entry) => entry.screenshot).length} screenshots`);
