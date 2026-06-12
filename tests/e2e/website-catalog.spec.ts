import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const routes = [
	{ name: 'Home', path: '/' },
	{ name: 'French home', path: '/fr/' },
	{ name: 'Dev log', path: '/dev-log/' },
	{ name: 'Research library', path: '/library/' },
	{ name: 'Briefs', path: '/briefs/' },
	{ name: 'Brief 2026-06-05', path: '/briefs/2026-06-05-blog-delivery-surface/' },
	{ name: 'Auth status', path: '/status' },
	{ name: 'RSS reader', path: '/rss-reader/' },
	{ name: 'Article: Pro/Flash/Gemma4', path: '/agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns/' },
	{ name: 'Article: GIMP repair', path: '/gimp-3-repair-photogimp-pixelboats-workstation/' },
	{ name: 'Article: Deep research', path: '/how-chatgpt-performs-deep-research/' },
	{ name: 'Article: Phaser vs Pixi', path: '/phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game/' },
	{ name: 'Article: OpenJarvis', path: '/openjarvis-local-ai-personal-ai-on-your-pc/' }
];

const outDir = path.join('docs', 'website-catalog', 'screenshots');

function safeName(value: string) {
	return value
		.toLowerCase()
		.replace(/[\\/]+/g, '-')
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

test('catalog: capture website screenshots', async ({ context, viewport }, testInfo) => {
	test.setTimeout(60_000);
	mkdirSync(outDir, { recursive: true });
	expect(testInfo.project.name).toMatch(/^(catalog-desktop|mobile)$/);

	const isDesktop = testInfo.project.name === 'catalog-desktop';
	const viewportSuffix = `${viewport?.width ?? 1600}x${viewport?.height ?? 2200}`;
	const catalog: Array<{
		name: string;
		path: string;
		title: string;
		status: number;
		ok: boolean;
		file?: string;
		error?: string;
		bodyVisible?: boolean;
		viewport: string;
	}> = [];
	const summaryPath = path.join('docs', 'website-catalog', `${isDesktop ? 'desktop' : 'mobile'}-catalog.json`);

	const takeScreenshot = async (page: Awaited<ReturnType<typeof context.newPage>>, captureFile: string): Promise<void> => {
		await page.screenshot({ path: captureFile, fullPage: true });
	};

	for (const route of routes) {
		const page = await context.newPage();
		const file = path.join(outDir, `${safeName(route.name)}-${viewportSuffix}.png`);
		let status = 0;
		let ok = false;
		let title = '';
		let bodyVisible = false;
		let screenshotFile: string | undefined;
		let errorMessage: string | undefined;

		let response;
		try {
			response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
			status = response?.status() ?? 0;
			ok = response?.ok() ?? status < 400;
		} catch (error_) {
			errorMessage = error_ instanceof Error ? error_.message : String(error_);
		}

		try {
			if (!title) {
				title = await page.title();
			}
		} catch {
			title = '';
		}

		const body = page.locator('body');
		try {
			await expect(body).toBeVisible({ timeout: 5000 });
			bodyVisible = true;
		} catch {
			bodyVisible = false;
		}

		try {
			if (bodyVisible) {
				try {
					await takeScreenshot(page, file);
				} catch (error_) {
					const msg = error_ instanceof Error ? error_.message : String(error_);
					if (msg.includes('Cannot take screenshot larger than 32767 pixels')) {
						await page.screenshot({ path: file, fullPage: false });
					} else {
						throw error_;
					}
				}
				screenshotFile = `./screenshots/${path.basename(file)}`;
			}
		} catch (error_) {
			const capturedError = error_ instanceof Error ? error_.message : String(error_);
			errorMessage = errorMessage ? `${errorMessage} | ${capturedError}` : capturedError;
		}

		if (!errorMessage && response && status >= 400) {
			errorMessage = `HTTP ${status}`;
		}

		catalog.push({
			name: route.name,
			path: route.path,
			title,
			status,
			ok,
			bodyVisible,
			file: screenshotFile,
			error: errorMessage,
			viewport: viewportSuffix
		});

		if (errorMessage) {
			console.warn(`[catalog] ${route.path} failed: ${errorMessage}`);
		}

		await page.close();
	}

	writeFileSync(summaryPath, JSON.stringify(catalog, null, 2), 'utf8');
});
