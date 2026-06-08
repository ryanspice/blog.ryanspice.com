import { getDictionary } from '$lib/i18n/dictionaries';
import { localeToLanguageTag, resolveLocaleFromPathname } from '$lib/i18n/locales';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ url }) => {
	const locale = resolveLocaleFromPathname(url.pathname);

	return {
		locale,
		languageTag: localeToLanguageTag(locale),
		ui: getDictionary(locale)
	};
};
