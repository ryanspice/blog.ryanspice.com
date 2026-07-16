import { describe, expect, it } from 'vitest';

import {
	articleCanonicalUrl,
	articleSurfacePath,
	parseArticleSurfaces
} from '../../src/lib/article-surfaces';

const englishArticle = {
	date: '2026-07-10',
	locale: 'en' as const,
	slug: 'weekday-pulse',
	canonicalSurface: 'ryan' as const,
	surfaces: ['ryan', 'canopy-blog', 'canopy-engineering'] as Array<'ryan' | 'canopy-blog' | 'canopy-engineering'>
};

describe('article surface contract', () => {
	it('maps one article bundle onto the main Canopy engineering route', () => {
		expect(articleSurfacePath(englishArticle, 'canopy-engineering')).toBe(
			'/engineering/2026/07/10/weekday-pulse/'
		);
	});

	it('keeps French under the French engineering prefix', () => {
		expect(
			articleSurfacePath({ ...englishArticle, locale: 'fr' }, 'canopy-engineering')
		).toBe('/fr/engineering/2026/07/10/weekday-pulse/');
	});

	it('maps both locales across all three surfaces', () => {
		const expected = {
			'en:ryan': '/2026/07/10/weekday-pulse/',
			'en:canopy-blog': '/2026/07/10/weekday-pulse/',
			'en:canopy-engineering': '/engineering/2026/07/10/weekday-pulse/',
			'fr:ryan': '/fr/2026/07/10/weekday-pulse/',
			'fr:canopy-blog': '/fr/2026/07/10/weekday-pulse/',
			'fr:canopy-engineering': '/fr/engineering/2026/07/10/weekday-pulse/'
		};

		for (const locale of ['en', 'fr'] as const) {
			for (const surface of englishArticle.surfaces) {
				expect(articleSurfacePath({ ...englishArticle, locale }, surface)).toBe(
					expected[`${locale}:${surface}`]
				);
			}
		}
	});

	it('uses the declared canonical owner across mirrors', () => {
		expect(articleCanonicalUrl(englishArticle, 'https://blog.canopydigital.ca')).toBe(
			'https://blog.ryanspice.com/2026/07/10/weekday-pulse/'
		);
	});

	it('defaults legacy articles to all surfaces', () => {
		expect(parseArticleSurfaces([])).toEqual(['ryan', 'canopy-blog', 'canopy-engineering']);
	});
});
