import { base } from '$app/paths';
import type { SupportedLocale } from './i18n/locales';

import { articleCanonicalPath } from './article-paths';
import { isPublicArticle } from './article-publication';

type ArticleHrefInput = {
	date: string;
	slug: string;
	status: string;
	releaseDate?: string | null;
	locale: SupportedLocale;
};

export function articleHref(article: ArticleHrefInput): string {
	return isPublicArticle(article) ? `${base}${articleCanonicalPath(article)}` : `${base}/drafts/${article.slug}/`;
}
