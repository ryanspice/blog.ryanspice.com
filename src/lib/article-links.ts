import { base } from '$app/paths';

import { isPublicArticle, type Article } from './articles';
import { pathWithLocale } from './i18n/locales';

export function articleHref(article: Pick<Article, 'slug' | 'status' | 'releaseDate' | 'locale'>): string {
	return isPublicArticle(article) ? `${base}${pathWithLocale(article.locale, `/${article.slug}/`)}` : `${base}/drafts/${article.slug}/`;
}
