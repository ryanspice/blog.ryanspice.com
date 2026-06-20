import type { PageServerLoad } from './$types';
import { resolveLocale, type SupportedLocale } from '$lib/i18n/locales';
import { datedArticleEntries, loadDatedArticlePage } from '$lib/server/article-page';

export function entries() {
	return datedArticleEntries('fr').map((entry) => ({
		lang: 'fr',
		...entry
	}));
}

export const load: PageServerLoad = ({ params, url }) => {
	const locale = resolveLocale(params.lang) as SupportedLocale;
	return loadDatedArticlePage(params, url, locale);
};
