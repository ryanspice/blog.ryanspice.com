export type ArticlePublicationState = {
	status: string;
	releaseDate?: string | null;
};

export type ArticlePublishDateState = {
	date: string;
	releaseDate?: string | null;
};

const publicationClock = new Date();

export function isPublicArticle(article: ArticlePublicationState): boolean {
	if (article.status === 'published') return true;
	return Boolean(article.releaseDate && isDateReached(article.releaseDate, publicationClock));
}

export function effectivePublishDate(article: ArticlePublishDateState): string {
	return article.releaseDate || article.date;
}

function isDateReached(value: string, now: Date): boolean {
	const parsed = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return false;
	const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	return parsed.getTime() <= todayUtc;
}
