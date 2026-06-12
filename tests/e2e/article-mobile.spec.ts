import { expect, test } from '@playwright/test';

const articleSlug = 'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns';

test('article mobile layout keeps hero/rail and content non-overlapping', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'mobile', 'Mobile layout assertions only apply to the mobile project.');

	await page.goto(`/${articleSlug}/`, { waitUntil: 'domcontentloaded' });

	await expect(page.locator('.article-page')).toBeVisible();
	await expect(page.locator('.article-toc--desktop')).toBeHidden();
	await expect(page.locator('.article-toc--mobile')).toBeVisible();

	const geometry = await page.evaluate(() => {
		const heroSide = document.querySelector('.article-hero-side')?.getBoundingClientRect();
		const articleColumn = document.querySelector('.article-column')?.getBoundingClientRect();

		if (!heroSide || !articleColumn) return null;

		return {
			overlap:
				!(
					heroSide.bottom <= articleColumn.top ||
					articleColumn.bottom <= heroSide.top ||
					heroSide.right <= articleColumn.left ||
					articleColumn.right <= heroSide.left
				),
			heroWidth: Math.round(heroSide.width),
			columnWidth: Math.round(articleColumn.width),
			viewportWidth: Math.round(window.innerWidth)
		};
	});

	if (!geometry) {
		throw new Error('Expected hero side and article column elements to be present.');
	}

	expect(geometry.overlap).toBe(false);
	expect(geometry.heroWidth).toBeLessThanOrEqual(geometry.viewportWidth + 2);
	expect(geometry.columnWidth).toBeLessThanOrEqual(geometry.viewportWidth + 2);
});
