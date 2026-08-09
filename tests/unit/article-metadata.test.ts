import { describe, expect, it, vi } from 'vitest';

import { articleTagIndexHref } from '../../src/lib/article-browse';
import { buildArticleJsonLd } from '../../src/lib/article-view-model';
import { jsonLdScriptText } from '../../src/lib/safe-html';
import { siteConfigs } from '../../src/lib/site-config';

vi.mock('$app/paths', () => ({ base: '' }));

const article = {
	date: '2026-08-09',
	updatedDate: '2026-08-09',
	title: 'MiMo and the coding harness',
	tags: ['MiMo', 'DeepSeek'],
	wordCount: 1200,
	readingMinutes: 6,
	coAuthors: [],
	canonicalSurface: 'ryan' as const,
	locale: 'en' as const,
	slug: 'mimo-vs-deepseek-harness-matters'
};

describe('article metadata contract', () => {
	it('serializes parseable BlogPosting JSON-LD without template placeholders', () => {
		const value = buildArticleJsonLd(
			article as never,
			siteConfigs.ryan,
			'Home',
			'/',
			'https://blog.ryanspice.com/2026/08/09/mimo-vs-deepseek-harness-matters/',
			'A workflow field note',
			[{ '@type': 'Person', name: 'Ryan Spice', url: 'https://ryanspice.com' }],
			'https://blog.ryanspice.com/img/social/ryan/articles/mimo.png',
			'MiMo article image',
			'https://blog.ryanspice.com'
		);
		const text = String(jsonLdScriptText(value));

		expect(text).not.toContain('{text}');
		expect(JSON.parse(text)).toMatchObject({ '@graph': [{ '@type': 'BreadcrumbList' }, { '@type': 'BlogPosting' }] });
	});

	it('builds published tag links without scheduled-status queries', () => {
		const href = articleTagIndexHref('MiMo', 'published');

		expect(href).toContain('tag=MiMo');
		expect(href).toContain('q=MiMo');
		expect(href).not.toContain('status=scheduled');
	});
});
