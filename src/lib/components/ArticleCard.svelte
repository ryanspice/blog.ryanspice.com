<script lang="ts">
	import { base } from '$app/paths';
	import { articleAccentColor } from '$lib/article-accent';
	import { articlePreviewTransitionName, articleTitleTransitionName } from '$lib/view-transitions';
	import type { Article } from '$lib/articles';

	type Props = {
		article: Article;
	};

	let { article }: Props = $props();
	const articleAccent = $derived(articleAccentColor(article));
	const articleHref = $derived(`${base}/${article.slug}/`);
	const previewTransitionName = $derived(articlePreviewTransitionName(article.slug));
	const titleTransitionName = $derived(articleTitleTransitionName(article.slug));
</script>

<a
	class="article-card article-card-link"
	href={articleHref}
	style={`--article-accent: ${articleAccent}`}
	style:view-transition-name={previewTransitionName}
>
	<p class="card-kicker">{article.draftType.replaceAll('-', ' ')}</p>
	<h2 style:view-transition-name={titleTransitionName}>{article.title}</h2>
	<div class="card-meta" aria-label="Article metadata">
		<time datetime={article.date}>{article.dateLabel}</time>
		<span>{article.readingMinutes} min read</span>
	</div>
	<p>{article.summary}</p>
	<div class="tag-row compact" aria-label="Tags">
		{#each article.tags.slice(0, 5) as tag (tag)}
			<span class="tag">{tag}</span>
		{/each}
	</div>
</a>
