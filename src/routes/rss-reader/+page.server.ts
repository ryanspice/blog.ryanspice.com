import { base } from '$app/paths';
import type { PageServerLoad } from './$types';
import { publishedArticles } from '$lib/articles';

export const prerender = true;

export const load: PageServerLoad = ({ url }) => {
	const canonical = new URL(`${base}/rss.xml/`, url.origin).toString();
	const feedUrl = new URL(`${base}/rss.xml`, url.origin).toString();
	const homeUrl = new URL(`${base}/`, url.origin).toString();
	const latestArticles = publishedArticles.slice(0, 5).map((article) => ({
		title: article.title,
		slug: article.slug,
		summary: article.summary,
		date: article.date,
		dateLabel: article.dateLabel,
		readingMinutes: article.readingMinutes,
		tags: article.tags.slice(0, 5)
	}));

	return { canonical, feedUrl, homeUrl, latestArticles };
};
