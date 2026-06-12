import type { PageServerLoad } from './$types';
import { base } from '$app/paths';
import { researchDomains, researchLibraryItems, sourceTypes } from '$lib/research-library';
import { enrichResearchLibraryItems } from '$lib/server/research-library-images';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const canonical = new URL(url.pathname, url.origin).toString();
	const ogImage = new URL(`${base}/og-default.png`, url.origin).toString();
	const paperCount = researchLibraryItems.filter((item) => item.sourceType === 'paper').length;
	const libraryItems = await enrichResearchLibraryItems(researchLibraryItems, fetch);

	return {
		canonical,
		ogImage,
		libraryItems,
		paperCount,
		researchDomains,
		sourceTypes
	};
};
