export type ArticleSocialTarget = 'facebook' | 'x' | 'linkedin';

export function articleSocialShareHref(target: ArticleSocialTarget, url: string, title: string): string {
	const shareUrl = url.trim();
	const shareTitle = title.trim();

	if (target === 'facebook') {
		const params = new URLSearchParams({ u: shareUrl });
		return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
	}

	if (target === 'x') {
		const params = new URLSearchParams({ url: shareUrl, text: shareTitle });
		return `https://twitter.com/intent/tweet?${params.toString()}`;
	}

	const params = new URLSearchParams({ url: shareUrl });
	return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}
