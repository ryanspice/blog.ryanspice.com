import type { Article } from '$lib/articles';

export function articleAccentColor(article: Pick<Article, 'design'>): string {
	return article.design.cardPalette?.colors[0] ?? article.design.railPalette?.colors[0] ?? 'var(--accent)';
}
