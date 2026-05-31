import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getArticle, publishedArticles } from '$lib/articles';

export const prerender = true;

export function entries() {
	return publishedArticles.map((article) => ({ slug: article.slug }));
}

export const load: PageLoad = ({ params }) => {
	const article = getArticle(params.slug);

	if (!article || article.status !== 'published') {
		throw error(404, 'Article not found');
	}

	return { article };
};
