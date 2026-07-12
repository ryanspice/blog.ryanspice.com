import { describe, expect, it } from 'vitest';
import { articleShareImagePath } from '../../src/lib/article-social-images';

const site = { id: 'ryan' as const, siteName: 'Ryan Spice' };

describe('articleShareImagePath', () => {
	it('uses the article update date as a cache-busting image version', () => {
		expect(
			articleShareImagePath(
				{
					locale: 'en',
					slug: 'local-fugu-coding-harness',
					title: 'Local Fugu coding harness',
					updatedDate: '2026-07-12'
				},
				site
			)
		).toBe('/img/social/ryan/articles/local-fugu-coding-harness.png?v=2026-07-12');
	});

	it('keeps localized article images in their locale directory', () => {
		expect(
			articleShareImagePath(
				{
					locale: 'fr',
					slug: 'exemple',
					title: 'Exemple',
					updatedDate: '2026-07-12T15:30:00Z'
				},
				site
			)
		).toBe('/img/social/ryan/articles/fr/exemple.png?v=2026-07-12T15%3A30%3A00Z');
	});
});
