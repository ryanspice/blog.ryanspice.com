export type ImagePreset = 'hero' | 'content' | 'inline' | 'thumb' | 'icon';

export type ImageFormat = 'avif' | 'webp' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'svg';

export type ImageSource = {
	type?: string;
	srcset: string;
	media?: string;
	sizes?: string;
};

export type ImageSourceMap = Partial<Record<ImageFormat, string | ImageSource>>;

export type WikiImageMeta = {
	src: string;
	width?: number;
	height?: number;
	alt?: string;
	caption?: string;
	attribution?: string;
	sources?: ImageSource[] | ImageSourceMap;
	srcset?: string;
	sizes?: string;
	placeholder?: string;
	dominantColor?: string;
};

export type NormalizedWikiImage = Required<Pick<WikiImageMeta, 'src'>> &
	Omit<WikiImageMeta, 'src' | 'sources'> & {
		sources: ImageSource[];
	};

const FORMAT_TYPES: Record<ImageFormat, string> = {
	avif: 'image/avif',
	webp: 'image/webp',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	svg: 'image/svg+xml'
};

const FORMAT_ORDER: ImageFormat[] = ['avif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'svg'];

export function imagePresetSizes(preset: ImagePreset): string | undefined {
	if (preset === 'hero') return '(min-width: 1120px) 1040px, calc(100vw - 32px)';
	if (preset === 'content') return '(min-width: 1040px) 760px, calc(100vw - 32px)';
	if (preset === 'inline') return '(min-width: 820px) 640px, calc(100vw - 32px)';
	if (preset === 'thumb') return '(min-width: 700px) 320px, 45vw';
	return undefined;
}

export function normalizeWikiImage(input: string | WikiImageMeta, sizes?: string): NormalizedWikiImage {
	const image: WikiImageMeta = typeof input === 'string' ? { src: input } : input;
	return {
		...image,
		src: image.src,
		sizes: image.sizes ?? sizes,
		sources: normalizeImageSources(image.sources, image.sizes ?? sizes)
	};
}

export function normalizeImageSources(sources: WikiImageMeta['sources'], sizes?: string): ImageSource[] {
	if (!sources) return [];

	if (Array.isArray(sources)) {
		return sources
			.filter((source) => source.srcset.trim().length > 0)
			.map((source) => ({ ...source, sizes: source.sizes ?? sizes }));
	}

	return FORMAT_ORDER.flatMap((format) => {
		const source = sources[format];
		if (!source) return [];
		if (typeof source === 'string') {
			return [{ type: FORMAT_TYPES[format], srcset: source, sizes }];
		}
		return [{ type: source.type ?? FORMAT_TYPES[format], srcset: source.srcset, media: source.media, sizes: source.sizes ?? sizes }];
	});
}

export function imageAspectRatio(width?: number, height?: number): string | undefined {
	if (!width || !height) return undefined;
	return `${width} / ${height}`;
}
