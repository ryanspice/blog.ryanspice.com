<script lang="ts">
	import type { Article } from '$lib/articles';
	import SafeHtml from '$lib/components/SafeHtml.svelte';

	type Props = {
		article: Article;
	};

	let { article }: Props = $props();
</script>

<aside class="rail-card" aria-label={article.design.railTitle}>
	<h2>{article.design.railTitle}</h2>
	<SafeHtml as="p" html={article.design.railBodyHtml} />
	{#if article.design.railStatusItems?.length}
		<div class="status-grid" aria-label="Publishing controls">
			{#each article.design.railStatusItems as item, index (item.label + ':' + index)}
				<div class="status-pill"><span>{item.label}</span><strong>{item.value}</strong></div>
			{/each}
		</div>
	{/if}
	{#if article.design.railPalette}
		<div class="palette-preview" aria-label={article.design.railPalette.label}>
			{#each article.design.railPalette.colors as color, index (color + ':' + index)}
				<span class="swatch" style:background={color}></span>
			{/each}
		</div>
	{/if}
	{#if article.design.railChips?.length}
		<div class="debug-stack" aria-label={article.design.railChipsLabel ?? 'Debugging stack'}>
			{#each article.design.railChips as chip, index (chip + ':' + index)}
				<span class="debug-chip">{chip}</span>
			{/each}
		</div>
	{/if}
	<SafeHtml class="callout" html={article.design.railCalloutHtml} />
</aside>
