import type { ResearchLibraryItem, ResearchLibraryImagePresentation, ResearchLibraryVisual } from '$lib/research-library';

export function researchLibraryCardImage(item: ResearchLibraryItem | null | undefined): ResearchLibraryVisual | undefined {
	return item?.visuals?.image;
}

export function researchLibraryCardImagePresentation(
	item: ResearchLibraryItem | null | undefined
): ResearchLibraryImagePresentation | null {
	const image = researchLibraryCardImage(item);
	if (!image) return null;

	return image.presentation ?? 'row';
}

export function researchLibraryCardCssVars(item: ResearchLibraryItem | null | undefined): string {
	const image = researchLibraryCardImage(item);
	if (!image) return '';

	const position = image.cardPosition ?? image.position ?? 'center center';
	const escapedSrc = escapeCssUrl(image.src);

	if ((image.presentation ?? 'row') === 'focal') {
		return [`--article-focal-image: url("${escapedSrc}")`, `--article-focal-position: ${position}`].join('; ');
	}

	return [`--article-row-image: url("${escapedSrc}")`, `--article-row-position: ${position}`].join('; ');
}

function escapeCssUrl(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n|\r/g, '');
}
