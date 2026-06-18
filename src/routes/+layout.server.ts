import { base } from '$app/paths';
import { localeToLanguageTag, pathWithLocale, resolveLocaleFromPathname } from '$lib/i18n/locales';
import { getSiteConfig, getSiteDictionary } from '$lib/server/site';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ url }) => {
	const locale = resolveLocaleFromPathname(url.pathname);
	const site = getSiteConfig();
	const rssPath = pathWithLocale(locale, '/rss.xml');

	return {
		locale,
		languageTag: localeToLanguageTag(locale),
		site,
		ui: getSiteDictionary(locale, site),
		rssAlternateTitle: site.rssTitle,
		rssUrl: new URL(`${base}${rssPath}`, url.origin).toString()
	};
};
