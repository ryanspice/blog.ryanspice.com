import { base } from '$app/paths';
import {
	DEFAULT_LOCALE,
	localeToHreflang,
	pathWithLocale,
	resolveLocale,
	type SupportedLocale
} from '$lib/i18n/locales';
import { getPublishedArticleTagsForLocale, getPublishedArticlesForLocale } from '$lib/articles';
import { getSiteConfig, getSiteDictionary } from './site';

export function absoluteLocalizedUrl(url: URL, locale: SupportedLocale, path: string): string {
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
	const publishedArticles = getPublishedArticlesForLocale(locale);
	const recentPublishedArticles = publishedArticles.slice(0, 5);
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
		ogImage: new URL(`${base}${site.defaultOgImage}`, url.origin).toString(),
		publishedArticles,
		recentPublishedArticles,
		publishedArticleTags: getPublishedArticleTagsForLocale(locale)
	};
}
