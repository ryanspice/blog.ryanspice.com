import { base } from '$app/paths';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getArticle, getArticleAlternates, getRelatedArticles, isPublicArticle, publishedArticles } from '$lib/articles';
import { localeToHreflang } from '$lib/i18n/locales';
import { getSiteConfig } from '$lib/server/site';

export function entries() {
	return publishedArticles.map((article) => ({ slug: article.slug }));
}

export const load: PageServerLoad = ({ params, url }) => {
	const article = getArticle(params.slug);

	if (!article || !isPublicArticle(article)) {
		throw error(404, 'Article not found');
	}

	return {
		locale: article.locale,
		site: getSiteConfig(),
		article,
		alternates: getArticleAlternates(article).map((alternate) => ({
			...alternate,
			hreflang: localeToHreflang(alternate.locale),
			href: new URL(`${base}${alternate.path}`, url.origin).toString()
		})),
		relatedArticles: getRelatedArticles(article, 3)
	};
};
