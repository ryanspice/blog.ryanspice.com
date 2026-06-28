import { expect, test } from '@playwright/test';

const articlePath = '/deepseek-claude-code-windows-powershell/';

test('site runtime handles prerendered article controls', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'catalog-desktop', 'Runtime contract is covered once on desktop.');

	await page.goto(articlePath, { waitUntil: 'domcontentloaded' });

	const readingMode = page.locator('[data-reading-mode-toggle]').first();
	await expect(readingMode).toBeVisible();
	await expect(readingMode).toHaveAttribute('aria-pressed', 'false');

	await readingMode.click();
	await expect(page.locator('html')).toHaveClass(/reading-mode/);
	await expect(readingMode).toHaveAttribute('aria-pressed', 'true');

	await page.reload({ waitUntil: 'domcontentloaded' });
	await expect(page.locator('html')).toHaveClass(/reading-mode/);

	await page.locator('[data-scroll-progress]').evaluate(() => {
		window.scrollTo(0, Math.max(500, document.documentElement.scrollHeight / 3));
		window.dispatchEvent(new Event('scroll'));
	});
	await expect
		.poll(async () => {
			const progressWidth = await page.locator('[data-scroll-progress]').evaluate((element) => (element as HTMLElement).style.width);
			return Number.parseFloat(progressWidth);
		})
		.toBeGreaterThan(0);

	const codeCopyButton = page.locator('[data-copy-code]').first();
	await expect(codeCopyButton).toBeVisible();
	await codeCopyButton.click();
	await expect(codeCopyButton).toHaveAttribute('data-copy-state', 'copied');
});

test('site runtime handles prerendered copy controls', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'catalog-desktop', 'Runtime contract is covered once on desktop.');

	await page.goto('/rss-reader/', { waitUntil: 'domcontentloaded' });

	const copyButton = page.locator('[data-copy-text]').first();
	await expect(copyButton).toBeVisible();
	await copyButton.click();
	await expect(copyButton).toContainText(/copied/i);
});
