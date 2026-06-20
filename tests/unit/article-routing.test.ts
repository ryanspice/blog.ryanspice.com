import { describe, expect, it, vi } from 'vitest';

import { articleCanonicalPath, articleDateRouteParams, articleLegacyPath } from '../../src/lib/article-paths';
import { articleTagIndexHref } from '../../src/lib/article-browse';
import { articleSocialShareHref } from '../../src/lib/article-share';
import { pathWithLocale } from '../../src/lib/i18n/locales';

vi.mock('$app/paths', () => ({ base: '' }));

describe('locale routing helper', () => {
	it('keeps english routes unprefixed', () => {
		expect(pathWithLocale('en', '/')).toBe('/');
		expect(pathWithLocale('en', '/drafts/')).toBe('/drafts/');
		expect(pathWithLocale('en', '/dev-log/')).toBe('/dev-log/');
	});

	it('prefixes routed locales', () => {
		expect(pathWithLocale('fr', '/')).toBe('/fr/');
		expect(pathWithLocale('fr', '/drafts/')).toBe('/fr/drafts/');
		expect(pathWithLocale('fr', '/dev-log/')).toBe('/fr/dev-log/');
	});

	it('leaves hash and absolute URLs untouched', () => {
		expect(pathWithLocale('fr', '#articles')).toBe('#articles');
		expect(pathWithLocale('fr', 'https://example.com/feed.xml')).toBe('https://example.com/feed.xml');
	});
});

describe('article tag search links', () => {
	it('prefills the tag filter and search query', () => {
		expect(articleTagIndexHref('Cloudflare Workers AI')).toBe('/?view=compact&tag=Cloudflare+Workers+AI&q=Cloudflare+Workers+AI');
	});
});

describe('dated article paths', () => {
	const article = {
		date: '2026-06-20',
		locale: 'en' as const,
		slug: 'glm-5-2-hermes-cloudflare-workers-ai-delegation'
	};

	it('builds canonical dated paths for english articles', () => {
		expect(articleCanonicalPath(article)).toBe('/2026/06/20/glm-5-2-hermes-cloudflare-workers-ai-delegation/');
		expect(articleLegacyPath(article)).toBe('/glm-5-2-hermes-cloudflare-workers-ai-delegation/');
	});

	it('keeps routed locales before the dated article path', () => {
		expect(articleCanonicalPath({ ...article, locale: 'fr' })).toBe('/fr/2026/06/20/glm-5-2-hermes-cloudflare-workers-ai-delegation/');
	});

	it('returns date route params for prerender entries', () => {
		expect(articleDateRouteParams(article)).toEqual({
			year: '2026',
			month: '06',
			day: '20',
			slug: 'glm-5-2-hermes-cloudflare-workers-ai-delegation'
		});
	});
});

describe('article social share links', () => {
	it('builds encoded facebook share urls', () => {
		expect(articleSocialShareHref('facebook', 'https://blog.canopydigital.ca/glm-5-2/', 'GLM 5.2')).toBe(
			'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fblog.canopydigital.ca%2Fglm-5-2%2F'
		);
	});

	it('builds encoded x share urls with article text', () => {
		expect(articleSocialShareHref('x', 'https://blog.ryanspice.com/post/', 'Title with spaces')).toBe(
			'https://twitter.com/intent/tweet?url=https%3A%2F%2Fblog.ryanspice.com%2Fpost%2F&text=Title+with+spaces'
		);
	});
});
