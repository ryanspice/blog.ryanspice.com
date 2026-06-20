import type { PageServerLoad } from './$types';
import { datedArticleEntries, loadDatedArticlePage } from '$lib/server/article-page';

export function entries() {
	return datedArticleEntries('en');
}

export const load: PageServerLoad = ({ params, url }) => {
	return loadDatedArticlePage(params, url, 'en');
};
