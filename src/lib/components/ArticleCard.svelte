<script lang="ts">
	import { base } from '$app/paths';
	import type { Article } from '$lib/articles';

	type Props = {
		article: Article;
	};

	let { article }: Props = $props();
</script>

<article class="article-card">
	<p class="card-kicker">{article.draftType.replaceAll('-', ' ')}</p>
	<h2><a href={`${base}/${article.slug}/`}>{article.title}</a></h2>
	<div class="card-meta" aria-label="Article metadata">
		<time datetime={article.date}>{article.dateLabel}</time>
		<span>{article.readingMinutes} min read</span>
	</div>
	<p>{article.summary}</p>
	{#if article.design.cardPalette?.colors.length}
		<div class="card-palette" aria-label={article.design.cardPalette.label}>
			{#each article.design.cardPalette.colors.slice(0, 5) as color (color)}
				<span class="card-swatch" style={`background:${color}`}></span>
			{/each}
		</div>
	{/if}
	<div class="tag-row compact" aria-label="Tags">
		{#each article.tags.slice(0, 5) as tag (tag)}
			<span class="tag">{tag}</span>
		{/each}
	</div>
</article>
