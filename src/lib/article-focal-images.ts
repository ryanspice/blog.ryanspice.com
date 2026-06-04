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
