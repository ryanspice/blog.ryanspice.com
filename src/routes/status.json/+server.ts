import { base } from '$app/paths';
import { articleCanonicalPath } from '$lib/article-paths';
import { draftArticles, publishedArticles, articles, articleTags, publishedArticleTags } from '$lib/articles';
import pkg from '../../../package.json';

export const prerender = true;

type PackageJson = {
	name?: string;
	version?: string;
	devDependencies?: Record<string, string>;
};

function normalizeVersion(value: unknown): string {
	return typeof value === 'string' && value.trim() ? value.trim() : 'unknown';
}

export const GET = ({ url }: { url: URL }) => {
	const packageJson = pkg as PackageJson;
	const siteUrl = new URL(`${base}/`, url.origin).toString();

	const fixedPages = ['/', '/dev-log/', '/drafts/', '/login/', '/auth/callback/', '/status/'];
	const publishedPages = publishedArticles.map((article) => articleCanonicalPath(article));
	const draftPages = draftArticles.map((article) => `/drafts/${article.slug}/`);

	const payload = {
		ok: true,
		siteUrl,
		build: {
			name: packageJson.name ?? 'blog.ryanspice.com',
			version: packageJson.version ?? '0.0.0',
			svelteKit: normalizeVersion(packageJson.devDependencies?.['@sveltejs/kit']),
			svelte: normalizeVersion(packageJson.devDependencies?.svelte),
			vite: normalizeVersion(packageJson.devDependencies?.vite)
		},
		counts: {
			articles: articles.length,
			publishedArticles: publishedArticles.length,
			draftArticles: draftArticles.length,
			tags: articleTags.length,
			publishedTags: publishedArticleTags.length
		},
		pages: {
			fixed: fixedPages.length,
			published: publishedPages.length,
			drafts: draftPages.length,
			total: fixedPages.length + publishedPages.length + draftPages.length
		}
	};

	return new Response(JSON.stringify(payload, null, 2), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=300'
		}
	});
};
