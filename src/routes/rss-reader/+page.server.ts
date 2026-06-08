import type { PageServerLoad } from './$types';
import { loadRssReaderPage } from '$lib/server/rss';
import { resolveLocaleFromPathname } from '$lib/i18n/locales';

export const prerender = true;

export const load: PageServerLoad = ({ url }) => {
	return loadRssReaderPage(url, resolveLocaleFromPathname(url.pathname));
};
