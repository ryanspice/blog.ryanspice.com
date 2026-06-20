import type { PageServerLoad } from './$types';
import { getPublishedArticlesForLocale } from '$lib/articles';
import { resolveLocale, type SupportedLocale } from '$lib/i18n/locales';
import { redirectLegacyArticlePage } from '$lib/server/article-page';

export function entries() {
	return getPublishedArticlesForLocale('fr').map((article) => ({ lang: article.locale, slug: article.slug }));
}

export const load: PageServerLoad = ({ params, url }) => {
	const locale = resolveLocale(params.lang) as SupportedLocale;
	return redirectLegacyArticlePage(params, url, locale);
};
