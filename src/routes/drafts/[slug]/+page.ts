import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { draftArticles } from '$lib/articles';

export function entries() {
	return draftArticles.map((article) => ({ slug: article.slug }));
}

export const load: PageLoad = ({ params }) => {
	const article = draftArticles.find((item) => item.slug === params.slug);

	if (!article) {
		throw error(404, 'Draft not found');
	}

	return { slug: params.slug };
};
