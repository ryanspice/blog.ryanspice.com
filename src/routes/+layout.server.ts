import { localeToLanguageTag, resolveLocaleFromPathname } from '$lib/i18n/locales';
import { getSiteConfig, getSiteDictionary } from '$lib/server/site';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ url }) => {
	const locale = resolveLocaleFromPathname(url.pathname);
	const site = getSiteConfig();

	return {
		locale,
		languageTag: localeToLanguageTag(locale),
		site,
		ui: getSiteDictionary(locale, site)
	};
};
