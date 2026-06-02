<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';
	import {
		imageAspectRatio,
		imagePresetSizes,
		normalizeImageSources,
		normalizeWikiImage,
		type ImagePreset,
		type ImageSource,
		type WikiImageMeta
	} from '$lib/images';

	type BaseImgProps = Omit<
		HTMLImgAttributes,
		| 'src'
		| 'alt'
		| 'width'
		| 'height'
		| 'loading'
		| 'decoding'
		| 'fetchpriority'
		| 'class'
		| 'sizes'
		| 'srcset'
	>;

	type Props = BaseImgProps & {
		src?: string;
		image?: WikiImageMeta;
		alt?: string;
		caption?: string;
		attribution?: string;
		preset?: ImagePreset;
		sources?: ImageSource[] | WikiImageMeta['sources'];
		srcset?: string;
		sizes?: string;
		width?: number | string;
		height?: number | string;
		loading?: 'eager' | 'lazy';
		decoding?: 'sync' | 'async' | 'auto';
		fetchpriority?: 'high' | 'low' | 'auto';
		class?: string;
		figureClass?: string;
		pictureClass?: string;
		imgClass?: string;
		captionClass?: string;
		style?: string;
		placeholder?: string;
		dominantColor?: string;
		children?: Snippet;
		onload?: (event: Event) => void;
		onerror?: (event: Event) => void;
	};

	let {
		src,
		image,
		alt,
		caption,
		attribution,
		preset = 'content',
		sources,
		srcset,
		sizes,
		width,
		height,
		loading,
		decoding = 'async',
		fetchpriority,
		class: className = '',
		figureClass = '',
		pictureClass = '',
		imgClass = '',
		captionClass = '',
		style = '',
		placeholder,
		dominantColor,
		children,
		onload,
		onerror,
		...rest
	}: Props = $props();

	const fallbackMeta = $derived(image ?? (src ? { src } : undefined));
	const resolvedSizes = $derived(sizes ?? fallbackMeta?.sizes ?? imagePresetSizes(preset));
	const resolved = $derived(fallbackMeta ? normalizeWikiImage(fallbackMeta, resolvedSizes) : null);
	const resolvedSources = $derived(normalizeImageSources(sources ?? resolved?.sources, resolvedSizes));
	const resolvedSrcset = $derived(srcset ?? resolved?.srcset);
	const resolvedAlt = $derived(alt ?? resolved?.alt ?? '');
	const resolvedCaption = $derived(caption ?? resolved?.caption);
	const resolvedAttribution = $derived(attribution ?? resolved?.attribution);
	const resolvedPlaceholder = $derived(placeholder ?? resolved?.placeholder);
	const resolvedDominantColor = $derived(dominantColor ?? resolved?.dominantColor);
	const resolvedWidth = $derived(width ?? resolved?.width);
	const resolvedHeight = $derived(height ?? resolved?.height);
	const resolvedLoading = $derived(loading ?? (preset === 'hero' ? 'eager' : 'lazy'));
	const resolvedFetchpriority = $derived(fetchpriority ?? (preset === 'hero' ? 'high' : 'auto'));
	const ratio = $derived(
		imageAspectRatio(
			typeof resolvedWidth === 'number' ? resolvedWidth : resolved?.width,
			typeof resolvedHeight === 'number' ? resolvedHeight : resolved?.height
		)
	);
	const hasFigure = $derived(Boolean(resolvedCaption || resolvedAttribution || children));
	const figureClasses = $derived(['wiki-image', `wiki-image--${preset}`, className, figureClass].filter(Boolean).join(' '));
	const pictureClasses = $derived(['wiki-image__picture', pictureClass].filter(Boolean).join(' '));
	const imgClasses = $derived(['wiki-image__img', imgClass].filter(Boolean).join(' '));
	const captionClasses = $derived(['wiki-image__caption', captionClass].filter(Boolean).join(' '));
	const frameStyle = $derived(
		[
			ratio ? `--wiki-image-ratio: ${ratio}` : '',
			resolvedDominantColor ? `--wiki-image-bg: ${resolvedDominantColor}` : '',
			style
		]
			.filter(Boolean)
			.join('; ')
	);
</script>

{#if resolved}
	<svelte:element this={hasFigure ? 'figure' : 'span'} class={figureClasses} style={frameStyle || undefined}>
		<picture class={pictureClasses} style={resolvedPlaceholder ? `background-image: url('${resolvedPlaceholder}')` : undefined}>
			{#each resolvedSources as source, index (`${source.type ?? 'source'}:${source.media ?? ''}:${index}`)}
				<source type={source.type} media={source.media} srcset={source.srcset} sizes={source.sizes ?? resolvedSizes} />
			{/each}
			<img
				{...rest}
				class={imgClasses}
				src={resolved.src}
				srcset={resolvedSrcset}
				sizes={resolvedSizes}
				alt={resolvedAlt}
				width={resolvedWidth}
				height={resolvedHeight}
				loading={resolvedLoading}
				fetchpriority={resolvedFetchpriority}
				{decoding}
				onload={onload}
				onerror={onerror}
			/>
		</picture>
		{#if children}
			{@render children()}
		{:else if resolvedCaption || resolvedAttribution}
			<figcaption class={captionClasses}>
				{#if resolvedCaption}<span>{resolvedCaption}</span>{/if}
				{#if resolvedAttribution}<cite>{resolvedAttribution}</cite>{/if}
			</figcaption>
		{/if}
	</svelte:element>
{/if}

<style>
	.wiki-image {
		display: block;
		margin: 0;
		color: inherit;
	}

	.wiki-image__picture {
		display: block;
		position: relative;
		overflow: hidden;
		background: var(--wiki-image-bg, rgba(255, 255, 255, 0.035));
		background-size: cover;
		aspect-ratio: var(--wiki-image-ratio, auto);
	}

	.wiki-image__img {
		display: block;
		width: 100%;
		height: auto;
		max-width: 100%;
	}

	.wiki-image--thumb .wiki-image__img,
	.wiki-image--icon .wiki-image__img {
		width: auto;
	}

	.wiki-image__caption {
		display: grid;
		gap: 4px;
		font-size: 0.875rem;
		line-height: 1.45;
	}

	.wiki-image__caption cite {
		font-style: normal;
		opacity: 0.72;
	}
</style>
