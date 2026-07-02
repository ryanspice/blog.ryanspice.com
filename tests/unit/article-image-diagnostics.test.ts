import { describe, expect, it } from 'vitest';

import {
	addArticleImageDiagnostics,
	normalizedSideImageKey
} from '../../src/lib/article-image-diagnostics';

describe('article image diagnostics', () => {
	it('flags shared card-side images even when CDN transform params differ', () => {
		const articles = addArticleImageDiagnostics([
			{
				slug: 'first',
				title: 'First',
				visuals: {
					row: {
						src: 'https://images.pexels.com/photos/1234/pexels-photo-1234.jpeg?auto=compress&cs=tinysrgb&w=1600',
						alt: 'First image'
					}
				}
			},
			{
				slug: 'second',
				title: 'Second',
				visuals: {
					focal: {
						src: 'https://images.pexels.com/photos/1234/pexels-photo-1234.jpeg?auto=compress&cs=tinysrgb&w=900',
						alt: 'Second image'
					}
				}
			}
		]);

		expect(articles[0].imageDiagnostics).toContainEqual(
			expect.objectContaining({ kind: 'shared-side-image', label: 'Shared side image' })
		);
		expect(articles[1].imageDiagnostics).toContainEqual(
			expect.objectContaining({ kind: 'shared-side-image', label: 'Shared side image' })
		);
	});

	it('flags articles with no card-side image source', () => {
		const articles = addArticleImageDiagnostics([
			{
				slug: 'plain',
				title: 'Plain article'
			}
		]);

		expect(articles[0].imageDiagnostics).toEqual([
			expect.objectContaining({ kind: 'missing-side-image', label: 'No side image' })
		]);
	});

	it('keeps meaningful query params in normalized local image keys', () => {
		expect(normalizedSideImageKey('/img/articles/demo/focal.svg?v=2&w=1200')).toBe(
			'/img/articles/demo/focal.svg?v=2'
		);
	});
});
