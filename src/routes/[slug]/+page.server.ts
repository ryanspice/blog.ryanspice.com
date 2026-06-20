import type { PageServerLoad } from './$types';
import { publishedArticles } from '$lib/articles';
import { redirectLegacyArticlePage } from '$lib/server/article-page';

export function entries() {
	return publishedArticles.map((article) => ({ slug: article.slug }));
}

export const load: PageServerLoad = ({ params, url }) => {
	return redirectLegacyArticlePage(params, url);
};
