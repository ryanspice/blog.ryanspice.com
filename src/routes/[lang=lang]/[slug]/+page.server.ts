import { base } from '$app/paths';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getArticle,
	getArticleAlternates,
	getPublishedArticlesForLocale,
	getRelatedArticles,
	isPublicArticle
} from '$lib/articles';
import { localeToHreflang, resolveLocale, type SupportedLocale } from '$lib/i18n/locales';

export function entries() {
	return getPublishedArticlesForLocale('fr').map((article) => ({ lang: article.locale, slug: article.slug }));
}

export const load: PageServerLoad = ({ params, url }) => {
	const locale = resolveLocale(params.lang) as SupportedLocale;
	const article = getArticle(params.slug, locale);

	if (!article || !isPublicArticle(article)) {
		throw error(404, 'Article not found');
	}

	return {
		locale,
		article,
		alternates: getArticleAlternates(article).map((alternate) => ({
			...alternate,
			hreflang: localeToHreflang(alternate.locale),
			href: new URL(`${base}${alternate.path}`, url.origin).toString()
		})),
		relatedArticles: getRelatedArticles(article, 3)
	};
};
