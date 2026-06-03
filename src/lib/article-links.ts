import { base } from '$app/paths';

import { isPublicArticle, type Article } from './articles';

export function articleHref(article: Pick<Article, 'slug' | 'status' | 'releaseDate'>): string {
	return isPublicArticle(article) ? `${base}/${article.slug}/` : `${base}/drafts/${article.slug}/`;
}
