<script lang="ts">
	import { base } from '$app/paths';
	import type { Article } from '$lib/articles';

	type Props = {
		article: Article;
	};

	let { article }: Props = $props();
</script>

<article class="article-card">
	<p class="card-kicker">{article.status} · {article.readingMinutes} min read</p>
	<h2><a href={`${base}/${article.slug}/`}>{article.title}</a></h2>
	<p>{article.summary}</p>
	<div class="tag-row compact" aria-label="Tags">
		{#each article.tags.slice(0, 5) as tag}
			<span class="tag">{tag}</span>
		{/each}
	</div>
</article>
