import { base } from '$app/paths';
import type { Article } from './articles';
import { normalizeContentTag } from './tags';

export type ArticleIndexStatus = 'published' | 'draft' | 'all';
export type ArticleIndexView = 'compact' | 'full';

export type ArticleIndexHrefOptions = {
	view?: ArticleIndexView;
	status?: ArticleIndexStatus;
	tag?: string;
	q?: string;
};

export function articleIndexHref(options: ArticleIndexHrefOptions = {}): string {
	const searchParams = new URLSearchParams();
	const targetBase = options.status === 'draft' ? `${base}/drafts` : base;

	if (options.view === 'compact') {
		searchParams.set('view', 'compact');
	}

	if (options.status && options.status !== 'published' && options.status !== 'draft') {
		searchParams.set('status', options.status);
	}

	if (options.tag) {
		searchParams.set('tag', options.tag);
	}

	if (options.q) {
		searchParams.set('q', options.q);
	}

	const query = searchParams.toString();
	return query ? `${targetBase}/?${query}` : `${targetBase}/`;
}

export function articleTagIndexHref(tag: string, status: ArticleIndexStatus = 'published'): string {
	return articleIndexHref({ view: 'compact', status, tag });
}

export function articleSearchText(article: Article): string {
	return [
		article.title,
		article.summary,
		article.draftType,
		article.status,
		...article.tags,
		...article.design.tags
	]
		.join(' ')
		.toLowerCase();
}

export function articleMatchesTag(article: Article, tag: string): boolean {
	const normalizedTag = normalizeTag(tag);
	return [...article.tags, ...article.design.tags].some(
		(candidate) => normalizeTag(candidate) === normalizedTag
	);
}

function normalizeTag(value: string): string {
	return normalizeContentTag(value);
}
