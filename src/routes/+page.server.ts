import { base } from '$app/paths';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = ({ url }) => {
	const canonical = new URL(url.pathname, url.origin).toString();
	const rssUrl = new URL(`${base}/rss.xml`, url.origin).toString();
	const ogImage = new URL(`${base}/og-default.png`, url.origin).toString();

	return { canonical, rssUrl, ogImage };
};
