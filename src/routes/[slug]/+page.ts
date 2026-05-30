import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { articles, getArticle } from '$lib/articles';

export const prerender = true;

export function entries() {
	return articles.map((article) => ({ slug: article.slug }));
}

export const load: PageLoad = ({ params }) => {
	const article = getArticle(params.slug);

	if (!article) {
		throw error(404, 'Article not found');
	}

	return { article };
};
