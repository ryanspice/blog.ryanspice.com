import { base } from '$app/paths';
import { getPublishedArticlesForLocale } from '$lib/articles';
import {
	localeToHreflang,
	pathWithLocale,
	resolveLocale,
	type SupportedLocale
} from '$lib/i18n/locales';
import { localizedPageAlternates } from './home-page';
import { getSiteConfig, getSiteDictionary } from './site';

export const RSS_READER_PATH = '/rss-reader/';

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

export function renderRssXml(url: URL, localeValue?: string | null): Response {
	const locale = resolveLocale(localeValue);
	const site = getSiteConfig();
	const copy = getSiteDictionary(locale, site).rss;
	const channelUrl = new URL(`${base}${pathWithLocale(locale, '/')}`, url.origin).toString();
	const selfUrl = new URL(`${base}${pathWithLocale(locale, '/rss.xml')}`, url.origin).toString();
	const sorted = getPublishedArticlesForLocale(locale)
		.slice()
		.sort((a, b) => b.date.localeCompare(a.date));
	const lastBuildDate = sorted[0]?.date ? toRfc822Date(sorted[0].date) : new Date().toUTCString();
	const items = sorted
		.map((article) => {
			const itemUrl = new URL(`${base}${pathWithLocale(locale, `/${article.slug}/`)}`, url.origin).toString();
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
	<title>${escapeXml(copy.channelTitle)}</title>
	<link>${escapeXml(channelUrl)}</link>
	<description>${escapeXml(copy.channelDescription)}</description>
	<language>${escapeXml(localeToHreflang(locale))}</language>
	<lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>
	<generator>${escapeXml(site.generator)}</generator>
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
}

export function loadRssReaderPage(url: URL, localeValue?: string | null) {
	const locale = resolveLocale(localeValue);
	const site = getSiteConfig();
	const copy = getSiteDictionary(locale, site);
	const feedPath = pathWithLocale(locale, '/rss.xml');
	const readerPath = pathWithLocale(locale, RSS_READER_PATH);
	const latestArticles = getPublishedArticlesForLocale(locale)
		.slice(0, 5)
		.map((article) => ({
			title: article.title,
			slug: article.slug,
			href: pathWithLocale(locale, `/${article.slug}/`),
			summary: article.summary,
			date: article.date,
			dateLabel: article.dateLabel,
			readingMinutes: article.readingMinutes,
			tags: article.tags.slice(0, 5)
		}));

	return {
		locale,
		site,
		ui: copy,
		canonical: new URL(`${base}${readerPath}`, url.origin).toString(),
		alternates: localizedPageAlternates(url, RSS_READER_PATH),
		feedTitle: site.rssTitle,
		feedUrl: new URL(`${base}${feedPath}`, url.origin).toString(),
		feedPath,
		homeUrl: new URL(`${base}${pathWithLocale(locale, '/')}`, url.origin).toString(),
		latestArticles
	};
}
