export type ArticleFocalImage = {
	src: string;
	alt: string;
	credit?: string;
	sourceHref?: string;
	position?: string;
	cardPosition?: string;
};

type ArticleLike = {
	slug: string;
	visuals?: {
		focal?: ArticleFocalImage;
		row?: ArticleFocalImage;
		background?: ArticleFocalImage;
	};
};

const focalImages: Record<string, ArticleFocalImage> = {
	'openjarvis-local-ai-personal-ai-on-your-pc': {
		src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
		alt: 'Close-up stock photo of a computer circuit board, used as background flair for a local AI article.',
		credit: 'Stock photo via Unsplash',
		sourceHref: 'https://unsplash.com/s/photos/computer-chip',
		position: 'center center',
		cardPosition: 'center 48%'
	}
};

export function articleFocalImage(article: ArticleLike | null | undefined): ArticleFocalImage | undefined {
	if (!article?.slug) return undefined;
	if (article.visuals?.focal?.src) return normalizeImage(article.visuals.focal);
	return focalImages[article.slug];
}

export function articleFocalCardCssVars(article: ArticleLike | null | undefined): string {
	const image = articleFocalImage(article);
	if (!image) return '';
	return focalCssVars(image, image.cardPosition ?? image.position ?? 'center center');
}

export function articleFocalPageCssVars(article: ArticleLike | null | undefined): string {
	const image = articleFocalImage(article);
	if (!image) return '';
	return focalCssVars(image, image.position ?? 'center center');
}

export const articleFocalCssVars = articleFocalCardCssVars;

function focalCssVars(image: ArticleFocalImage, position: string): string {
	return [`--article-focal-image: url("${image.src}")`, `--article-focal-position: ${position}`].join('; ');
}

export function articleRowImage(article: ArticleLike | null | undefined): ArticleFocalImage | undefined {
	if (!article?.visuals?.row?.src) return undefined;

	return normalizeImage(article.visuals.row);
}

export function articleCardBackgroundImage(article: ArticleLike | null | undefined): ArticleFocalImage | undefined {
	if (!article?.visuals?.background?.src) return undefined;

	return normalizeImage(article.visuals.background);
}

export function articleCardImage(article: ArticleLike | null | undefined): ArticleFocalImage | undefined {
	return articleRowImage(article) ?? articleFocalImage(article);
}

export function articleCardCssVars(article: ArticleLike | null | undefined): string {
	const image = articleRowImage(article);
	if (!image) return articleFocalCardCssVars(article);
	return rowCssVars(image);
}

function rowCssVars(image: ArticleFocalImage): string {
	return [
		`--article-row-image: url("${image.src}")`,
		`--article-row-position: ${image.position ?? image.cardPosition ?? 'center center'}`
	].join('; ');
}

function normalizeImage(image: ArticleFocalImage): ArticleFocalImage {
	return {
		src: image.src,
		alt: image.alt || 'Article visual image',
		...(image.credit ? { credit: image.credit } : {}),
		...(image.sourceHref ? { sourceHref: image.sourceHref } : {}),
		...(image.position ? { position: image.position } : {})
	};
}
