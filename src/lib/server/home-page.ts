import { base } from '$app/paths';
import { getDictionary } from '$lib/i18n/dictionaries';
import {
	DEFAULT_LOCALE,
	localeToHreflang,
	pathWithLocale,
	resolveLocale,
	type SupportedLocale
} from '$lib/i18n/locales';
import { getPublishedArticleTagsForLocale, getPublishedArticlesForLocale } from '$lib/articles';

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
	const publishedArticles = getPublishedArticlesForLocale(locale);
	const recentPublishedArticles = publishedArticles.slice(0, 5);
	const localizedHomePath = pathWithLocale(locale, '/');
	const localizedRssPath = pathWithLocale(locale, '/rss.xml');

	return {
		locale,
		languageTag: localeToHreflang(locale),
		ui: getDictionary(locale),
		canonical: new URL(`${base}${localizedHomePath}`, url.origin).toString(),
		alternates: localizedPageAlternates(url, '/'),
		rssUrl: new URL(`${base}${localizedRssPath}`, url.origin).toString(),
		rssPath: localizedRssPath,
		homePath: localizedHomePath,
		ogImage: new URL(`${base}/og-default.png`, url.origin).toString(),
		publishedArticles,
		recentPublishedArticles,
		publishedArticleTags: getPublishedArticleTagsForLocale(locale)
	};
}
