import { expect, test } from '@playwright/test';

const testMeasurementId = 'G-TEST000001';

function installRecorder(): void {
	interface RecorderWindow extends Window {
		__gaRecorded?: unknown[][];
	}
	const recorded: unknown[][] = [];
	const dl: unknown[] = [];
	dl.push = function () {
		const entry = Array.from(arguments[0] as ArrayLike<unknown>);
		recorded.push(entry.map((value) => (value && typeof value === 'object' ? { ...(value as object) } : value)));
		return dl.length;
	};
	(window as unknown as RecorderWindow).dataLayer = dl;
	(window as unknown as RecorderWindow).__gaRecorded = recorded;
}

function readRecorded(): unknown[][] {
	return ((window as unknown as { __gaRecorded?: unknown[][] }).__gaRecorded ?? []) as unknown[][];
}

test('ga4 analytics initializes on load and tracks SPA navigation', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'catalog-desktop', 'Analytics contract is covered once on desktop.');

	await page.addInitScript(installRecorder);

	await page.goto('/', { waitUntil: 'domcontentloaded' });

	await expect(page.locator(`script[src*="gtag/js?id=${testMeasurementId}"]`)).toHaveCount(1);

	const initial = await page.evaluate(readRecorded);
	expect(initial.some((entry) => entry[0] === 'js')).toBe(true);
	expect(
		initial.some(
			(entry) =>
				entry[0] === 'consent' &&
				(entry[1] as string) === 'default' &&
				(entry[2] as { analytics_storage?: string }).analytics_storage === 'denied'
		)
	).toBe(true);
	expect(initial.some((entry) => entry[0] === 'config' && String(entry[1]).startsWith('G-TEST'))).toBe(true);

	const articleLink = page.locator('a[href*="choosing-ai-coding-tool-when-model-isnt-the-product"]').first();
	await expect(articleLink).toBeVisible();
	await articleLink.click();
	await page.waitForURL('**/choosing-ai-coding-tool-when-model-isnt-the-product/**');

	await expect
		.poll(async () => {
			const events = await page.evaluate(readRecorded);
			return events.filter(
				(entry) =>
					entry[0] === 'config' &&
					String(entry[1]).startsWith('G-TEST') &&
					String((entry[2] as { page_path?: string }).page_path ?? '').includes(
						'choosing-ai-coding-tool-when-model-isnt-the-product'
					)
			).length;
		})
		.toBeGreaterThanOrEqual(1);
});
