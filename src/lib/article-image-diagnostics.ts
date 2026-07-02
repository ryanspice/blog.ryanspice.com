import { articleCardImage, type ArticleFocalImage } from './article-focal-images';

export type ArticleImageDiagnosticKind = 'missing-side-image' | 'shared-side-image';

export type ArticleImageDiagnostic = {
	kind: ArticleImageDiagnosticKind;
	label: string;
	detail: string;
	sideImageSrc?: string;
};

type ArticleImageDiagnosticTarget = {
	slug: string;
	title?: string;
	visuals?: {
		focal?: ArticleFocalImage;
		row?: ArticleFocalImage;
		background?: ArticleFocalImage;
	};
};

const transformOnlyImageParams = new Set([
	'auto',
	'cs',
	'crop',
	'dpr',
	'fit',
	'fm',
	'format',
	'h',
	'height',
	'ixid',
	'ixlib',
	'q',
	'quality',
	'w',
	'width'
]);

export function addArticleImageDiagnostics<T extends ArticleImageDiagnosticTarget>(
	items: readonly T[]
): Array<T & { imageDiagnostics: ArticleImageDiagnostic[] }> {
	const sideImagesBySlug = new Map<string, string>();
	const groups = new Map<string, { src: string; articles: T[] }>();

	for (const article of items) {
		const src = articleCardImage(article)?.src.trim() ?? '';
		if (!src) continue;

		sideImagesBySlug.set(article.slug, src);
		const key = normalizedSideImageKey(src);
		const group = groups.get(key) ?? { src, articles: [] };
		group.articles.push(article);
		groups.set(key, group);
	}

	return items.map((article) => {
		const sideImageSrc = sideImagesBySlug.get(article.slug);
		const imageDiagnostics: ArticleImageDiagnostic[] = [];

		if (!sideImageSrc) {
			imageDiagnostics.push({
				kind: 'missing-side-image',
				label: 'No side image',
				detail: 'This article has no row image or focal image for the card side panel.'
			});
		} else {
			const group = groups.get(normalizedSideImageKey(sideImageSrc));
			const sharedCount = group?.articles.length ?? 0;

			if (sharedCount > 1) {
				const otherCount = sharedCount - 1;
				imageDiagnostics.push({
					kind: 'shared-side-image',
					label: 'Shared side image',
					detail: `This article card side image is also used by ${otherCount} other ${otherCount === 1 ? 'article' : 'articles'}.`,
					sideImageSrc
				});
			}
		}

		return {
			...article,
			imageDiagnostics
		};
	});
}

export function normalizedSideImageKey(src: string): string {
	const trimmed = src.trim();
	if (!trimmed) return '';

	try {
		const url = new URL(trimmed, 'https://local.invalid');
		const isLocal = url.origin === 'https://local.invalid';

		for (const key of Array.from(url.searchParams.keys())) {
			if (transformOnlyImageParams.has(key.toLowerCase())) {
				url.searchParams.delete(key);
			}
		}

		const query = new URLSearchParams(
			Array.from(url.searchParams.entries()).sort(([left], [right]) => left.localeCompare(right))
		).toString();
		const path = url.pathname.replace(/\/+$/, '').toLowerCase();

		return `${isLocal ? '' : `${url.protocol}//${url.host.toLowerCase()}`}${path}${query ? `?${query}` : ''}`;
	} catch {
		return trimmed.split('#', 1)[0].toLowerCase();
	}
}
