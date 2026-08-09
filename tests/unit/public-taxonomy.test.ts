import { describe, expect, it } from 'vitest';
import { getPublishedArticlesForLocale, publishedArticles } from '../../src/lib/articles';
import { isArticleEnabledForSurface } from '../../src/lib/article-surfaces';
import {
	PUBLIC_ARTICLE_TYPES,
	resolvePublicArticleType,
	type PublicArticleType
} from '../../src/lib/public-taxonomy';

describe('public article taxonomy', () => {
	it('resolves every published article to one allowed public type', () => {
		const counts = Object.fromEntries(PUBLIC_ARTICLE_TYPES.map((type) => [type, 0])) as Record<PublicArticleType, number>;
		for (const article of publishedArticles) {
			expect(PUBLIC_ARTICLE_TYPES).toContain(article.publicType);
			counts[article.publicType] += 1;
		}
		console.log('PUBLIC_TYPE_COUNTS', counts);
		expect(publishedArticles.length).toBeGreaterThan(0);
	});

	it('rejects invalid explicit public types', () => {
		expect(() => resolvePublicArticleType('research-note', 'opinion')).toThrow(/Invalid public_type/);
	});

	it('keeps explicit valid public types authoritative', () => {
		expect(resolvePublicArticleType('research-note', 'field-note')).toBe('field-note');
	});

	it('keeps Ryan and Canopy public labels aligned by slug', () => {
		const articles = getPublishedArticlesForLocale('en');
		const ryan = new Map(
			articles.filter((article) => isArticleEnabledForSurface(article, 'ryan')).map((article) => [article.slug, article.publicType])
		);
		const canopy = new Map(
			articles.filter((article) => isArticleEnabledForSurface(article, 'canopy-blog')).map((article) => [article.slug, article.publicType])
		);
		expect([...ryan.entries()]).toEqual([...canopy.entries()]);
	});
});
