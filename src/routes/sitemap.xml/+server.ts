import { base } from '$app/paths';
import { articles } from '$lib/articles';

export const prerender = true;

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

type SitemapEntry = {
	loc: string;
	lastmod?: string;
	changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
	priority?: number;
};

function normalizeIsoDate(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString().slice(0, 10);
}

export const GET = ({ url }: { url: URL }) => {
	const entries: SitemapEntry[] = [
		{
			loc: new URL(`${base}/`, url.origin).toString(),
			changefreq: 'weekly',
			priority: 1.0
		},
		{
			loc: new URL(`${base}/dev-log/`, url.origin).toString(),
			changefreq: 'weekly',
			priority: 0.6
		},
		...articles.map<SitemapEntry>((article) => ({
			loc: new URL(`${base}/${article.slug}/`, url.origin).toString(),
			lastmod: normalizeIsoDate(article.date),
			changefreq: 'yearly',
			priority: 0.7
		}))
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map((entry) => {
		const parts = [
			`<loc>${escapeXml(entry.loc)}</loc>`,
			entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '',
			entry.changefreq ? `<changefreq>${escapeXml(entry.changefreq)}</changefreq>` : '',
			typeof entry.priority === 'number' ? `<priority>${entry.priority.toFixed(1)}</priority>` : ''
		]
			.filter(Boolean)
			.join('');

		return `
	<url>
		${parts}
	</url>`.trimEnd();
	})
	.join('\n')}
</urlset>`.trim();

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
