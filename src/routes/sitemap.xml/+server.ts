import { base } from '$app/paths';
import { allPublishedArticles, getArticleAlternates, type Article } from '$lib/articles';
import { pathWithLocale, SUPPORTED_LOCALES, type SupportedLocale } from '$lib/i18n/locales';
import { getSiteConfig } from '$lib/server/site';

export const prerender = true;

type SitemapAlternate = {
	hreflang: string;
	href: string;
};

type SitemapEntry = {
	loc: string;
	lastmod?: string;
	changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
	priority?: number;
	alternates?: SitemapAlternate[];
};

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function normalizeIsoDate(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString().slice(0, 10);
}

function absoluteUrl(origin: string, pathname: string): string {
	return new URL(`${base}${pathname}`, origin).toString();
}

function localizedAlternates(origin: string, pathname: string): SitemapAlternate[] {
	const alternates = SUPPORTED_LOCALES.map((locale) => ({
		hreflang: locale === 'fr' ? 'fr-CA' : locale,
		href: absoluteUrl(origin, pathWithLocale(locale, pathname))
	}));

	return [
		...alternates,
		{
			hreflang: 'x-default',
			href: absoluteUrl(origin, pathWithLocale('en', pathname))
		}
	];
}

function articlePath(article: Pick<Article, 'locale' | 'slug'>): string {
	return pathWithLocale(article.locale, `/${article.slug}/`);
}

function articleAlternates(origin: string, article: Article): SitemapAlternate[] | undefined {
	const alternates = getArticleAlternates(article);
	if (alternates.length < 2) return undefined;

	const links = alternates.map((alternate) => ({
		hreflang: alternate.hreflang,
		href: absoluteUrl(origin, alternate.path)
	}));
	const english = alternates.find((alternate) => alternate.locale === 'en');

	return english
		? [
				...links,
				{
					hreflang: 'x-default',
					href: absoluteUrl(origin, english.path)
				}
			]
		: links;
}

function localizedPageEntries(origin: string, pathname: string, options: Pick<SitemapEntry, 'changefreq' | 'priority'>): SitemapEntry[] {
	return SUPPORTED_LOCALES.map((locale: SupportedLocale) => ({
		loc: absoluteUrl(origin, pathWithLocale(locale, pathname)),
		...options,
		alternates: localizedAlternates(origin, pathname)
	}));
}

function renderEntry(entry: SitemapEntry): string {
	const parts = [
		`<loc>${escapeXml(entry.loc)}</loc>`,
		entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '',
		entry.changefreq ? `<changefreq>${escapeXml(entry.changefreq)}</changefreq>` : '',
		typeof entry.priority === 'number' ? `<priority>${entry.priority.toFixed(1)}</priority>` : '',
		...(entry.alternates ?? []).map(
			(alternate) =>
				`<xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}" />`
		)
	]
		.filter(Boolean)
		.join('');

	return `
	<url>
		${parts}
	</url>`.trimEnd();
}

export const GET = ({ url }: { url: URL }) => {
	const site = getSiteConfig();
	const entries: SitemapEntry[] = [
		...localizedPageEntries(url.origin, '/', {
			changefreq: 'weekly',
			priority: 1.0
		}),
		...localizedPageEntries(url.origin, '/rss-reader/', {
			changefreq: 'weekly',
			priority: 0.5
		}),
		...site.indexedUtilityRoutes.map((route) => ({
			loc: absoluteUrl(url.origin, route.path),
			changefreq: route.changefreq,
			priority: route.priority
		})),
		...allPublishedArticles.map<SitemapEntry>((article) => ({
			loc: absoluteUrl(url.origin, articlePath(article)),
			lastmod: normalizeIsoDate(article.updatedDate || article.date),
			changefreq: 'yearly',
			priority: 0.7,
			alternates: articleAlternates(url.origin, article)
		}))
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(renderEntry).join('\n')}
</urlset>`.trim();

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
