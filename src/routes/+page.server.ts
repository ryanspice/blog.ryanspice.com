import type { PageServerLoad } from './$types';
import { loadHomePage } from '$lib/server/home-page';
import { resolveLocaleFromPathname } from '$lib/i18n/locales';

export const load: PageServerLoad = ({ url }) => {
	return loadHomePage(url, resolveLocaleFromPathname(url.pathname));
};
