import { pathWithLocale, type SupportedLocale } from './i18n/locales';

export type ArticleDatePathInput = {
	date: string;
	locale: SupportedLocale;
	slug: string;
};

export type ArticleDateSegments = {
	year: string;
	month: string;
	day: string;
};

export type ArticleDateRouteParams = ArticleDateSegments & {
	slug: string;
};

export function articleLegacyPath(article: Pick<ArticleDatePathInput, 'locale' | 'slug'>): string {
	return pathWithLocale(article.locale, `/${article.slug}/`);
}

export function articleCanonicalPath(article: ArticleDatePathInput): string {
	const segments = articleDateSegments(article.date);
	if (!segments) return articleLegacyPath(article);

	return pathWithLocale(article.locale, `/${segments.year}/${segments.month}/${segments.day}/${article.slug}/`);
}

export function articleDateRouteParams(article: ArticleDatePathInput): ArticleDateRouteParams | null {
	const segments = articleDateSegments(article.date);
	if (!segments) return null;

	return {
		...segments,
		slug: article.slug
	};
}

export function articleDateSegments(value: string): ArticleDateSegments | null {
	const normalized = value.trim();
	const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);

	if (match) {
		return {
			year: match[1],
			month: match[2],
			day: match[3]
		};
	}

	const parsed = new Date(`${normalized}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return null;

	return {
		year: String(parsed.getUTCFullYear()).padStart(4, '0'),
		month: String(parsed.getUTCMonth() + 1).padStart(2, '0'),
		day: String(parsed.getUTCDate()).padStart(2, '0')
	};
}

export function articleDateParamsMatch(article: ArticleDatePathInput, params: ArticleDateSegments): boolean {
	const segments = articleDateSegments(article.date);
	return Boolean(
		segments &&
			segments.year === params.year &&
			segments.month === params.month &&
			segments.day === params.day
	);
}
