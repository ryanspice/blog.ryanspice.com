import { base } from '$app/paths';
import {
	DEFAULT_LOCALE,
	localeToHreflang,
	pathWithLocale,
	resolveLocale,
	type SupportedLocale
} from '$lib/i18n/locales';
import { getPublishedArticlesForLocale } from '$lib/articles';
import { isArticleEnabledForSurface, siteIdToArticleSurface } from '$lib/article-surfaces';
import { getSiteConfig, getSiteDictionary } from './site';

function absoluteLocalizedUrl(url: URL, locale: SupportedLocale, path: string): string {
	return new URL(`${base}${pathWithLocale(locale, path)}`, url.origin).toString();
}

export function localizedPageAlternates(url: URL, path: string) {
	return [DEFAULT_LOCALE, 'fr' as const].map((locale) => ({
		locale,
		hreflang: localeToHreflang(locale),
		href: absoluteLocalizedUrl(url, locale, path)
	}));
}

export function loadHomePage(url: URL, localeValue?: string | null) {
	const locale = resolveLocale(localeValue);
	const site = getSiteConfig();
	const surface = siteIdToArticleSurface(site.id);
	const publishedArticles = getPublishedArticlesForLocale(locale).filter((article) => isArticleEnabledForSurface(article, surface));
	const recentPublishedArticles = publishedArticles.slice(0, 6);
	const localizedHomePath = pathWithLocale(locale, '/');
	const localizedRssPath = pathWithLocale(locale, '/rss.xml');
	const localizedRssReaderPath = pathWithLocale(locale, '/rss-reader/');

	return {
		locale,
		languageTag: localeToHreflang(locale),
		site,
		ui: getSiteDictionary(locale, site),
		canonical: new URL(`${base}${localizedHomePath}`, url.origin).toString(),
		alternates: localizedPageAlternates(url, '/'),
		rssUrl: new URL(`${base}${localizedRssPath}`, url.origin).toString(),
		rssPath: localizedRssPath,
		rssReaderUrl: new URL(`${base}${localizedRssReaderPath}`, url.origin).toString(),
		rssReaderPath: localizedRssReaderPath,
		 homePath: localizedHomePath,
		 archiveMode: url.searchParams.get('view') === 'archive',
		ogImage: new URL(`${base}${site.defaultOgImage}`, url.origin).toString(),
		publishedArticles,
		recentPublishedArticles,
		publishedArticleTags: Array.from(new Set(publishedArticles.flatMap((article) => article.tags))).sort((left, right) => left.localeCompare(right))
	};
}
