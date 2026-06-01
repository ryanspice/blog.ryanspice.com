import { base } from '$app/paths';
import type { PageServerLoad } from './$types';
import pkg from '../../../package.json';

type PackageJson = {
	name?: string;
	version?: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

function normalizeVersion(value: unknown): string {
	return typeof value === 'string' && value.trim() ? value.trim() : 'unknown';
}

type ArticleSlug = { slug: string };

function countPages(published: ArticleSlug[], drafts: ArticleSlug[]) {
	// A pragmatic, user-facing count: "things that behave like pages you can navigate to".
	const fixedPages = [
		'/', // home
		'/dev-log/',
		'/drafts/',
		'/login/',
		'/auth/callback/',
		'/status/'
	];

	const publishedPages = published.map((article) => `/${article.slug}/`);
	const draftPages = drafts.map((article) => `/drafts/${article.slug}/`);

	return {
		fixed: fixedPages.length,
		published: publishedPages.length,
		drafts: draftPages.length,
		total: fixedPages.length + publishedPages.length + draftPages.length
	};
}

export const load: PageServerLoad = async ({ url }) => {
	const canonical = new URL(url.pathname, url.origin).toString();
	const rssUrl = new URL(`${base}/rss.xml`, url.origin).toString();
	const ogImage = new URL(`${base}/og-default.png`, url.origin).toString();

	const packageJson = pkg as PackageJson;
	const build = {
		name: packageJson.name ?? 'blog.ryanspice.com',
		version: packageJson.version ?? '0.0.0',
		svelteKit: normalizeVersion(packageJson.devDependencies?.['@sveltejs/kit']),
		svelte: normalizeVersion(packageJson.devDependencies?.svelte),
		vite: normalizeVersion(packageJson.devDependencies?.vite)
	};

	let pages = {
		fixed: 6,
		published: 0,
		drafts: 0,
		total: 6
	};

	let counts = {
		articles: 0,
		publishedArticles: 0,
		draftArticles: 0,
		tags: 0,
		publishedTags: 0
	};

	try {
		const module = await import('$lib/articles');
		pages = countPages(module.publishedArticles, module.draftArticles);
		counts = {
			articles: module.articles.length,
			publishedArticles: module.publishedArticles.length,
			draftArticles: module.draftArticles.length,
			tags: module.articleTags.length,
			publishedTags: module.publishedArticleTags.length
		};
	} catch {
		// Keep /status usable even if article imports drift during deploys.
	}

	return {
		canonical,
		rssUrl,
		ogImage,
		pages,
		counts,
		build
	};
};
