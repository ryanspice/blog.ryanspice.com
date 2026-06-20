import { base } from '$app/paths';

import { isPublicArticle, type Article } from './articles';
import { articleCanonicalPath } from './article-paths';

export function articleHref(article: Pick<Article, 'date' | 'slug' | 'status' | 'releaseDate' | 'locale'>): string {
	return isPublicArticle(article) ? `${base}${articleCanonicalPath(article)}` : `${base}/drafts/${article.slug}/`;
}
