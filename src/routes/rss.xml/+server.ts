import { renderRssXml } from '$lib/server/rss';

export const prerender = true;
export const trailingSlash = 'never';

export const GET = ({ url }: { url: URL }) => {
	return renderRssXml(url, 'en');
};
