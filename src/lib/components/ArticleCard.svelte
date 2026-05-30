<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { articleAccentColor } from '$lib/article-accent';
	import { articleTitleTransitionName, runViewTransition } from '$lib/view-transitions';
	import type { Article } from '$lib/articles';

	type Props = {
		article: Article;
	};

	let { article }: Props = $props();
	const articleAccent = $derived(articleAccentColor(article));
	const articleHref = $derived(`${base}/${article.slug}/`);
	const titleTransitionName = $derived(articleTitleTransitionName(article.slug));

	function navigateToArticle(event: MouseEvent) {
		if (
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}

		event.preventDefault();
		void runViewTransition(() => goto(articleHref));
	}
</script>

<article class="article-card" style={`--article-accent: ${articleAccent}`}>
	<p class="card-kicker">{article.draftType.replaceAll('-', ' ')}</p>
	<h2 style:view-transition-name={titleTransitionName}>
		<a href={articleHref} onclick={navigateToArticle}>{article.title}</a>
	</h2>
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
</article>
