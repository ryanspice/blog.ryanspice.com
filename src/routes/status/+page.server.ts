import { base } from '$app/paths';
import type { PageServerLoad } from './$types';
import pkg from '../../../package.json';
import { articles, articleTags, draftArticles, publishedArticles, publishedArticleTags } from '$lib/articles';

type PackageJson = {
	name?: string;
	version?: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

function normalizeVersion(value: unknown): string {
	return typeof value === 'string' && value.trim() ? value.trim() : 'unknown';
}

function countPages() {
	// A pragmatic, user-facing count: "things that behave like pages you can navigate to".
	const fixedPages = [
		'/', // home
		'/dev-log/',
		'/drafts/',
		'/login/',
		'/auth/callback/',
		'/status/'
	];

	const published = publishedArticles.map((article) => `/${article.slug}/`);
	const drafts = draftArticles.map((article) => `/drafts/${article.slug}/`);

	return {
		fixed: fixedPages.length,
		published: published.length,
		drafts: drafts.length,
		total: fixedPages.length + published.length + drafts.length
	};
}

export const load: PageServerLoad = ({ url }) => {
	const canonical = new URL(url.pathname, url.origin).toString();
	const rssUrl = new URL(`${base}/rss.xml`, url.origin).toString();
	const ogImage = new URL(`${base}/og-default.png`, url.origin).toString();

	const packageJson = pkg as PackageJson;
	const pages = countPages();

	return {
		canonical,
		rssUrl,
		ogImage,
		pages,
		counts: {
			articles: articles.length,
			publishedArticles: publishedArticles.length,
			draftArticles: draftArticles.length,
			tags: articleTags.length,
			publishedTags: publishedArticleTags.length
		},
		build: {
			name: packageJson.name ?? 'blog.ryanspice.com',
			version: packageJson.version ?? '0.0.0',
			svelteKit: normalizeVersion(packageJson.devDependencies?.['@sveltejs/kit']),
			svelte: normalizeVersion(packageJson.devDependencies?.svelte),
			vite: normalizeVersion(packageJson.devDependencies?.vite)
		}
	};
};

