import { base } from '$app/paths';

export const prerender = true;

export const GET = ({ url }: { url: URL }) => {
	const sitemapUrl = new URL(`${base}/sitemap.xml`, url.origin).toString();

	const robots = [
		'User-agent: *',
		'Allow: /',
		'',
		'Disallow: /_incoming/',
		'Disallow: /_releases/',
		'Disallow: /_backups/',
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

