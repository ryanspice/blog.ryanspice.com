<script lang="ts">
	import { articleAccentColor } from '$lib/article-accent';
	import { articleHref } from '$lib/article-links';
	import { articlePreviewTransitionName, articleTitleTransitionName } from '$lib/view-transitions';
	import type { Article } from '$lib/articles';

	type Props = {
		article: Article;
		href?: string;
	};

	let { article, href }: Props = $props();
	const articleAccent = $derived(articleAccentColor(article));
	const resolvedHref = $derived(href ?? articleHref(article));
	const previewTransitionName = $derived(articlePreviewTransitionName(article.slug));
	const titleTransitionName = $derived(articleTitleTransitionName(article.slug));
</script>

<a
	class="article-card article-card-link"
	href={resolvedHref}
	style={`--article-accent: ${articleAccent}`}
	style:view-transition-name={previewTransitionName}
>
	<p class="card-kicker">{article.draftType.replaceAll('-', ' ')}</p>
	<h2 style:view-transition-name={titleTransitionName}>{article.title}</h2>
	<div class="card-meta" aria-label="Article metadata">
		<time datetime={article.date}>{article.dateLabel}</time>
		<span>{article.readingMinutes} min read</span>
		{#if article.releaseDateLabel}
			<span>{article.status === 'draft' ? `Releases ${article.releaseDateLabel}` : article.releaseDateLabel}</span>
		{/if}
	</div>
	<p>{article.summary}</p>
	<div class="tag-row compact" aria-label="Tags">
		{#each article.tags.slice(0, 5) as tag (tag)}
			<span class="tag">{tag}</span>
		{/each}
	</div>
</a>
