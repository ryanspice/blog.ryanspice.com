import { base } from '$app/paths';
import { getSiteConfig } from '$lib/server/site';

export const prerender = true;

export const GET = ({ url }: { url: URL }) => {
	const site = getSiteConfig();
	const sitemapUrl = new URL(`${base}/sitemap.xml`, url.origin).toString();

	const robots = [
		'User-agent: *',
		'Allow: /',
		'',
		...site.robotsDisallow.map((path) => `Disallow: ${path}`),
		'',
		`Sitemap: ${sitemapUrl}`
	].join('\n');

	return new Response(robots, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
