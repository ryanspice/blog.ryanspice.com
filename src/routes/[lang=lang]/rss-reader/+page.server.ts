import type { PageServerLoad } from './$types';
import { loadRssReaderPage } from '$lib/server/rss';

export const prerender = true;

export function entries() {
	return [{ lang: 'fr' }];
}

export const load: PageServerLoad = ({ params, url }) => {
	return loadRssReaderPage(url, params.lang);
};
