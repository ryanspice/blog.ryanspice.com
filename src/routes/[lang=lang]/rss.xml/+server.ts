import { renderRssXml } from '$lib/server/rss';

export const prerender = true;
export const trailingSlash = 'never';

export function entries() {
	return [{ lang: 'fr' }];
}

export const GET = ({ params, url }: { params: { lang: string }; url: URL }) => {
	return renderRssXml(url, params.lang);
};
