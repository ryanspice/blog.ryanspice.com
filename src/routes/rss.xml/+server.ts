import { base } from '$app/paths';
import { publishedArticles } from '$lib/articles';

export const prerender = true;
export const trailingSlash = 'never';

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function toRfc822Date(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return new Date().toUTCString();
	return date.toUTCString();
}

export const GET = ({ url }: { url: URL }) => {
	const siteTitle = 'blog.ryanspice.com';
	const channelTitle = 'Ryan Spice · Technical notes';
	const channelDescription = 'Published technical notes and production notes from Ryan Spice.';
	const channelUrl = new URL(`${base}/`, url.origin).toString();
	const selfUrl = new URL(`${base}/rss.xml`, url.origin).toString();

	const sorted = publishedArticles
		.slice()
		.sort((a, b) => b.date.localeCompare(a.date))

	const lastBuildDate = sorted[0]?.date ? toRfc822Date(sorted[0].date) : new Date().toUTCString();

	const items = sorted
		.map((article) => {
			const itemUrl = new URL(`${base}/${article.slug}/`, url.origin).toString();
			const pubDate = toRfc822Date(article.date);

			return `
<item>
	<title>${escapeXml(article.title)}</title>
	<link>${escapeXml(itemUrl)}</link>
	<guid isPermaLink="true">${escapeXml(itemUrl)}</guid>
	<pubDate>${escapeXml(pubDate)}</pubDate>
	<description>${escapeXml(article.summary)}</description>
</item>`.trim();
		})
		.join('\n');

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
	<title>${escapeXml(channelTitle)}</title>
	<link>${escapeXml(channelUrl)}</link>
	<description>${escapeXml(channelDescription)}</description>
	<language>en</language>
	<lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>
	<generator>${escapeXml(siteTitle)}</generator>
	<atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
${items ? `\n${items}\n` : '\n'}
</channel>
</rss>`.trim();

	return new Response(rss, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
