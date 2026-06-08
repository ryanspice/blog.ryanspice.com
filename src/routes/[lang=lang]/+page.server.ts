import type { PageServerLoad } from './$types';
import { loadHomePage } from '$lib/server/home-page';

export const prerender = true;

export function entries() {
	return [{ lang: 'fr' }];
}

export const load: PageServerLoad = ({ params, url }) => {
	return loadHomePage(url, params.lang);
};
