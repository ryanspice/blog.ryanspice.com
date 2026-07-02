import type { PageServerLoad } from './$types';
import { base } from '$app/paths';
import { resolveLocaleFromPathname } from '$lib/i18n/locales';
import { researchDomains, researchLibraryItems, sourceTypes } from '$lib/research-library';
import { enrichResearchLibraryItems } from '$lib/server/research-library-images';
import { getSiteConfig, getSiteDictionary } from '$lib/server/site';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const locale = resolveLocaleFromPathname(url.pathname);
	const site = getSiteConfig();
	const canonical = new URL(url.pathname, url.origin).toString();
	const ogImage = new URL(`${base}${site.defaultOgImage}`, url.origin).toString();
	const paperCount = researchLibraryItems.filter((item) => item.sourceType === 'paper').length;
	const libraryItems = await enrichResearchLibraryItems(researchLibraryItems, fetch);

	return {
		locale,
		site,
		ui: getSiteDictionary(locale, site),
		canonical,
		ogImage,
		libraryItems,
		paperCount,
		researchDomains,
		sourceTypes
	};
};
