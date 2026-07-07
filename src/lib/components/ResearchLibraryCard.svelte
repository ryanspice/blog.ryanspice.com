<script lang="ts">
	import { researchLibraryCardImage, researchLibraryCardImagePresentation } from '$lib/research-library-visuals';
	import type { ResearchLibraryItem } from '$lib/research-library';

	type Props = {
		item: ResearchLibraryItem;
	};

	let { item }: Props = $props();

	const sourceTypeLabel = $derived(item.sourceType.replaceAll('-', ' '));
	const image = $derived(researchLibraryCardImage(item));
	const imagePresentation = $derived(researchLibraryCardImagePresentation(item));
	const hasRowImage = $derived(imagePresentation === 'row');
	const hasFocalImage = $derived(imagePresentation === 'focal');

	function cssImageUrl(src: string | undefined): string | undefined {
		return src ? `url("${src.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")` : undefined;
	}
</script>

<a
	class={`article-card article-card-link${hasRowImage ? ' has-row-image' : ''}${hasFocalImage ? ' has-focal-image' : ''}`}
	href={item.url}
	rel="noreferrer"
	target="_blank"
	style:--article-accent="#00aeef"
	style:--article-row-image={hasRowImage ? cssImageUrl(image?.src) : undefined}
	style:--article-row-position={hasRowImage ? image?.cardPosition ?? image?.position ?? 'center center' : undefined}
	style:--article-focal-image={hasFocalImage ? cssImageUrl(image?.src) : undefined}
	style:--article-focal-position={hasFocalImage ? image?.cardPosition ?? image?.position ?? 'center center' : undefined}
>
	{#if image && hasRowImage}
		<span class="article-card-image" aria-hidden="true"></span>
	{:else if image && hasFocalImage}
		<span class="article-card-focal" aria-hidden="true"></span>
	{/if}
	<div class="article-card-content">
		<p class="card-kicker">{sourceTypeLabel}</p>
		<h2>{item.title}</h2>
		{#if item.authors || item.year}
			<div class="card-meta" aria-label={`Metadata for ${item.title}`}>
				{#if item.authors}
					<span>{item.authors}</span>
				{/if}
				{#if item.year}
					<span>{item.year}</span>
				{/if}
			</div>
		{/if}
		<p>{item.note}</p>
		<dl class="hero-meta" aria-label={`Library metadata for ${item.title}`}>
			<div><dt>Domains</dt><dd>{item.domains.join(', ')}</dd></div>
			<div><dt>Used by</dt><dd>{item.usedBy.join(', ')}</dd></div>
		</dl>
	</div>
</a>
