import { base } from '$app/paths';
import { building } from '$app/environment';
import { error, redirect } from '@sveltejs/kit';

import { articleCanonicalPath, articleDateParamsMatch, articleDateRouteParams } from '$lib/article-paths';
import {
	getArticle,
	getArticleAlternates,
	getPublishedArticlesForLocale,
	getRelatedArticles,
	isPublicArticle,
	type Article
} from '$lib/articles';
import { DEFAULT_LOCALE, localeToHreflang, type SupportedLocale } from '$lib/i18n/locales';
import { getSiteConfig } from '$lib/server/site';

type LegacyArticleParams = {
	slug: string;
};

type DatedArticleParams = LegacyArticleParams & {
	year: string;
	month: string;
	day: string;
};

export function datedArticleEntries(locale: SupportedLocale = DEFAULT_LOCALE): DatedArticleParams[] {
	return getPublishedArticlesForLocale(locale)
		.map(articleDateRouteParams)
		.filter((params): params is DatedArticleParams => params !== null);
}

export function redirectLegacyArticlePage(params: LegacyArticleParams, url: URL, locale: SupportedLocale = DEFAULT_LOCALE): never {
	const article = getArticle(params.slug, locale);

	if (!article || !isPublicArticle(article)) {
		throw error(404, 'Article not found');
	}

	throw redirectToCanonical(article, url);
}

export function loadDatedArticlePage(params: DatedArticleParams, url: URL, locale: SupportedLocale = DEFAULT_LOCALE) {
	const article = getArticle(params.slug, locale);

	if (!article || !isPublicArticle(article)) {
		throw error(404, 'Article not found');
	}

	if (!articleDateParamsMatch(article, params)) {
		throw redirectToCanonical(article, url);
	}

	return articlePageData(article, url);
}

function redirectToCanonical(article: Article, url: URL): never {
	const search = building ? '' : url.search;
	throw redirect(308, `${base}${articleCanonicalPath(article)}${search}`);
}

function articlePageData(article: Article, url: URL) {
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
}
