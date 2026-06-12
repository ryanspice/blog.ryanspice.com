import type { ResearchLibraryItem, ResearchLibraryVisual } from '$lib/research-library';

const FETCH_TIMEOUT_MS = 12_000;
const USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

export async function enrichResearchLibraryItems(
	items: ResearchLibraryItem[],
	fetchFn: typeof fetch
): Promise<ResearchLibraryItem[]> {
	return await Promise.all(
		items.map(async (item) => {
			const image = item.visuals?.image ?? (await scrapeResearchLibraryImage(item, fetchFn));
			if (!image) return item;

			return {
				...item,
				visuals: {
					...(item.visuals ?? {}),
					image
				}
			};
		})
	);
}

async function scrapeResearchLibraryImage(
	item: ResearchLibraryItem,
	fetchFn: typeof fetch
): Promise<ResearchLibraryVisual | undefined> {
	const sourceUrl = item.url.trim();
	if (!sourceUrl) return undefined;

	let response: Response;
	try {
		response = await fetchWithTimeout(fetchFn, sourceUrl);
	} catch {
		return undefined;
	}

	if (!response.ok) return undefined;

	const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
	if (!contentType.includes('text/html')) return undefined;

	let html = '';
	try {
		html = await response.text();
	} catch {
		return undefined;
	}

	const resolvedUrl = response.url || sourceUrl;
	const ogImage = resolveAbsoluteUrl(
		findMetaContent(html, ['og:image', 'og:image:url', 'og:image:secure_url']),
		resolvedUrl
	);
	const twitterImage = resolveAbsoluteUrl(
		findMetaContent(html, ['twitter:image', 'twitter:image:src']),
		resolvedUrl
	);
	const linkedImage = resolveAbsoluteUrl(findLinkedImage(html), resolvedUrl);
	const firstImage = resolveAbsoluteUrl(findFirstImage(html), resolvedUrl);

	const imageSrc = chooseImageSource(item, ogImage, twitterImage, linkedImage, firstImage);
	if (!imageSrc) return undefined;

	const isBook = item.sourceType === 'book';
	return {
		src: imageSrc,
		alt: `${item.title} ${isBook ? 'cover image' : 'source image'}`,
		sourceHref: resolvedUrl,
		credit: isBook ? 'Book cover or chapter image' : 'Source image',
		position: isBook ? 'center center' : 'center top',
		cardPosition: isBook ? 'center 46%' : 'center center',
		presentation: isBook ? 'focal' : 'row'
	};
}

async function fetchWithTimeout(fetchFn: typeof fetch, url: string): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	try {
		return await fetchFn(url, {
			headers: {
				'user-agent': USER_AGENT
			},
			signal: controller.signal
		});
	} finally {
		clearTimeout(timeout);
	}
}

function chooseImageSource(
	item: ResearchLibraryItem,
	ogImage: string,
	twitterImage: string,
	linkedImage: string,
	firstImage: string
): string {
	if (item.sourceType === 'book') {
		return firstImage || linkedImage || twitterImage || ogImage;
	}

	if (isGenericMetaImage(ogImage) && firstImage) return firstImage;

	return ogImage || twitterImage || linkedImage || firstImage;
}

function isGenericMetaImage(url: string): boolean {
	return /\/og-default\.(?:jpe?g|png|webp)$/i.test(url) || /\/default\.(?:jpe?g|png|webp)$/i.test(url);
}

function findMetaContent(html: string, names: string[]): string {
	const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
	for (const tag of metaTags) {
		const attributes = parseAttributes(tag);
		const key = (attributes.property ?? attributes.name ?? '').toLowerCase();
		if (!key || !names.includes(key)) continue;

		const content = attributes.content?.trim() ?? '';
		if (content) return content;
	}

	return '';
}

function findLinkedImage(html: string): string {
	const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
	for (const tag of linkTags) {
		const attributes = parseAttributes(tag);
		const rel = (attributes.rel ?? '').toLowerCase();
		if (!rel.split(/\s+/).includes('image_src')) continue;

		const href = attributes.href?.trim() ?? '';
		if (href) return href;
	}

	return '';
}

function findFirstImage(html: string): string {
	const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
	for (const tag of imageTags) {
		const attributes = parseAttributes(tag);
		const candidate =
			attributes.src?.trim() ||
			attributes['data-src']?.trim() ||
			attributes['data-original']?.trim() ||
			attributes['data-lazy-src']?.trim() ||
			attributes['data-zoom-image']?.trim();
		if (candidate) return candidate;
	}

	return '';
}

function parseAttributes(tag: string): Record<string, string> {
	const attributes: Record<string, string> = {};
	const attributePattern = /([a-zA-Z_][\w:-]*)\s*=\s*(["'])(.*?)\2/g;
	let match: RegExpExecArray | null = null;

	while ((match = attributePattern.exec(tag))) {
		attributes[match[1].toLowerCase()] = match[3];
	}

	return attributes;
}

function resolveAbsoluteUrl(value: string, baseUrl: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '';

	try {
		const resolved = new URL(trimmed, baseUrl);
		if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return '';
		return resolved.toString();
	} catch {
		return '';
	}
}
