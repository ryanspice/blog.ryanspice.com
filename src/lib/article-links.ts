import { base } from '$app/paths';

import type { Article } from './articles';

export function articleHref(article: Pick<Article, 'slug' | 'status'>): string {
	return article.status === 'published' ? `${base}/${article.slug}/` : `${base}/drafts/${article.slug}/`;
}
