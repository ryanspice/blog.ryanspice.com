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
