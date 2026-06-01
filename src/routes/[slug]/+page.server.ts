import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getArticle, getRelatedArticles, publishedArticles } from '$lib/articles';

export function entries() {
	return publishedArticles.map((article) => ({ slug: article.slug }));
}

export const load: PageServerLoad = ({ params }) => {
	const article = getArticle(params.slug);

	if (!article || article.status !== 'published') {
		throw error(404, 'Article not found');
	}

	return {
		article,
		relatedArticles: getRelatedArticles(article, 3)
	};
};

